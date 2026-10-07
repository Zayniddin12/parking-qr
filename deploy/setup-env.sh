#!/bin/sh
# Run on the server inside the deploy/ dir. Creates .env with fresh secrets.
set -eu
IP="${1:?usage: ./setup-env.sh <server-ip>}"
PW=$(openssl rand -base64 12 | tr -d '/+=')
HASH=$(docker run --rm caddy:2 caddy hash-password --plaintext "$PW")
cat > .env <<ENV
DOMAIN=$(echo "$IP" | tr . -).sslip.io
PARTNER_JWT_SECRET=$(openssl rand -hex 24)
PARTNER_QR_SECRET=$(openssl rand -hex 16)
BP_PASSWORD_HASH='$HASH'
ENV
chmod 600 .env
echo "Business panel login: admin / $PW   (save it now, shown once)"
