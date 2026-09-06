# Ambiente de pruebas urbanos-rurales en VPS OVH — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar un ambiente de pruebas de urbanos-rurales (Postgres/PostGIS + MinIO + API .NET + frontend Vite) en el VPS de OVH que ya corre TiviPlay/SaintSoft en producción, alcanzable en `https://stage-urbanos.saintsoft.us`, con un mecanismo de redeploy disparado por un script local tras cada push a `develop`.

**Architecture:** Un directorio nuevo `~/urbanos-rurales-staging/` en el VPS con su propio `git clone` (rama `develop`, repo público, sin credenciales) y su propio `docker-compose.yml`. Los contenedores nuevos viven en una red bridge propia y además se unen a la red externa `tiviplay_tiviplay-network` para que el `crm-nginx` ya existente les haga reverse proxy — sin nginx ni certbot nuevos. Redeploy vía un script local (PowerShell) que hace SSH y dispara un script remoto (`git pull` + `docker compose build` + migrar + `up -d`), sin GitHub Actions (el usuario no tiene acceso admin al repo para configurar secrets).

**Tech Stack:** .NET 10 (SDK/ASPNET runtime images), PostgreSQL 16 + PostGIS 3.4, MinIO, nginx:alpine, Node 22 + pnpm + Vite 8, Docker Compose v2, PowerShell (trigger local), bash (remoto en el VPS).

**Spec:** `docs/superpowers/specs/2026-09-06-ambiente-pruebas-vps-ovh-design.md`

## Global Constraints

- VPS: `51.222.140.140`, usuario `ubuntu`, llave `C:\Users\Santiago\.ssh\tiviplay-ovh-key`. SSH: `ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140`.
- Repo: `https://github.com/juanturriago7/urbanos-rurales.git` — **público**, `git clone`/`git pull` sin credenciales. Rama de trabajo: `develop`.
- Subdominio: `stage-urbanos.saintsoft.us` → registro DNS tipo `A` → `51.222.140.140`, gestionado a mano por el usuario en Cloudflare (no hay token de API disponible en esta sesión).
- nginx compartido: `~/tiviplay/nginx/nginx.conf` en el VPS, contenedor `crm-nginx`, recarga vía `cd ~/tiviplay && docker compose restart nginx`. **Nunca** agregar un bloque `server { listen 443 ssl; ... }` que apunte a un `ssl_certificate` inexistente o a un contenedor que todavía no existe/no está en la red — ambos casos tumban nginx en crash-loop (ver `contexto-despliegue-ovh.md`, sección Gotchas).
- certbot: `~/tiviplay/certbot/{conf,www}` (ruta relativa al compose de TiviPlay, no `~/certbot`). El cron ya existente renueva todos los certs bajo `certbot/conf/live/` — no requiere cambios.
- Red externa para que nginx alcance los contenedores nuevos: `tiviplay_tiviplay-network` (ya existe, creada por el compose de TiviPlay).
- Connection string del backend: la clave real es `ConnectionStrings:Default` (`configuration.GetConnectionString("Default")` en `Portal.Infrastructure/DependencyInjection.cs:23`) → variable de entorno **`ConnectionStrings__Default`**. (El `Backend/docker-compose.yml` de desarrollo local usa `ConnectionStrings__DefaultConnection`, que es una variable muerta que no coincide con ninguna clave leída — no replicar ese nombre.)
- CORS: `Cors:AllowedOrigins` es un array → override vía `Cors__AllowedOrigins__0`.
- Storage (MinIO): overrides `Storage__Endpoint`, `Storage__Bucket`, `Storage__AccessKey`, `Storage__SecretKey`, `Storage__ForcePathStyle`, `Storage__UrlPublicaBase`. Bucket: `portal-inmuebles`.
- **`ASPNETCORE_ENVIRONMENT` debe ser `Development`, no `Staging` ni `Production`**, porque `Program.cs:160-164` solo mapea `/openapi/v1.json` y `/scalar/v1` (Scalar, no Swagger UI — este proyecto no usa `UseSwaggerUI()`) dentro de `if (app.Environment.IsDevelopment())`. Con cualquier otro valor esas rutas no existen y el bloque nginx que las proxíe daría 404. Es una desviación deliberada del nombre "ambiente de pruebas" ≠ "Development" — se documenta con un comentario en el compose.
- `GET /health` está mapeado siempre (sin gate de entorno, `Program.cs:169`) — es el smoke test post-deploy.
- El seeder de usuario admin (`Program.cs:120-151`) corre automáticamente en cada arranque de la API, en cualquier entorno, y crea `admin@portal.local` / `Admin123*` si no existe — **no hace falta un paso manual de creación de admin** como sí lo hace `dev-setup.ps1` en local. Nota de seguridad heredada (no introducida por este plan): esas credenciales quedarán activas en una URL pública.
- `Microsoft.EntityFrameworkCore.Design` ya está referenciado en `Portal.Api.csproj` y `Portal.Infrastructure.csproj`, pero la herramienta CLI `dotnet-ef` **no** está preinstalada en la imagen SDK — hay que instalarla en el stage `migrator` del Dockerfile.
- Límites de memoria por servicio en el compose de staging (no existen en el compose de prod — son una red de seguridad nueva, solo para este stack): `db` 300m, `minio` 128m, `api` 350m, `frontend` 32m.
- Docker está disponible localmente (Docker Desktop, `docker version` → Server 29.3.1) — los Dockerfiles de las Tareas 1 y 2 se verifican con `docker build` local antes de tocar el VPS.

---

### Task 1: Stage `migrator` en el Dockerfile del backend

**Files:**
- Modify: `Backend/src/Portal.Api/Dockerfile`

**Interfaces:**
- Produces: un target de build `migrator` (imagen que, al correr, aplica `dotnet ef database update` contra la cadena de conexión de la variable de entorno `ConnectionStrings__Default`) — usado por `deploy/docker-compose.staging.yml` (Task 3) como servicio `migrator`.

- [ ] **Step 1: Verificar el build actual (target por defecto) antes de tocar nada**

Run (desde `Backend/`):
```bash
docker build -f src/Portal.Api/Dockerfile -t urbanos-api-baseline .
```
Expected: `Successfully tagged urbanos-api-baseline` (o equivalente en Buildx). Este es el build de referencia — el target por defecto (`runtime`) no debe cambiar de comportamiento tras el Step 3.

- [ ] **Step 2: Agregar el stage `migrator` entre `build` y `runtime`**

Reemplazar el contenido completo de `Backend/src/Portal.Api/Dockerfile` por:

```dockerfile
# ─── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/Portal.Api/Portal.Api.csproj",            "Portal.Api/"]
COPY ["src/Portal.Application/Portal.Application.csproj", "Portal.Application/"]
COPY ["src/Portal.Infrastructure/Portal.Infrastructure.csproj", "Portal.Infrastructure/"]
COPY ["src/Portal.Domain/Portal.Domain.csproj",      "Portal.Domain/"]

RUN dotnet restore "Portal.Api/Portal.Api.csproj"

COPY src/ .

RUN dotnet publish "Portal.Api/Portal.Api.csproj" \
    -c Release -o /app/publish --no-restore

# ─── Migrator stage ───────────────────────────────────────────────────────────
# Imagen de un solo uso para aplicar migraciones EF contra un ambiente remoto
# (ver deploy/docker-compose.staging.yml, servicio "migrator"). Solo se usa en
# el ambiente de pruebas: en producción las migraciones se aplican a mano
# (ver CLAUDE.md).
FROM build AS migrator
RUN dotnet tool install --global dotnet-ef --version 10.0.0
ENV PATH="$PATH:/root/.dotnet/tools"
ENTRYPOINT ["dotnet", "ef", "database", "update", \
    "--project", "Portal.Infrastructure", \
    "--startup-project", "Portal.Api", \
    "--context", "PortalDbContext"]

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Portal.Api.dll"]
```

- [ ] **Step 3: Verificar que el target por defecto sigue construyendo igual**

Run (desde `Backend/`):
```bash
docker build -f src/Portal.Api/Dockerfile -t urbanos-api-baseline2 .
docker image inspect urbanos-api-baseline --format '{{.Config.Entrypoint}}' > /tmp/before.txt
docker image inspect urbanos-api-baseline2 --format '{{.Config.Entrypoint}}' > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt
```
Expected: build exitoso y `diff` sin salida (mismo `ENTRYPOINT`, `["dotnet","Portal.Api.dll"]` en ambos).

- [ ] **Step 4: Verificar el nuevo target `migrator` construye**

Run (desde `Backend/`):
```bash
docker build -f src/Portal.Api/Dockerfile --target migrator -t urbanos-migrator-test .
docker image inspect urbanos-migrator-test --format '{{.Config.Entrypoint}}'
```
Expected: build exitoso, termina con `RUN dotnet tool install --global dotnet-ef --version 10.0.0` sin error, y el entrypoint impreso es
`[dotnet ef database update --project Portal.Infrastructure --startup-project Portal.Api --context PortalDbContext]`.

- [ ] **Step 5: Limpiar imágenes de prueba locales**

Run:
```bash
docker rmi urbanos-api-baseline urbanos-api-baseline2 urbanos-migrator-test
```

- [ ] **Step 6: Commit**

```bash
git add Backend/src/Portal.Api/Dockerfile
git commit -m "build: agregar stage migrator al Dockerfile del backend para el ambiente de pruebas"
```

---

### Task 2: Dockerfile + nginx interno del frontend

**Files:**
- Create: `FrontEndUrbanos/Dockerfile`
- Create: `FrontEndUrbanos/nginx.conf`

**Interfaces:**
- Consumes: build args `VITE_API_BASE_URL` (string, vacío = peticiones relativas) y `VITE_APP_NAME` (string) — ver `FrontEndUrbanos/.env.example` para su significado.
- Produces: imagen que sirve el build estático de Vite en el puerto 80 con fallback de SPA — usada por `deploy/docker-compose.staging.yml` (Task 3) como servicio `frontend`.

- [ ] **Step 1: Crear `FrontEndUrbanos/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Crear `FrontEndUrbanos/Dockerfile`**

```dockerfile
# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=""
ARG VITE_APP_NAME="Portal Inmobiliario"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN pnpm build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

- [ ] **Step 3: Verificar el build**

Run (desde `FrontEndUrbanos/`):
```bash
docker build -t urbanos-frontend-test --build-arg VITE_API_BASE_URL= --build-arg VITE_APP_NAME="Portal Inmobiliario (Staging)" .
```
Expected: termina en `pnpm build` sin error de TypeScript/Vite y `Successfully tagged urbanos-frontend-test`.

- [ ] **Step 4: Verificar que sirve la SPA**

Run:
```bash
docker run -d --rm --name urbanos-frontend-smoke -p 8090:80 urbanos-frontend-test
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/admin/ruta-que-no-existe
docker stop urbanos-frontend-smoke
```
Expected: ambas peticiones devuelven `200` (la segunda por el fallback `try_files ... /index.html`, confirmando que el ruteo de React Router no rompe con un refresh directo).

- [ ] **Step 5: Limpiar imagen de prueba**

Run:
```bash
docker rmi urbanos-frontend-test
```

- [ ] **Step 6: Commit**

```bash
git add FrontEndUrbanos/Dockerfile FrontEndUrbanos/nginx.conf
git commit -m "build: agregar Dockerfile de frontend para el ambiente de pruebas"
```

---

### Task 3: `docker-compose.staging.yml`

**Files:**
- Create: `deploy/docker-compose.staging.yml`

**Interfaces:**
- Consumes: target `migrator` del Dockerfile del backend (Task 1), `FrontEndUrbanos/Dockerfile` (Task 2), variables de `deploy/.env` (definidas en Task 4: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_KEY`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `STAGING_DOMAIN`).
- Produces: servicios `db`, `minio`, `minio-init`, `migrator`, `api`, `frontend` en la red `urbanos-staging-network` — nombres de contenedor (`urbanos-db-staging`, `urbanos-minio-staging`, `urbanos-backend-staging`, `urbanos-frontend-staging`) referenciados por el fragmento de nginx (Task 7).

- [ ] **Step 1: Crear `deploy/docker-compose.staging.yml`**

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    container_name: urbanos-db-staging
    restart: unless-stopped
    mem_limit: 300m
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-portal_db}
      POSTGRES_USER: ${POSTGRES_USER:-portal_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:5434:5432"
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
    networks:
      - urbanos-staging-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-portal_user} -d ${POSTGRES_DB:-portal_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-10-13T13-34-11Z
    container_name: urbanos-minio-staging
    restart: unless-stopped
    mem_limit: 128m
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    ports:
      - "127.0.0.1:9004:9000"
      - "127.0.0.1:9005:9001"
    volumes:
      - minio_data_staging:/data
    networks:
      - urbanos-staging-network
      - prod-network
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio-init:
    image: minio/mc:RELEASE.2024-10-08T09-37-26Z
    container_name: urbanos-minio-init-staging
    depends_on:
      minio:
        condition: service_healthy
    networks:
      - urbanos-staging-network
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://urbanos-minio-staging:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} &&
      mc mb --ignore-existing local/portal-inmuebles &&
      mc anonymous set download local/portal-inmuebles &&
      echo 'Bucket portal-inmuebles listo'
      "

  migrator:
    build:
      context: ../Backend
      dockerfile: src/Portal.Api/Dockerfile
      target: migrator
    container_name: urbanos-migrator-staging
    profiles: ["migration"]
    networks:
      - urbanos-staging-network
    environment:
      ConnectionStrings__Default: "Host=urbanos-db-staging;Port=5432;Database=${POSTGRES_DB:-portal_db};Username=${POSTGRES_USER:-portal_user};Password=${POSTGRES_PASSWORD}"
    depends_on:
      db:
        condition: service_healthy

  api:
    build:
      context: ../Backend
      dockerfile: src/Portal.Api/Dockerfile
      target: runtime
    container_name: urbanos-backend-staging
    restart: unless-stopped
    mem_limit: 350m
    networks:
      - urbanos-staging-network
      - prod-network
    expose:
      - "8080"
    environment:
      # "Development" (no "Staging"/"Production") a propósito: Program.cs solo
      # mapea /openapi y /scalar cuando IsDevelopment() es true. Ver Global
      # Constraints del plan.
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Default: "Host=urbanos-db-staging;Port=5432;Database=${POSTGRES_DB:-portal_db};Username=${POSTGRES_USER:-portal_user};Password=${POSTGRES_PASSWORD}"
      Jwt__Key: ${JWT_KEY}
      Jwt__Issuer: portal-api
      Jwt__Audience: portal-frontend
      Cors__AllowedOrigins__0: "https://${STAGING_DOMAIN}"
      Storage__Endpoint: "http://urbanos-minio-staging:9000"
      Storage__Bucket: portal-inmuebles
      Storage__AccessKey: ${MINIO_ROOT_USER}
      Storage__SecretKey: ${MINIO_ROOT_PASSWORD}
      Storage__ForcePathStyle: "true"
      Storage__UrlPublicaBase: "https://${STAGING_DOMAIN}/storage/portal-inmuebles"
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_healthy

  frontend:
    build:
      context: ../FrontEndUrbanos
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ""
        VITE_APP_NAME: "Portal Inmobiliario (Staging)"
    container_name: urbanos-frontend-staging
    restart: unless-stopped
    mem_limit: 32m
    networks:
      - urbanos-staging-network
      - prod-network
    expose:
      - "80"
    depends_on:
      - api

networks:
  urbanos-staging-network:
    driver: bridge
  prod-network:
    external: true
    name: tiviplay_tiviplay-network

volumes:
  postgres_data_staging:
  minio_data_staging:
```

- [ ] **Step 2: Verificar sintaxis del compose**

Run (desde la raíz del repo):
```bash
docker compose -f deploy/docker-compose.staging.yml config --quiet
echo "exit code: $?"
```
Expected: `exit code: 0`. Es normal que imprima warnings de variables sin definir (`POSTGRES_PASSWORD`, `JWT_KEY`, etc. — se definen en `deploy/.env`, Task 4, que todavía no existe en este paso); lo que valida este comando es que el YAML es válido y las referencias entre servicios (`target: migrator`, `context: ../Backend`, nombres de red) resuelven sin error de sintaxis.

- [ ] **Step 3: Commit**

```bash
git add deploy/docker-compose.staging.yml
git commit -m "build: agregar docker-compose del ambiente de pruebas"
```

---

### Task 4: Plantilla de variables de entorno + `.gitignore`

**Files:**
- Create: `deploy/staging.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: la lista canónica de variables que `deploy/.env` (real, creado a mano en el VPS en la Task 11, nunca commiteado) debe definir.

**Nota:** el archivo real de secretos se llama `deploy/.env` — ya cae bajo el patrón `.env` / `.env.*` que el `.gitignore` raíz ya ignora (líneas 17-19). La plantilla se llama **`deploy/staging.env.example`** (sin punto inicial) precisamente para no coincidir con el patrón `.env.*` y no quedar ignorada por accidente.

- [ ] **Step 1: Crear `deploy/staging.env.example`**

```bash
# Copia este archivo a deploy/.env en el VPS y reemplaza los valores.
# deploy/.env NUNCA se commitea (ver .gitignore raíz, patrón .env / .env.*).
#
# Generar valores aleatorios:
#   openssl rand -base64 32

POSTGRES_DB=portal_db
POSTGRES_USER=portal_user
POSTGRES_PASSWORD=CHANGE_ME

# Debe tener 32+ caracteres (HMAC-SHA256 lo requiere).
JWT_KEY=CHANGE_ME

MINIO_ROOT_USER=urbanos_minio
MINIO_ROOT_PASSWORD=CHANGE_ME

# Sin protocolo, solo el host. Debe coincidir con el registro A en Cloudflare
# y con el server_name del fragmento de nginx (deploy/nginx-fragment-staging.conf).
STAGING_DOMAIN=stage-urbanos.saintsoft.us
```

- [ ] **Step 2: Verificar que `deploy/.env` (real) queda ignorado y la plantilla no**

Run (desde la raíz del repo):
```bash
touch deploy/.env
git check-ignore -v deploy/.env
git check-ignore -v deploy/staging.env.example; echo "exit code plantilla: $?"
rm deploy/.env
```
Expected: la primera línea imprime la regla que matchea (`.gitignore:17:.env` o `.gitignore:18:.env.*`), confirmando que `deploy/.env` sí queda ignorado. La segunda línea no imprime nada y `exit code plantilla: 1` (no está ignorada, `git check-ignore` devuelve 1 cuando el path NO matchea ninguna regla).

- [ ] **Step 3: Commit**

```bash
git add deploy/staging.env.example
git commit -m "docs: agregar plantilla de variables de entorno del ambiente de pruebas"
```

---

### Task 5: Script remoto de deploy (`deploy/vps-deploy.sh`)

**Files:**
- Create: `deploy/vps-deploy.sh`

**Interfaces:**
- Consumes: se ejecuta desde fuera del clon de git (copiado a mano a `~/deploy-urbanos-staging.sh` en el VPS en la Task 11) — evita el riesgo de que un `git reset --hard` se auto-modifique mientras corre. Recibe un argumento opcional: el ref de git a desplegar (default `develop`).
- Produces: al terminar, dos contenedores de larga vida (`urbanos-backend-staging`, `urbanos-frontend-staging`) corriendo y accesibles en `urbanos-staging-network` + `prod-network` — consumido por `deploy/deploy-staging.ps1` (Task 6) vía SSH.

- [ ] **Step 1: Crear `deploy/vps-deploy.sh`**

```bash
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
git reset --hard "origin/${REF}"

echo "==> Reconstruyendo imágenes"
cd "$REPO_DIR/deploy"
docker compose -f docker-compose.staging.yml --env-file .env build

echo "==> Aplicando migraciones EF"
docker compose -f docker-compose.staging.yml --env-file .env --profile migration run --rm migrator

echo "==> Levantando servicios"
docker compose -f docker-compose.staging.yml --env-file .env up -d --remove-orphans

echo "==> Limpiando imágenes huérfanas"
docker image prune -f

echo "==> Deploy completo. Estado de los contenedores:"
docker compose -f docker-compose.staging.yml ps
```

- [ ] **Step 2: Verificar sintaxis del script**

Run:
```bash
bash -n deploy/vps-deploy.sh; echo "exit code: $?"
```
Expected: `exit code: 0`, sin salida de error (`bash -n` solo parsea, no ejecuta).

- [ ] **Step 3: Commit**

```bash
git add deploy/vps-deploy.sh
git commit -m "build: agregar script remoto de deploy del ambiente de pruebas"
```

---

### Task 6: Script local de deploy (`deploy/deploy-staging.ps1`)

**Files:**
- Create: `deploy/deploy-staging.ps1`

**Interfaces:**
- Consumes: `deploy/vps-deploy.sh` ya copiado como `~/deploy-urbanos-staging.sh` en el VPS (Task 11); `GET https://stage-urbanos.saintsoft.us/health` (mapeado en `Program.cs:169`).
- Produces: el comando que el usuario corre a mano tras cada push a `develop`.

- [ ] **Step 1: Crear `deploy/deploy-staging.ps1`**

```powershell
<#
Dispara el redeploy del ambiente de pruebas de urbanos-rurales.
Uso:
    .\deploy\deploy-staging.ps1                # despliega origin/develop
    .\deploy\deploy-staging.ps1 -Ref abc1234    # despliega un commit puntual (rollback)
#>
param(
    [string]$Ref = "develop"
)

$ErrorActionPreference = "Stop"

$VpsUser = "ubuntu"
$VpsIp = "51.222.140.140"
$SshKey = Join-Path $HOME ".ssh\tiviplay-ovh-key"
$Domain = "stage-urbanos.saintsoft.us"

Write-Host "==> Desplegando '$Ref' en https://$Domain ..." -ForegroundColor Cyan

& ssh -i $SshKey "$VpsUser@$VpsIp" "~/deploy-urbanos-staging.sh $Ref"
if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Deploy remoto falló (exit $LASTEXITCODE). Revisa la salida de arriba." -ForegroundColor Red
    exit 1
}

Write-Host "==> Verificando https://$Domain/health ..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "https://$Domain/health" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "==> OK: $Domain responde 200 en /health" -ForegroundColor Green
    } else {
        Write-Host "==> FAIL: /health devolvió $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "==> FAIL: no se pudo alcanzar https://$Domain/health -- $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

- [ ] **Step 2: Verificar sintaxis del script (sin ejecutarlo)**

Run:
```powershell
$errors = $null
$tokens = $null
[System.Management.Automation.Language.Parser]::ParseFile("deploy/deploy-staging.ps1", [ref]$tokens, [ref]$errors) | Out-Null
if ($errors.Count -gt 0) { $errors; throw "Errores de sintaxis" } else { "OK: sin errores de sintaxis" }
```
Expected: `OK: sin errores de sintaxis`. Este parser solo analiza el AST, no ejecuta el script (no hace SSH ni toca el VPS).

- [ ] **Step 3: Commit**

```bash
git add deploy/deploy-staging.ps1
git commit -m "build: agregar script local de deploy del ambiente de pruebas"
```

---

### Task 7: Fragmento de nginx (documentación versionada)

**Files:**
- Create: `deploy/nginx-fragment-staging.conf`

**Interfaces:**
- Produces: el contenido exacto que se aplica a mano, **en dos fases**, al `~/tiviplay/nginx/nginx.conf` compartido del VPS (Task 9: solo el bloque HTTP; Task 12: el bloque HTTPS, una vez que `urbanos-backend-staging`/`urbanos-frontend-staging` ya existen — ver la nota del Step 1).

- [ ] **Step 1: Crear `deploy/nginx-fragment-staging.conf`**

```nginx
# Fragmento a agregar dentro del bloque `http { ... }` de
# ~/tiviplay/nginx/nginx.conf en el VPS (archivo compartido con TiviPlay,
# fuera de este repo). NO copiar y recargar los dos bloques de una sola vez:
#
#   1. Agregar PRIMERO solo el bloque "HTTP -> HTTPS" (el de abajo, listen 80)
#      y recargar. Esto habilita el challenge ACME para que certbot pueda
#      emitir el certificado (ver Task 9 y Task 10 del plan de implementación).
#   2. Recién cuando el certificado ya existe (Task 10) Y los contenedores
#      urbanos-backend-staging / urbanos-frontend-staging / urbanos-minio-staging
#      ya están arriba y unidos a tiviplay_tiviplay-network (Task 11), agregar
#      el segundo bloque (listen 443 ssl) y recargar (Task 12).
#
# Agregar el bloque 443 antes de que esos contenedores existan tumba nginx en
# crash-loop: "host not found in upstream" (ver contexto-despliegue-ovh.md,
# sección Gotchas, sobre este mismo tipo de fallo con el certificado).

# HTTP → HTTPS — stage-urbanos.saintsoft.us
server {
    listen 80;
    server_name stage-urbanos.saintsoft.us;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS — stage-urbanos.saintsoft.us (ambiente de pruebas urbanos-rurales)
server {
    listen 443 ssl;
    server_name stage-urbanos.saintsoft.us;

    ssl_certificate /etc/letsencrypt/live/stage-urbanos.saintsoft.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage-urbanos.saintsoft.us/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    # Backend API
    location /api/ {
        proxy_pass http://urbanos-backend-staging:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Scalar (UI de documentación) + spec OpenAPI
    location /scalar {
        proxy_pass http://urbanos-backend-staging:8080/scalar;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /openapi {
        proxy_pass http://urbanos-backend-staging:8080/openapi;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://urbanos-backend-staging:8080/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MinIO — imágenes públicas de inmuebles
    location /storage/ {
        proxy_pass http://urbanos-minio-staging:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;

        proxy_hide_header X-Amz-Request-Id;
        proxy_hide_header X-Amz-Id-2;
    }

    # Frontend
    location / {
        proxy_pass http://urbanos-frontend-staging:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 2: Verificar balance de llaves (chequeo estructural — el chequeo real de `nginx -t` ocurre en el VPS en las Tasks 9 y 12, porque `proxy_pass` a nombres de contenedor solo resuelve dentro de esa red Docker)**

Run:
```bash
open_braces=$(grep -o '{' deploy/nginx-fragment-staging.conf | wc -l)
close_braces=$(grep -o '}' deploy/nginx-fragment-staging.conf | wc -l)
echo "abre: $open_braces cierra: $close_braces"
```
Expected: los dos números son iguales.

- [ ] **Step 3: Commit**

```bash
git add deploy/nginx-fragment-staging.conf
git commit -m "docs: agregar fragmento de nginx del ambiente de pruebas"
```

---

### ⚠️ Checkpoint manual obligatorio (usuario, fuera de este repo)

Antes de continuar con la Task 8, el usuario debe agregar en **Cloudflare** un registro:

```
Tipo: A
Nombre: stage-urbanos
Contenido: 51.222.140.140
Proxy: DNS only (nube gris, no naranja) — igual que tiviplay.saintsoft.us,
       para que certbot pueda validar el challenge HTTP directo.
```

Verificar propagación antes de seguir:
```bash
dig +short stage-urbanos.saintsoft.us
```
Expected: devuelve `51.222.140.140`. Sin esto, la Task 10 (certbot) falla porque el challenge ACME no puede alcanzar el VPS.

---

### Task 8 / 9: nginx — bloque HTTP-only y recarga

**Files (en el VPS, fuera de este repo):**
- Modify: `~/tiviplay/nginx/nginx.conf`

- [ ] **Step 1: Confirmar que el DNS ya resuelve (repetir el checkpoint anterior)**

Run:
```bash
dig +short stage-urbanos.saintsoft.us
```
Expected: `51.222.140.140`. Si no, detenerse y esperar al usuario.

- [ ] **Step 2: Insertar solo el bloque HTTP (primeros 15 líneas de `deploy/nginx-fragment-staging.conf`, hasta el primer `}` que cierra el server de `listen 80`) en `~/tiviplay/nginx/nginx.conf`, dentro del bloque `http { ... }`, junto a los otros bloques `listen 80` existentes**

Run (vía SSH):
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cp ~/tiviplay/nginx/nginx.conf ~/tiviplay/nginx/nginx.conf.bak-$(date +%Y%m%d%H%M%S)"
```
(backup antes de tocar el archivo compartido — reversible con un `cp` inverso si algo sale mal).

Luego insertar manualmente, después del bloque `# HTTP → HTTPS — devtiviplay.saintsoft.us (staging)` existente y antes del `# HTTPS — Landing SaintSoft`, el bloque:
```nginx
    # HTTP → HTTPS — stage-urbanos.saintsoft.us
    server {
        listen 80;
        server_name stage-urbanos.saintsoft.us;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }
```

- [ ] **Step 3: Validar sintaxis dentro del contenedor y recargar**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cd ~/tiviplay && docker compose exec nginx nginx -t"
```
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`. Si falla, restaurar el backup del Step 2 (`cp` inverso) y no continuar.

```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cd ~/tiviplay && docker compose restart nginx"
```

- [ ] **Step 4: Verificar el redirect**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://stage-urbanos.saintsoft.us/
```
Expected: `301`.

---

### Task 10: Certificado TLS (certbot)

**Files (en el VPS, fuera de este repo):** ninguno del repo — genera `~/tiviplay/certbot/conf/live/stage-urbanos.saintsoft.us/`.

- [ ] **Step 1: Emitir el certificado vía webroot**

Run (mismo patrón que los certificados existentes, ver `contexto-despliegue-ovh.md`):
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cd ~/tiviplay && docker run --rm \
  -v ~/tiviplay/certbot/www:/var/www/certbot \
  -v ~/tiviplay/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d stage-urbanos.saintsoft.us --non-interactive --agree-tos \
  -m santiagogamboacely@gmail.com"
```

- [ ] **Step 2: Verificar que el certificado existe**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "ls ~/tiviplay/certbot/conf/live/stage-urbanos.saintsoft.us/"
```
Expected: lista `cert.pem  chain.pem  fullchain.pem  privkey.pem  README`.

---

### Task 11: Clonar, configurar secretos y primer deploy

**Files (en el VPS, fuera de este repo):**
- Create: `~/urbanos-rurales-staging/` (clon de git)
- Create: `~/urbanos-rurales-staging/deploy/.env` (secretos reales)
- Create: `~/deploy-urbanos-staging.sh` (copia de `deploy/vps-deploy.sh`, Task 5, fuera del clon)

- [ ] **Step 1: Clonar el repo**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "git clone --branch develop https://github.com/juanturriago7/urbanos-rurales.git ~/urbanos-rurales-staging"
```
Expected: `Cloning into '/home/ubuntu/urbanos-rurales-staging'...` seguido de éxito (repo público, sin prompt de credenciales).

- [ ] **Step 2: Generar secretos y crear `deploy/.env` real**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 bash -s <<'EOF'
set -euo pipefail
cd ~/urbanos-rurales-staging/deploy
cp staging.env.example .env
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n=/+')/" .env
sed -i "s/^JWT_KEY=.*/JWT_KEY=$(openssl rand -base64 48 | tr -d '\n=/+')/" .env
sed -i "s/^MINIO_ROOT_PASSWORD=.*/MINIO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n=/+')/" .env
cat .env
EOF
```
Expected: imprime el `.env` final con `POSTGRES_PASSWORD`, `JWT_KEY` y `MINIO_ROOT_PASSWORD` reemplazados por cadenas aleatorias (ninguna quedó en `CHANGE_ME`), y `STAGING_DOMAIN=stage-urbanos.saintsoft.us` sin tocar.

- [ ] **Step 3: Copiar el script de deploy fuera del clon**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cp ~/urbanos-rurales-staging/deploy/vps-deploy.sh ~/deploy-urbanos-staging.sh && chmod +x ~/deploy-urbanos-staging.sh"
```

- [ ] **Step 4: Primer deploy**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "~/deploy-urbanos-staging.sh develop"
```
Expected: build de las 3 imágenes (`migrator`/`api` comparten cache, `frontend`), el servicio `migrator` corre y termina en 0 (aplica las migraciones — su log final debe mostrar `Done.` de `dotnet ef database update`, sin excepciones), y termina con `docker compose ... ps` mostrando `urbanos-db-staging`, `urbanos-minio-staging`, `urbanos-backend-staging`, `urbanos-frontend-staging` en estado `Up`/`healthy`.

- [ ] **Step 5: Verificar que las migraciones se aplicaron**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "docker exec urbanos-db-staging psql -U portal_user -d portal_db -c 'SELECT COUNT(*) FROM \"__EFMigrationsHistory\";'"
```
Expected: un número mayor a 0 (coincide con la cantidad de migraciones en `Backend/src/Portal.Infrastructure/Migrations/`).

- [ ] **Step 6: Verificar salud interna del backend (todavía sin nginx apuntando aquí)**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "docker exec urbanos-backend-staging curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/health"
```
Expected: `200`.

---

### Task 12: nginx — bloque HTTPS y recarga final

**Files (en el VPS, fuera de este repo):**
- Modify: `~/tiviplay/nginx/nginx.conf`

**Interfaces:**
- Consumes: certificado de la Task 10, contenedores `urbanos-backend-staging` / `urbanos-frontend-staging` / `urbanos-minio-staging` ya corriendo (Task 11) y unidos a `tiviplay_tiviplay-network`.

- [ ] **Step 1: Confirmar que los 3 contenedores están en la red compartida**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "docker network inspect tiviplay_tiviplay-network --format '{{range .Containers}}{{.Name}} {{end}}'"
```
Expected: la lista incluye `urbanos-backend-staging`, `urbanos-frontend-staging`, `urbanos-minio-staging` (además de los contenedores de TiviPlay que ya estaban).

- [ ] **Step 2: Insertar el bloque HTTPS en `~/tiviplay/nginx/nginx.conf`, al final del archivo, antes del `}` que cierra el bloque `http { ... }`**

(Mismo backup previo que en la Task 9, Step 2: `cp ~/tiviplay/nginx/nginx.conf ~/tiviplay/nginx/nginx.conf.bak-$(date +%Y%m%d%H%M%S)`.)

```nginx
    # HTTPS — stage-urbanos.saintsoft.us (ambiente de pruebas urbanos-rurales)
    server {
        listen 443 ssl;
        server_name stage-urbanos.saintsoft.us;

        ssl_certificate /etc/letsencrypt/live/stage-urbanos.saintsoft.us/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/stage-urbanos.saintsoft.us/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 20M;

        # Backend API
        location /api/ {
            proxy_pass http://urbanos-backend-staging:8080/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Scalar (UI de documentación) + spec OpenAPI
        location /scalar {
            proxy_pass http://urbanos-backend-staging:8080/scalar;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /openapi {
            proxy_pass http://urbanos-backend-staging:8080/openapi;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://urbanos-backend-staging:8080/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # MinIO — imágenes públicas de inmuebles
        location /storage/ {
            proxy_pass http://urbanos-minio-staging:9000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_buffering off;

            proxy_hide_header X-Amz-Request-Id;
            proxy_hide_header X-Amz-Id-2;
        }

        # Frontend
        location / {
            proxy_pass http://urbanos-frontend-staging:80/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

- [ ] **Step 3: Validar y recargar**

Run:
```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cd ~/tiviplay && docker compose exec nginx nginx -t"
```
Expected: `test is successful`. Si falla con `host not found in upstream`, es la Task 11 la que no terminó bien (contenedor caído o fuera de red) — no seguir, volver a la Task 11.

```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140 "cd ~/tiviplay && docker compose restart nginx"
```

- [ ] **Step 4: Verificar que TiviPlay prod sigue sano tras el restart de nginx (no debe verse afectado)**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://tiviplay.saintsoft.us/health
```
Expected: `200` (o el código que ya devolviera antes de este cambio — el objetivo es confirmar que reiniciar el nginx compartido no rompió el dominio de producción).

---

### Task 13: Smoke test end-to-end

- [ ] **Step 1: Health check**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://stage-urbanos.saintsoft.us/health
```
Expected: `200`.

- [ ] **Step 2: Frontend**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://stage-urbanos.saintsoft.us/
```
Expected: `200`.

- [ ] **Step 3: Documentación de la API (Scalar)**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://stage-urbanos.saintsoft.us/openapi/v1.json
```
Expected: `200`.

- [ ] **Step 4: Login del admin sembrado automáticamente**

Run:
```bash
curl -s -X POST https://stage-urbanos.saintsoft.us/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@portal.local","password":"Admin123*"}' \
  -o /tmp/login-response.json -w "%{http_code}\n"
cat /tmp/login-response.json
```
Expected: `200` y un JSON con `user` y `tokens.accessToken` (confirma que el seeder de `Program.cs:120-151` corrió y que JWT/DB/CORS quedaron bien configurados).

- [ ] **Step 5: Correr el script local completo una vez, de punta a punta**

Run (desde la raíz del repo, en PowerShell):
```powershell
.\deploy\deploy-staging.ps1
```
Expected: termina con `==> OK: stage-urbanos.saintsoft.us responde 200 en /health` en verde. Este es el mismo comando que el usuario correrá tras cada push a `develop` de aquí en adelante.

---

### Task 14: Documentar el ambiente nuevo en `contexto-despliegue-ovh.md`

**Files:**
- Modify: `contexto-despliegue-ovh.md`

- [ ] **Step 1: Agregar una sección nueva** (siguiendo el mismo formato que la sección "Estructura en el servidor" ya existente), después de la sección de TiviPlay y antes de "Cron jobs configurados":

```markdown
---

## Ambiente de pruebas — urbanos-rurales (portal inmobiliario)

Segundo proyecto en el mismo VPS, independiente de TiviPlay, agregado el
2026-09-06. Ver `docs/superpowers/specs/2026-09-06-ambiente-pruebas-vps-ovh-design.md`
en el repo `urbanos-rurales` para el diseño completo.

| Dato | Valor |
|---|---|
| URL | `https://stage-urbanos.saintsoft.us` |
| Repo | `https://github.com/juanturriago7/urbanos-rurales` (público, rama `develop`) |
| Directorio en el VPS | `~/urbanos-rurales-staging/` (clon de git) |
| Compose | `~/urbanos-rurales-staging/deploy/docker-compose.staging.yml` |
| Secretos | `~/urbanos-rurales-staging/deploy/.env` (no versionado) |
| Contenedores | `urbanos-db-staging`, `urbanos-minio-staging`, `urbanos-backend-staging`, `urbanos-frontend-staging` |
| Redeploy | `.\deploy\deploy-staging.ps1` (local, tras cada push a `develop` — no hay GitHub Actions, el usuario no tiene acceso admin al repo) |
| Script remoto | `~/deploy-urbanos-staging.sh` en el VPS (copia de `deploy/vps-deploy.sh` del repo, vive fuera del clon a propósito) |

Comparte el `crm-nginx` y el certbot de TiviPlay (bloques nuevos agregados a
`~/tiviplay/nginx/nginx.conf`, certificado propio en
`~/tiviplay/certbot/conf/live/stage-urbanos.saintsoft.us/`) — no tiene nginx
ni certbot propios. Se une a la red `tiviplay_tiviplay-network` para que el
nginx compartido pueda alcanzarlo.
```

- [ ] **Step 2: Commit**

```bash
git add contexto-despliegue-ovh.md
git commit -m "docs: documentar el ambiente de pruebas urbanos-rurales en el VPS"
```
