#!/usr/bin/env bash
# Renovacion del certificado de Let's Encrypt. Lo dispara cron; ver README.
#
# certbot renew no hace nada hasta que faltan menos de 30 dias para el
# vencimiento, asi que correrlo a diario es barato y es lo recomendado: da
# ~30 intentos antes de que el certificado caduque de verdad.
#
# nginx necesita un reload explicito: ya tiene el certificado viejo cargado en
# memoria y no detecta solo que el archivo del disco cambio.
set -euo pipefail

DEPLOY_DIR="$HOME/urbanos-rurales-staging/deploy/standalone"
cd "$DEPLOY_DIR"

compose() { docker compose --env-file "$DEPLOY_DIR/.env" "$@"; }

echo "[$(date -Is)] renovando certificados"
compose --profile certbot run --rm certbot renew --quiet

# `nginx -s reload` y no `restart`: recarga sin cortar conexiones en curso.
if compose exec -T nginx nginx -s reload 2>/dev/null; then
  echo "[$(date -Is)] nginx recargado"
else
  echo "[$(date -Is)] AVISO: no se pudo recargar nginx (¿esta arriba?)"
fi
