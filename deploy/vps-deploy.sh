#!/usr/bin/env bash
# Deploy del ambiente de pruebas de urbanos-rurales. Vive DUPLICADO fuera del
# clon de git, en ~/deploy-urbanos-staging.sh (ver Task 11 del plan de
# implementación) — si viviera dentro del clon, el "git reset --hard" del
# Step de abajo se auto-modificaría a mitad de ejecución.
set -euo pipefail

REPO_DIR="$HOME/urbanos-rurales-staging"
REF="${1:-develop}"

echo "==> Actualizando código a origin/${REF}"
cd "$REPO_DIR"
git fetch origin "$REF"
git reset --hard FETCH_HEAD

echo "==> Reconstruyendo imágenes"
cd "$REPO_DIR/deploy"
docker compose -f docker-compose.staging.yml --env-file .env --profile migration build

echo "==> Aplicando migraciones EF"
docker compose -f docker-compose.staging.yml --env-file .env --profile migration run --rm migrator

echo "==> Levantando servicios"
docker compose -f docker-compose.staging.yml --env-file .env up -d --remove-orphans

echo "==> Limpiando imágenes huérfanas"
docker image prune -f

echo "==> Deploy completo. Estado de los contenedores:"
docker compose -f docker-compose.staging.yml ps
