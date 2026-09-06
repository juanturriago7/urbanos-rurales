# Ambiente de pruebas de urbanos-rurales en el VPS de OVH — Diseño

Fecha: 2026-09-06
Estado: aprobado por el usuario, pendiente de implementación

## Contexto

El VPS `vps-8f036300.vps.ovh.ca` (`51.222.140.140`, 2 vCPU, 3.7 GB RAM, 38 GB disco)
ya corre en producción el CRM TiviPlay + la landing SaintSoft (6 contenedores,
~1.2 GB RAM) bajo el patrón: `docker-compose.yml` por stack + un contenedor
`crm-nginx` compartido como reverse proxy + certbot para TLS real (Let's Encrypt),
DNS gestionado en Cloudflare. El detalle completo está en
`contexto-despliegue-ovh.md` (raíz del repo).

Ese VPS tenía además un segundo stack, `tiviplay-staging` (subdominio
`devtiviplay.saintsoft.us`), que servía de ambiente de pruebas para TiviPlay.
Se verificó en vivo (2026-09-06) que sus contenedores ya estaban detenidos; se
eliminaron sus contenedores e imágenes Docker para liberar espacio, dejando
intactos su volumen de datos, el bloque de nginx, el certificado certbot y el
directorio de código, por si se reactiva ese ambiente más adelante. Esa limpieza
ya se ejecutó como parte de esta conversación, fuera del alcance de este spec.

Queremos replicar el mismo patrón validado para dar de alta un ambiente de
pruebas nuevo, independiente, del proyecto **urbanos-rurales** (portal
inmobiliario — Backend .NET 10 + FrontEndUrbanos React/Vite + Postgres/PostGIS),
en el mismo VPS, sin runners propios de CI y sin sobre-aprovisionar el servidor
compartido.

## Restricciones conocidas

- Repo: `https://github.com/juanturriago7/urbanos-rurales` — **público**, el
  usuario (`santiagogamboac`) tiene acceso de escritura pero **no admin**, por lo
  que no puede agregar secrets en Settings → Actions. Esto descarta un pipeline
  de GitHub Actions que dispare el deploy automáticamente por SSH.
- RAM disponible tras la limpieza de `tiviplay-staging`: ~2.5 GB antes de overhead
  de SO, con 6 contenedores de prod ya usando ~1.2 GB.
- Disco disponible: ~25 GB libres de 38 GB.
- El modelo de datos usa tipos geoespaciales (`Task/BackEnd/02-modelo-de-datos.md`)
  → requiere `postgis/postgis`, no `postgres` a secas (igual que
  `Backend/docker-compose.yml` de desarrollo local).
- El backend ya depende de MinIO para almacenamiento de imágenes
  (`Backend/docker-compose.yml`), aunque no se mencionó explícitamente en el
  pedido original — se incluye en el diseño porque sin él el feature de subida
  de imágenes de inmuebles no funciona.
- Ya existe `Backend/src/Portal.Api/Dockerfile` (multi-stage, SDK 10 + runtime
  aspnet 10, con `EntityFrameworkCore.Design` referenciado). **No existe** aún
  Dockerfile para `FrontEndUrbanos/` — hay que crearlo.
- Ya existe `GET /health` mapeado en `Program.cs:169` (vía
  `AddHealthChecks()` / `MapHealthChecks`) — usable como smoke test post-deploy.
- Convención del proyecto (`CLAUDE.md`): en producción **nada** migra
  automáticamente (no hay `Migrate()` en `Program.cs`); las migraciones se
  aplican a mano. Este spec introduce una excepción deliberada **solo para
  este ambiente de pruebas** (ver sección Migraciones).

## Enfoque elegido

De los 3 enfoques presentados (build-en-VPS con nginx compartido / build-local
con tar por SSH / build-en-VPS + CI de validación sin secrets), se eligió el
**Enfoque 1**: clonar y construir en el propio VPS, reutilizando el `crm-nginx`
y el certbot ya existentes — sin contenedores de infraestructura nuevos.

## Componentes

Nuevo directorio en el VPS: `~/urbanos-rurales-staging/`, con su propio
`git clone` (rama `develop`, sin credenciales — el repo es público) y su propio
`docker-compose.yml`, separado del `docker-compose.yml` de TiviPlay.

| Contenedor | Base | Rol |
|---|---|---|
| `urbanos-db-staging` | `postgis/postgis:16-3.4` | Postgres + PostGIS |
| `urbanos-minio-staging` | `minio/minio` | Storage de imágenes |
| `urbanos-backend-staging` | build de `Backend/src/Portal.Api/Dockerfile` | API .NET 10 |
| `urbanos-frontend-staging` | build nuevo (Dockerfile a crear: `pnpm build` servido por nginx) | SPA React/Vite |
| `urbanos-migrator-staging` | build del stage `build` del Dockerfile del backend | contenedor de un solo uso, aplica migraciones EF antes de levantar `api` |

Todos en una red bridge propia `urbanos-staging-network`, y además unidos a la
red externa ya existente `tiviplay_tiviplay-network` (mismo patrón que usa hoy
`tiviplay-staging`), para que el `crm-nginx` compartido pueda alcanzarlos por
nombre de contenedor sin un nginx/certbot adicional.

## Red, DNS, TLS

- Subdominio: `stage-urbanos.saintsoft.us` (a confirmar el nombre exacto al
  implementar; puede ajustarse sin cambiar el resto del diseño).
- Registro DNS: el usuario agrega manualmente un registro `A` en Cloudflare
  apuntando a `51.222.140.140` (mismo procedimiento ya usado para
  `tiviplay.saintsoft.us` / `devtiviplay.saintsoft.us`). No se automatiza — no
  hay token de API de Cloudflare disponible en esta sesión.
- Se agregan bloques `server` nuevos a `~/tiviplay/nginx/nginx.conf` (el archivo
  compartido) para el nuevo subdominio:
  - HTTP → HTTPS redirect.
  - HTTPS: proxy `/` → `urbanos-frontend-staging:80`; `/api/`, `/swagger`,
    `/health` → `urbanos-backend-staging:8080`.
- Certificado nuevo vía certbot webroot, mismo flujo ya usado (ver sección
  Gotchas de `contexto-despliegue-ovh.md` antes de tocar nginx: la ruta debe
  ser `~/tiviplay/certbot/{conf,www}` relativa al compose, y tras cambiar un
  bind-mount de un contenedor existente hace falta
  `docker compose up -d --force-recreate <servicio>`).
- El cron ya existente (`0 3 * * * certbot renew --quiet && docker compose
  restart nginx`) renueva **todos** los certificados bajo `certbot/conf/live/`
  — no requiere cambios para cubrir el certificado nuevo.

## Secretos

`.env` propio en `~/urbanos-rurales-staging/` (gitignored, nunca commiteado).
Valores generados aparte, **no reutilizados** de TiviPlay ni del `.env` de
desarrollo local (`portal_pass`, etc.):

- `POSTGRES_PASSWORD`
- `Jwt__Key`
- `Storage__AccessKey` / `Storage__SecretKey` (MinIO)
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
- `Cors__AllowedOrigins` = `https://stage-urbanos.saintsoft.us`
- `VITE_API_BASE_URL` (build-time, frontend) = `https://stage-urbanos.saintsoft.us/api`

Generados con `openssl rand` una sola vez durante el setup inicial, a mano,
directamente en el VPS — no quedan en el repo ni en el historial de esta
conversación.

## CI/CD

Mecanismo confirmado: **script local disparado a mano por el usuario tras cada
push a `develop`** — no GitHub Actions (bloqueado por falta de acceso admin al
repo), no polling por cron en el VPS.

- `deploy-staging.ps1` (PowerShell, vive en el repo, p.ej.
  `Backend/scripts/deploy-staging.ps1` o una carpeta `deploy/` nueva): hace SSH
  al VPS con `~/.ssh/tiviplay-ovh-key` y dispara el script remoto. Acepta un
  parámetro opcional de ref de git para rollback.
- `~/urbanos-rurales-staging/deploy.sh` (en el VPS):
  1. `git fetch origin develop && git reset --hard origin/${REF:-develop}`
  2. `docker compose build`
  3. `docker compose run --rm migrator` (aplica migraciones EF, ver abajo)
  4. `docker compose up -d --remove-orphans`
  5. `docker image prune -f` (limpia capas huérfanas del build anterior)
- Tras el deploy, `deploy-staging.ps1` hace
  `curl https://stage-urbanos.saintsoft.us/health` y reporta OK/FAIL.

### Migraciones (excepción deliberada al patrón de prod)

A diferencia de producción (`CLAUDE.md`: nada migra automáticamente), en este
ambiente de pruebas las migraciones EF **sí se aplican automáticamente** en
cada deploy, vía el servicio de un solo uso `migrator` — decisión confirmada
explícitamente por el usuario. Este servicio reutiliza el stage `build` del
Dockerfile del backend (ya tiene el SDK y `EntityFrameworkCore.Design`
referenciado) y corre `dotnet ef database update --project
src/Portal.Infrastructure --startup-project src/Portal.Api --context
PortalDbContext` contra `urbanos-db-staging`, antes de levantar `api`. Los
catálogos (`roles`, `tipos_inmueble`, `caracteristicas`) llegan vía `HasData`
en las migraciones, igual que en local — no hace falta un seed adicional. El
usuario admin de pruebas (si se necesita) se crea a mano una vez, igual que
`dev-setup.ps1` lo hace en local, no dentro de una migración.

### Rollback

`deploy.sh` acepta un ref de git opcional; en vez de `origin/develop` hace
`git reset --hard <sha>` y reconstruye — mismo camino que un deploy normal, sin
pasos especiales.

## Seguridad de recursos (RAM)

`mem_limit` por servicio en el `docker-compose.yml` de staging (no existe hoy
en el compose de prod — es una red de seguridad nueva, solo para este stack):

| Servicio | Límite |
|---|---|
| `urbanos-db-staging` | 300M |
| `urbanos-minio-staging` | 128M |
| `urbanos-backend-staging` | 350M |
| `urbanos-frontend-staging` | 32M |

Tope duro combinado ~810 MB, dentro del margen libre estimado (~2.5 GB tras la
limpieza de `tiviplay-staging`). Si un contenedor de staging se pasa de su
límite, el kernel lo mata a él — no puede quitarle RAM a los contenedores de
producción de TiviPlay/SaintSoft.

`urbanos-migrator-staging` es efímero (corre y termina), no necesita límite
permanente.

## Testing

- Smoke test automático post-deploy: `GET /health` vía el script local
  (`deploy-staging.ps1`), reporta OK/FAIL con código de salida distinto de
  cero si falla.
- No hay suite de tests automatizados en el backend ni el frontend todavía
  (`CLAUDE.md`: "No hay proyectos de test en la solución todavía" /
  "No hay test runner configurado todavía") — el smoke test de `/health` es la
  única validación automática disponible por ahora. Fuera de alcance de este
  spec agregar tests; es una limitación heredada del estado actual del repo.
- Validación manual esperada tras el primer deploy: login/CRUD básico de
  inmuebles desde `https://stage-urbanos.saintsoft.us`, verificar que las
  imágenes suben a MinIO y se sirven correctamente, verificar `/swagger`.

## Fuera de alcance (explícitamente no se hace en este spec)

- Automatizar el registro DNS en Cloudflare (requiere token de API que no se
  compartió en esta sesión).
- GitHub Actions o cualquier automatización disparada por push — bloqueado por
  falta de acceso admin al repo.
- CI de validación de build (Enfoque 3 descartado por el usuario a favor del
  Enfoque 1; queda como posible mejora futura, no se implementa ahora).
- Tocar o modificar el stack de producción de TiviPlay/SaintSoft más allá de
  agregar bloques `server` nuevos a su `nginx.conf` compartido.
