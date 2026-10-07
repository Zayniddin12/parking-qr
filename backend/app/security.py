"""Password hashing (stdlib pbkdf2) + partner JWT (HS256).

Deliberately dependency-light: no bcrypt/passlib. pbkdf2-hmac-sha256 with a
per-password random salt is fine for this standalone service; the token is a
short-lived signed JWT carrying only the partner id.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

_JWT_SECRET = os.environ.get("PARTNER_JWT_SECRET", "dev-insecure-change-me")
_JWT_ALG = "HS256"
_TOKEN_TTL_DAYS = int(os.environ.get("PARTNER_TOKEN_TTL_DAYS", "30"))
_PBKDF2_ROUNDS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, rounds, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    if algo != "pbkdf2_sha256":
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
    return hmac.compare_digest(dk.hex(), hash_hex)


def create_token(partner_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": partner_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=_TOKEN_TTL_DAYS)).timestamp()),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALG)


def decode_token(token: str) -> str | None:
    """Return the partner id (sub) for a valid token, else None."""
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALG])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
