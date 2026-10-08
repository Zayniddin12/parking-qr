"""QR token encryption (AES-CBC) — matches the reader's implementation.

Each issued check encodes an ENCRYPTED token, not a plain id. Plaintext:

    "<PARTNER_KEY>: <issued_at_seconds>"     e.g.  "MEGA-1: 1784031609"

encrypted with **AES-CBC** (PKCS7) under a shared secret STRING
(`PARTNER_QR_SECRET`, used as raw UTF-8 key bytes) and a per-check random 16-byte
IV. The reader device is handed the same secret string and decrypts offline.

Wire format (what the QR contains):

    base64( iv(16) || ciphertext )

- secret: `PARTNER_QR_SECRET` — a 16, 24 or 32 character string (AES-128/192/256).
          Used directly as key bytes: `key = secret.encode("utf-8")`.
- iv:     get_random_bytes(16), prepended to the ciphertext.
- timestamp: seconds since epoch (not microseconds).

Reader side (matches the reader's own code):

    iv, ct = raw[:16], raw[16:]
    pt = unpad(AES.new(secret.encode(), AES.MODE_CBC, iv).decrypt(ct), 16)  # "<KEY>: <seconds>"
"""
from __future__ import annotations

import base64
import os
import time

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

_IV_LEN = 16

# Default DEV secret (32-char string → AES-256). Override with PARTNER_QR_SECRET.
_DEFAULT_SECRET = "34dacc356411cb44dd5f0ba9b98fa610"


def _secret() -> bytes:
    raw = os.environ.get("PARTNER_QR_SECRET", _DEFAULT_SECRET)
    key = raw.encode("utf-8")
    if len(key) not in (16, 24, 32):
        raise RuntimeError(
            "PARTNER_QR_SECRET must be a 16, 24 or 32 character string "
            f"(got {len(key)} bytes)"
        )
    return key


def secret_str() -> str:
    """The shared secret string to hand out to reader devices."""
    return _secret().decode("utf-8")


def now_seconds() -> int:
    return int(time.time())


def encrypt_token(
    partner_key: str,
    issued_at_seconds: int | None = None,
    iv: bytes | None = None,
) -> tuple[str, int]:
    """Return (qr_token, issued_at_seconds). `iv` is only injected in tests."""
    ts = issued_at_seconds if issued_at_seconds is not None else now_seconds()
    plaintext = f"{partner_key}: {ts}".encode()
    iv = iv if iv is not None else get_random_bytes(_IV_LEN)
    cipher = AES.new(_secret(), AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))
    token = base64.b64encode(iv + ciphertext).decode()
    return token, ts


def decrypt_token(token: str) -> dict:
    """Decrypt a QR token → {partnerKey, issuedAtSeconds, issuedAt}. For our own
    tests / reference only — real readers do this themselves."""
    raw = base64.b64decode(token)
    if len(raw) < _IV_LEN + AES.block_size:
        raise ValueError("Token too short")
    iv, ciphertext = raw[:_IV_LEN], raw[_IV_LEN:]
    cipher = AES.new(_secret(), AES.MODE_CBC, iv)
    plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size).decode()
    key, _, ts_s = plaintext.partition(": ")
    ts = int(ts_s)
    return {
        "partnerKey": key,
        "issuedAtSeconds": ts,
        "issuedAt": _iso_from_seconds(ts),
    }


def _iso_from_seconds(seconds: int) -> str:
    from datetime import datetime, timezone

    return datetime.fromtimestamp(seconds, tz=timezone.utc).isoformat()
