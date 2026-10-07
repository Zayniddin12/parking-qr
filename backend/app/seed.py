"""Seed demo partners + checks on first boot (mirrors the React demo data)."""
from __future__ import annotations

import uuid
from datetime import timedelta

from sqlalchemy import select

from .crypto import encrypt_token
from .db import Check, Partner, now_utc
from .security import hash_password


def seed_if_empty(session_factory) -> None:  # noqa: ANN001
    db = session_factory()
    try:
        if db.scalar(select(Partner).limit(1)):
            return

        now = now_utc()

        def hrs(h: int):
            return now - timedelta(hours=h)

        partners = [
            Partner(
                id="p-mega",
                name="MEGA Planet",
                key="MEGA-1",
                email="mega@partners.autoparking.uz",
                password_hash=hash_password("mega12345"),
                free_minutes=180,
                note="Xaridorlar uchun 3 soat bepul turargoh",
                active=True,
                created_at=hrs(72),
            ),
            Partner(
                id="p-chinor",
                name="Chinor Cafe",
                key="CHN-1",
                email="chinor@partners.autoparking.uz",
                password_hash=hash_password("chinor123"),
                free_minutes=120,
                note="Mehmonlar uchun 2 soat bepul",
                active=True,
                created_at=hrs(40),
            ),
        ]
        db.add_all(partners)

        keys = {"p-mega": "MEGA-1", "p-chinor": "CHN-1"}
        demo_checks = [
            ("p-mega", "01A001AA", 3),
            ("p-mega", "01B234BC", 11),
            ("p-mega", "30A777AA", 28),
            ("p-chinor", "01M555MM", 5),
        ]
        for partner_id, plate, ago in demo_checks:
            issued_at = hrs(ago)
            secs = int(issued_at.timestamp())
            token, _ = encrypt_token(keys[partner_id], secs)
            db.add(
                Check(
                    id="AP-" + uuid.uuid4().hex[:6].upper(),
                    partner_id=partner_id,
                    plate=plate,
                    code=token,
                    created_at=issued_at,
                )
            )
        db.commit()
    finally:
        db.close()
