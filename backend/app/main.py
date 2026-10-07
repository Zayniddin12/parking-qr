"""AutoParking — Partner Service (standalone).

A small, self-contained backend for the Partner module: partner accounts
(managed from the Business Panel) and the QR validation checks partners issue
from the Partner Landing. Intentionally separate from the main Management plane
for now; the API shape mirrors what will later fold into FastAPI Management.

Endpoints
  Admin (Business Panel)      Partner (Landing, Bearer)
  ─────────────────────       ─────────────────────────
  GET    /partners            POST /auth/login
  POST   /partners            GET  /me
  GET    /partners/{id}       POST /checks
  PATCH  /partners/{id}       GET  /checks
  DELETE /partners/{id}
  GET    /partners/{id}/checks
"""
from __future__ import annotations

from datetime import timezone
import secrets
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .crypto import encrypt_token
from .db import Check, Partner, SessionLocal, init_db
from .security import create_token, decode_token, hash_password, verify_password
from .seed import seed_if_empty

app = FastAPI(title="AutoParking Partner Service", version="0.1.0")

# Standalone demo service — allow any origin (browser calls it directly).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _check_id() -> str:
    return "AP-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))


# --- DB session dependency -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- serializers (camelCase, matches the React clients) --------------------
def _iso_utc(dt) -> str:
    """SQLite drops tzinfo; stored values are UTC, so re-attach it before serialising."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def partner_out(p: Partner) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "key": p.key,
        "email": p.email,
        "logoUrl": p.logo_url,
        "freeMinutes": p.free_minutes,
        "note": p.note,
        "active": p.active,
        "createdAt": _iso_utc(p.created_at),
    }


def check_out(c: Check) -> dict:
    return {
        "id": c.id,
        "partnerId": c.partner_id,
        "plate": c.plate,
        "code": c.code,
        "createdAt": _iso_utc(c.created_at),
    }


# --- request bodies --------------------------------------------------------
class PartnerCreate(BaseModel):
    name: str
    key: str = Field(min_length=2, max_length=32)
    email: str
    password: str = Field(min_length=6)
    logoUrl: str | None = None
    freeMinutes: int = 120
    note: str | None = None


class PartnerUpdate(BaseModel):
    name: str | None = None
    key: str | None = None
    email: str | None = None
    password: str | None = None
    logoUrl: str | None = None
    freeMinutes: int | None = None
    note: str | None = None
    active: bool | None = None


class LoginBody(BaseModel):
    email: str
    password: str


class CheckCreate(BaseModel):
    # Plate is optional — partners just tap "create QR"; the token carries only
    # the partner key + timestamp.
    plate: str | None = None


# --- auth dependency (partner landing) -------------------------------------
def current_partner(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> Partner:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    partner_id = decode_token(authorization.split(" ", 1)[1])
    if not partner_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    partner = db.get(Partner, partner_id)
    if not partner or not partner.active:
        raise HTTPException(status_code=401, detail="Account inactive")
    return partner


@app.on_event("startup")
def _startup() -> None:
    init_db()
    seed_if_empty(SessionLocal)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


# =========================================================================
# Admin — partner directory (Business Panel)
# =========================================================================
@app.get("/partners")
def list_partners(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Partner).order_by(Partner.created_at.desc())).all()
    return [partner_out(p) for p in rows]


def _norm_key(raw: str) -> str:
    return raw.strip().upper()


@app.post("/partners", status_code=201)
def create_partner(body: PartnerCreate, db: Session = Depends(get_db)) -> dict:
    email = body.email.strip().lower()
    key = _norm_key(body.key)
    if db.scalar(select(Partner).where(Partner.email == email)):
        raise HTTPException(status_code=409, detail="Email already exists")
    if db.scalar(select(Partner).where(Partner.key == key)):
        raise HTTPException(status_code=409, detail="Key already exists")
    p = Partner(
        id=uuid.uuid4().hex,
        name=body.name.strip(),
        key=key,
        email=email,
        password_hash=hash_password(body.password),
        logo_url=body.logoUrl,
        free_minutes=body.freeMinutes,
        note=body.note,
        active=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return partner_out(p)


@app.get("/partners/{partner_id}")
def get_partner(partner_id: str, db: Session = Depends(get_db)) -> dict:
    p = db.get(Partner, partner_id)
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner_out(p)


@app.patch("/partners/{partner_id}")
def update_partner(partner_id: str, body: PartnerUpdate, db: Session = Depends(get_db)) -> dict:
    p = db.get(Partner, partner_id)
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    if body.name is not None:
        p.name = body.name.strip()
    if body.key is not None:
        new_key = _norm_key(body.key)
        clash = db.scalar(select(Partner).where(Partner.key == new_key, Partner.id != p.id))
        if clash:
            raise HTTPException(status_code=409, detail="Key already exists")
        p.key = new_key
    if body.email is not None:
        p.email = body.email.strip().lower()
    if body.password:
        p.password_hash = hash_password(body.password)
    if body.logoUrl is not None:
        p.logo_url = body.logoUrl or None
    if body.freeMinutes is not None:
        p.free_minutes = body.freeMinutes
    if body.note is not None:
        p.note = body.note or None
    if body.active is not None:
        p.active = body.active
    db.commit()
    db.refresh(p)
    return partner_out(p)


@app.delete("/partners/{partner_id}")
def delete_partner(partner_id: str, db: Session = Depends(get_db)) -> dict:
    p = db.get(Partner, partner_id)
    if p:
        db.delete(p)
        db.commit()
    return {"ok": True}


@app.get("/partners/{partner_id}/checks")
def partner_checks(partner_id: str, db: Session = Depends(get_db)) -> list[dict]:
    if not db.get(Partner, partner_id):
        raise HTTPException(status_code=404, detail="Partner not found")
    rows = db.scalars(
        select(Check).where(Check.partner_id == partner_id).order_by(Check.created_at.desc())
    ).all()
    return [check_out(c) for c in rows]


# =========================================================================
# Partner — landing (Bearer)
# =========================================================================
@app.post("/auth/login")
def login(body: LoginBody, db: Session = Depends(get_db)) -> dict:
    p = db.scalar(select(Partner).where(Partner.email == body.email.strip().lower()))
    if not p or not verify_password(body.password, p.password_hash):
        raise HTTPException(status_code=401, detail="Email yoki parol noto‘g‘ri")
    if not p.active:
        raise HTTPException(status_code=403, detail="Account inactive")
    return {"token": create_token(p.id, p.email), "partner": partner_out(p)}


@app.get("/me")
def me(partner: Partner = Depends(current_partner)) -> dict:
    return partner_out(partner)


@app.post("/checks", status_code=201)
def issue_check(
    body: CheckCreate,
    partner: Partner = Depends(current_partner),
    db: Session = Depends(get_db),
) -> dict:
    # Plate is optional now; keep it if provided, else store an empty string
    # (the existing DB column is NOT NULL, so avoid None).
    plate = body.plate.upper().replace(" ", "") if body.plate else ""
    # Encrypted QR token: AES-CBC("<partner_key>: <seconds>") under the shared secret.
    qr_token, _ts = encrypt_token(partner.key)
    c = Check(
        id=_check_id(),
        partner_id=partner.id,
        plate=plate,
        code=qr_token,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return check_out(c)


@app.get("/checks")
def my_checks(
    partner: Partner = Depends(current_partner),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Check).where(Check.partner_id == partner.id).order_by(Check.created_at.desc())
    ).all()
    return [check_out(c) for c in rows]

# Note: the service does NOT decode QR tokens. Reader/lane devices decrypt them
# themselves, offline, with the shared secret (PARTNER_QR_SECRET). The token
# scheme is documented in app/crypto.py + README so a reader can reimplement it
# in any language.
