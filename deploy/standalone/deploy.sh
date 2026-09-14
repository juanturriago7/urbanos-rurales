#!/usr/bin/env bash
# Deploy del ambiente de pruebas de urbanos-rurales en la VPS standalone.
#
# Este archivo es la FUENTE DE VERDAD, pero la copia que se ejecuta vive fuera
# del clon, en ~/deploy-urbanos.sh. Motivo: el `git reset --hard` de mas abajo
# reescribiria este script a mitad de su propia ejecucion. Tras editarlo aca hay
# que re-copiarlo a mano:
#
#   cp ~/urbanos-rurales-staging/deploy/standalone/deploy.sh ~/deploy-urbanos.sh
#
# Uso:  ~/deploy-urbanos.sh [rama]     (default: develop)
set -euo pipefail

REPO_DIR="$HOME/urbanos-rurales-staging"
DEPLOY_DIR="$REPO_DIR/deploy/standalone"
REF="${1:-develop}"

cd "$DEPLOY_DIR"
set -a; source .env; set +a
: "${STAGING_DOMAIN:?falta STAGING_DOMAIN en .env}"
: "${LETSENCRYPT_EMAIL:?falta LETSENCRYPT_EMAIL en .env}"

compose() { docker compose --env-file "$DEPLOY_DIR/.env" "$@"; }

echo "==> Actualizando codigo a origin/${REF}"
cd "$REPO_DIR"
git fetch origin "$REF"
git reset --hard FETCH_HEAD
cd "$DEPLOY_DIR"

echo "==> Construyendo imagenes"
compose --profile migration build

echo "==> Aplicando migraciones EF"
compose --profile migration run --rm migrator

CERT_PATH="$DEPLOY_DIR/certbot/conf/live/$STAGING_DOMAIN/fullchain.pem"

if [[ ! -f "$CERT_PATH" ]]; then
  # ─── Arranque en frio ──────────────────────────────────────────────────────
  # nginx no puede arrancar con la config de :443 porque el certificado no
  # existe, y certbot no puede emitirlo sin un nginx sirviendo el challenge.
  # Se rompe el ciclo levantando primero solo :80.
  echo "==> Sin certificado para $STAGING_DOMAIN. Arranque en frio."
  mkdir -p certbot/conf certbot/www

  echo "    -> nginx en modo bootstrap (solo :80)"
  NGINX_CONF=nginx-bootstrap.conf compose up -d --force-recreate nginx

  echo "    -> esperando a que :80 responda"
  for _ in $(seq 1 30); do
    curl -fsS -o /dev/null "http://127.0.0.1/" && break || sleep 2
  done

  echo "    -> solicitando certificado a Let's Encrypt"
  compose --profile certbot run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$STAGING_DOMAIN" \
    --email "$LETSENCRYPT_EMAIL" \
    --agree-tos --no-eff-email --non-interactive

  [[ -f "$CERT_PATH" ]] || { echo "ERROR: certbot no dejo el certificado en $CERT_PATH"; exit 1; }
  echo "    -> certificado emitido"
fi

echo "==> Levantando servicios"
# nginx se nombra aparte, despues, para que sus upstreams ya existan: con la
# config de :443 montada y un upstream inexistente, nginx muere con "host not
# found in upstream". Se listan los servicios uno por uno en vez de usar
# `--scale nginx=0` porque Compose rechaza escalar servicios que declaran
# container_name.
compose up -d --remove-orphans db minio minio-init api frontend

echo "==> Recreando nginx con la config completa (:80 + :443)"
# --force-recreate es obligatorio: al cambiar el bind-mount de un archivo suelto,
# un `up -d` a secas NO lo recoge y el contenedor sigue viendo el inodo viejo.
NGINX_CONF=nginx.conf compose up -d --force-recreate nginx

echo "==> Limpiando imagenes huerfanas"
docker image prune -f

echo "==> Estado:"
compose ps
echo
echo "==> Listo: https://${STAGING_DOMAIN}"
