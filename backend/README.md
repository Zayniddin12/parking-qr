# AutoParking — Partner Service (standalone)

A small, self-contained backend for the **Partner module**: partner accounts
(managed from the Business Panel) and the QR validation checks partners issue
from the Partner Landing. Deliberately **separate** from the main Management
plane for now — later it folds into FastAPI Management (the API shape already
mirrors it).

Stack: **FastAPI + SQLAlchemy 2.0 + SQLite**, PyJWT tokens, stdlib pbkdf2
password hashing. No heavy deps.

## Run (Docker, whole stack)

From the repo root:

```bash
docker compose -f docker-compose.partner.yml up --build
```

| Service          | URL                              |
|------------------|----------------------------------|
| Partner landing  | http://localhost:8082            |
| Business panel   | http://localhost:8081/partners   |
| Partner API      | http://localhost:8090 (`/docs`)  |

Demo login (landing): `mega@partners.autoparking.uz` / `mega12345`
(also `chinor@partners.autoparking.uz` / `chinor123`).

## Run (backend only, local)

```bash
cd partner-backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
PARTNER_DB_PATH=./partner.db uvicorn app.main:app --port 8090
```

Then run a frontend against it, e.g.:

```bash
cd ../Frontend
VITE_PARTNER_API_URL=http://localhost:8090 pnpm --filter partner-landing dev
```

## Endpoints

| Method | Path                       | Auth        | Purpose                       |
|--------|----------------------------|-------------|-------------------------------|
| GET    | `/healthz`                 | –           | Health check                  |
| GET    | `/partners`                | admin\*     | List partners                 |
| POST   | `/partners`                | admin\*     | Create partner                |
| GET    | `/partners/{id}`           | admin\*     | Get partner                   |
| PATCH  | `/partners/{id}`           | admin\*     | Update partner / credentials  |
| DELETE | `/partners/{id}`           | admin\*     | Delete partner                |
| GET    | `/partners/{id}/checks`    | admin\*     | Partner's issued checks       |
| POST   | `/auth/login`              | –           | Partner login → JWT           |
| GET    | `/me`                      | partner JWT | Current partner               |
| POST   | `/checks`                  | partner JWT | Issue an encrypted QR check   |
| GET    | `/checks`                  | partner JWT | My issued checks              |

\* The admin (Business-Panel) routes are open in this standalone demo. When the
module folds into Management they inherit its Keycloak JWT + tenant RLS.

The service **does not decode** QR tokens — reader/lane devices decrypt them
themselves, offline, with the shared secret. The secret is provisioned to
readers out-of-band (never exposed by an endpoint).

## QR token scheme (for the reader/lane team)

Each partner has a short **key** (e.g. `BKF-1`). On issue, the plaintext

```
<KEY>: <issued_at_seconds>        e.g.  "BKF-1: 1784031873"
```

is encrypted with **AES-CBC** (PKCS7) under the shared secret and packed as:

```
QR text  =  base64( iv(16) || ciphertext )
```

- `PARTNER_QR_SECRET` — a **16/24/32 character string** (AES-128/192/256). Used
  directly as the key bytes (`key = secret.encode("utf-8")`), NOT hex-decoded.
  Given to readers out-of-band.
- `iv` — 16 random bytes per check (`get_random_bytes(16)`), prepended to the
  ciphertext (the reader reads it from there).
- timestamp — **seconds** since epoch.

Reader side (Python / PyCryptodome):

```python
raw = base64.b64decode(qr_text)
iv, ct = raw[:16], raw[16:]
pt = unpad(AES.new(secret.encode(), AES.MODE_CBC, iv).decrypt(ct), 16)   # b"<KEY>: <seconds>"
```

Reference implementation: `app/crypto.py`.

## Config (env)

| Var                    | Default                | Notes                          |
|------------------------|------------------------|--------------------------------|
| `PARTNER_DB_PATH`      | `/data/partner.db`     | SQLite file path               |
| `PARTNER_JWT_SECRET`   | `dev-insecure-change-me` | HS256 signing key — change it |
| `PARTNER_TOKEN_TTL_DAYS` | `30`                 | Partner token lifetime         |

On first boot the DB is seeded with the two demo partners + a few checks.
