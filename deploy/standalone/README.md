# Ambiente de pruebas — VPS standalone

Despliegue de `urbanos-rurales` en `vps-5507c5dd.vps.ovh.ca` (`51.161.114.45`), una
máquina propia donde más adelante van a convivir otras aplicaciones.

No confundir con `deploy/docker-compose.staging.yml`, que sigue sirviendo el despliegue
de la VPS `51.222.140.140` y **comparte** nginx y certbot con el stack de TiviPlay. Acá
nginx y certbot son propios y están versionados en esta carpeta.

| | Valor |
|---|---|
| URL | `https://51.161.114.45.sslip.io` |
| Directorio en el VPS | `~/urbanos-rurales-staging/` (clon de git, rama `develop`) |
| Compose | `~/urbanos-rurales-staging/deploy/standalone/docker-compose.yml` |
| Secretos | `~/urbanos-rurales-staging/deploy/standalone/.env` (no versionado) |
| Redeploy | `~/deploy-urbanos.sh [rama]` |

## Reparto de puertos

Esta es la parte que hay que respetar al agregar aplicaciones nuevas.

**Reglas invariantes:**

1. `ufw` solo abre **22, 80 y 443**. Nada más sale a internet.
2. Todo puerto de servicio se publica **exclusivamente en `127.0.0.1`**
   (`"127.0.0.1:5434:5432"`, nunca `"5434:5432"`). Se alcanzan por túnel SSH:
   `ssh -L 5434:127.0.0.1:5434 ubuntu@51.161.114.45`.
3. Lo que solo necesita hablar con nginx (backends, frontends) **no publica puerto
   alguno**: usa `expose` y se alcanza por nombre dentro de la red de compose.
4. Cada app declara `name:` en su compose y prefija sus contenedores, para que las
   redes y volúmenes no dependan del nombre del directorio.

### Rangos reservados

| Rango | Uso | Estado |
|---|---|---|
| `22`, `80`, `443` | Público (ufw) — nginx es el único que los toma | ocupado |
| `5432`–`5439` | Bases de datos relacionales | 5434 ocupado |
| `6379`–`6389` | Caches / colas (Redis, etc.) | libre |
| `9000`–`9019` | Almacenamiento de objetos (MinIO y similares) | 9004, 9005 ocupados |
| `8000`–`8099` | APIs HTTP internas | libre (ver nota) |
| `3000`–`3099` | Frontends / dashboards internos | libre (ver nota) |
| `9100`–`9199` | Observabilidad (exporters, Prometheus, Grafana) | libre |

### Asignación actual

| Puerto en host | Contenedor | Servicio |
|---|---|---|
| `127.0.0.1:5434` | `urbanos-db-staging` | PostgreSQL + PostGIS |
| `127.0.0.1:9004` | `urbanos-minio-staging` | MinIO — API S3 |
| `127.0.0.1:9005` | `urbanos-minio-staging` | MinIO — consola web |
| `80`, `443` | `urbanos-nginx` | Reverse proxy (único expuesto) |
| — | `urbanos-backend-staging` | API .NET, `expose: 8080`, sin publicar |
| — | `urbanos-frontend-staging` | SPA tras nginx, `expose: 80`, sin publicar |

Los rangos `8000-8099` y `3000-3099` figuran como libres a propósito: el backend y el
frontend de este proyecto **no publican puertos**, así que no consumen nada de ahí. Una
app nueva que sí necesite exponer su API al host tiene el bloque entero disponible.

Se conservaron `5434 / 9004 / 9005` —en vez de los `5432 / 9000 / 9001` naturales en una
máquina limpia— para que una sola tabla describa las dos VPS y `contexto-despliegue-ovh.md`
no se contradiga.

## Arranque en frío

`deploy.sh` lo resuelve solo, pero conviene entender por qué tiene dos fases: nginx no
arranca si un bloque `listen 443 ssl` apunta a un certificado inexistente, y certbot no
puede emitir ese certificado sin un nginx que sirva el challenge HTTP-01. El ciclo se
rompe levantando primero `nginx-bootstrap.conf` (solo `:80`), emitiendo el certificado, y
recién entonces recreando nginx con `nginx.conf`.

```bash
ssh ubuntu@51.161.114.45
git clone -b develop https://github.com/juanturriago7/urbanos-rurales ~/urbanos-rurales-staging
cd ~/urbanos-rurales-staging/deploy/standalone
cp .env.example .env && nano .env          # reemplazar los CHANGE_ME
cp deploy.sh ~/deploy-urbanos.sh && chmod +x ~/deploy-urbanos.sh
~/deploy-urbanos.sh
```

## Redeploy

```bash
~/deploy-urbanos.sh            # develop
~/deploy-urbanos.sh mi-rama    # otra rama
```

Despliega lo que está en **`origin`**, no el working copy local: hay que pushear primero.

## Gotchas

- **Bind-mount de un archivo suelto queda *stale*.** Editar `nginx.conf` en el host con
  algo que hace rename (`sed -i`) deja al contenedor viendo el inodo viejo. Por eso
  `deploy.sh` usa `--force-recreate` al cambiar de config. Para validar antes de
  reiniciar el nginx real:
  ```bash
  docker run --rm -v $PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:1.27-alpine nginx -t
  ```
- **`aspnet:10.0` no trae `curl` ni `wget`.** Para probar un endpoint interno del backend
  sin publicar su puerto:
  ```bash
  docker run --rm --network urbanos-staging_urbanos-net curlimages/curl:latest \
    -s http://urbanos-backend-staging:8080/health
  ```
  La red lleva el prefijo `urbanos-staging_` por el `name:` del compose, no `standalone_`.
- **`proxy_pass` de `/portal-inmuebles/` va sin path propio.** Agregarle una barra final
  rompe la firma SigV4 de las URLs prefirmadas y toda subida de imágenes devuelve 403.
- **`deploy.sh` se ejecuta desde `~/deploy-urbanos.sh`, fuera del clon.** Si vive dentro,
  el `git reset --hard` lo reescribe a mitad de su propia ejecución. Tras editarlo en el
  repo hay que re-copiarlo a mano; nada lo hace solo.

## Qué cambia para producción

| | Staging (esto) | Producción |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` | `Production` — se pierden `/scalar` y `/openapi` |
| Dominio | `*.sslip.io` | Dominio real con registro A propio |
| Migraciones | Contenedor `migrator` automático | A mano, con respaldo previo (ver CLAUDE.md) |
| `X-Robots-Tag: noindex` | Sí | Quitar |
| Backups | No hay | `pg_dump` diario + respaldo del volumen de MinIO |
| Secretos | `.env` en el servidor | Gestor de secretos |
