# Contexto de Despliegue - CRM TiviPlay + SaintSoft en OVH Cloud

## Estado Actual: ✅ EN PRODUCCIÓN (migrado desde AWS el 2026-08-30)

Ambos proyectos (CRM TiviPlay y la landing de SaintSoft) corren ahora en un único VPS de OVH Cloud, migrados desde AWS EC2 (`44.222.156.217`, ver `contexto-despliegue.md` para el estado legacy).

---

## Servidor OVH

| Dato | Valor |
|------|-------|
| Nombre VPS | `vps-8f036300.vps.ovh.ca` |
| IP Pública (IPv4) | `51.222.140.140` |
| IP Pública (IPv6) | `2607:5300:205:200::b189` |
| Especificaciones | 2 vCPU, 3.7 GB RAM, 38 GB SSD |
| OS | Ubuntu 26.04 LTS |
| Usuario SSH | `ubuntu` |
| Autenticación | **Solo llave SSH** — login por contraseña deshabilitado en `sshd_config` |
| Llave privada | `C:\Users\Santiago\.ssh\tiviplay-ovh-key` (NO subir a Git). Copia de respaldo en `BackUp30082026/config/ssh-keys/` |
| Firewall | `ufw` activo, solo puertos 22/80/443 abiertos |
| Swap | 2 GB (`/swapfile`), swappiness=10 |

```bash
ssh -i ~/.ssh/tiviplay-ovh-key ubuntu@51.222.140.140
```

> Nota: la contraseña temporal que envía OVH por correo se rotó una sola vez durante el bootstrap inicial y ya no es válida (login por contraseña está deshabilitado). El único acceso es por llave.

---

## URLs de Acceso

```
CRM TiviPlay:  https://tiviplay.saintsoft.us
CRM API:       https://tiviplay.saintsoft.us/api
Swagger:       https://tiviplay.saintsoft.us/swagger

Landing SaintSoft: https://saintsoft.us
                   https://www.saintsoft.us
```

Certificados TLS reales de Let's Encrypt (no `nip.io`), renovación automática vía cron.

---

## DNS

**Gestionado en Cloudflare** (nameservers `logan.ns.cloudflare.com` / `ulla.ns.cloudflare.com`), aunque el dominio esté registrado en Namecheap — Namecheap solo delega. Login a Cloudflare vía "Sign in with Google" (`santiagogamboacely@gmail.com`).

| Registro | Tipo | Apunta a |
|---|---|---|
| `tiviplay.saintsoft.us` | A | `51.222.140.140` |
| `saintsoft.us` | A | `51.222.140.140` (antes `44.222.156.217`) |
| `www.saintsoft.us` | CNAME | `saintsoft.us` |
| MX / TXT (email forwarding) | — | sin cambios, no relacionados al hosting |

---

## Estructura en el servidor

```
~/tiviplay/
├── docker-compose.yml       # CRM (db, minio, backend, frontend) + saintsoft + nginx + certbot
├── .env                     # variables del CRM (backend/db/minio)
├── nginx/nginx.conf         # reverse proxy para ambos dominios
├── certbot/{conf,www}/      # certificados Let's Encrypt (¡debe estar en esta ruta relativa, no en ~/certbot!)
├── BackEnd/ CRMFrontend/ database/   # código del CRM (rama main)
└── saintsoft/               # código de la landing (copiado tal cual estaba desplegado en AWS)
    └── .env                 # credenciales de Gmail para el formulario de contacto
```

Contenedores: `tiviplay-db`, `tiviplay-minio`, `crm-backend`, `crm-frontend`, `saintsoft`, `crm-nginx`.

---

## Variables de entorno — secretos preservados de AWS

Estos valores se copiaron **byte a byte** desde el `.env` de AWS y NO deben cambiar (romperían el descifrado de datos existentes o la autenticación de MinIO sobre el volumen migrado):

- `EncryptionSettings__Key`
- `Storage__AccessKey` / `Storage__SecretKey` (== `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)
- `JWT__Secret` / `JwtSettings__Key`
- `POSTGRES_PASSWORD`

Lo único que cambió respecto al `.env` de AWS fue lo dependiente del dominio: `Storage__PublicBaseUrl`, `MINIO_SERVER_URL`, `MINIO_BROWSER_REDIRECT_URL`, `CORS__AllowedOrigins`, y `VITE_SERVER_BASE_URL` del frontend.

Ver valores reales en el `.env` del servidor o en `contexto-despliegue.md` (AWS) — no se duplican aquí por seguridad.

---

## Migración de datos (proceso usado, por si hay que repetirlo)

1. **Postgres**: `pg_dump -Fc` en caliente desde AWS → `pg_restore --clean --if-exists --no-owner --role=postgres` en OVH. Sin downtime en AWS.
2. **MinIO**: `tar` del volumen `app_minio_data` (AWS) streameado directo por SSH al volumen `tiviplay_minio_data` (OVH), con el contenedor MinIO detenido del lado destino durante la copia.
3. **SaintSoft**: copia exacta de `~/app/saintsoft` en AWS (no del working copy local, que tenía cambios sin commitear).

Como AWS siguió recibiendo tráfico real durante el período de validación en paralelo, este proceso se repitió varias veces (re-sync) antes del corte definitivo — ver histórico de conteos en las notas de la migración.

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

---

## Cron jobs configurados

```
0 3 * * *  certbot renew --quiet && docker compose restart nginx   # renueva TODOS los certs (ambos dominios)
0 2 * * *  pg_dump -Fc tiviplay > backups/backup_$(date).dump      # backup diario, retiene 14 días
0 4 * * 0  docker system prune -af                                 # limpieza semanal
```

---

## Gotchas encontrados durante la migración

- **Ruta de certbot**: debe ser `~/tiviplay/certbot/{conf,www}` (relativa al `docker-compose.yml`), no `~/certbot`. Si nginx entra en crash-loop con "cannot load certificate", revisar esto primero.
- Tras corregir la ruta de un bind-mount en un contenedor ya creado, `docker compose up -d` **no** recoge el cambio — hace falta `docker compose up -d --force-recreate <servicio>`.
- El dry-run de renovación de Certbot mete un delay aleatorio (~7 min) por diseño; usar `--no-random-sleep-on-renew` solo para pruebas manuales, nunca en el cron real.
- El entorno de *staging* de Let's Encrypt tiene rate-limits propios — no es señal de problema con el certificado real de producción.

---

## Servidor AWS (legacy, en desuso tras el corte)

Ver `contexto-despliegue.md` para el detalle completo. Resumen: IP `44.222.156.217`, IP dinámica (no Elástica — al detener la instancia se pierde permanentemente), instancia `i-007480d3e1b0d08ff` (t3.small), volumen raíz `vol-0e58498eb15c42424` (20GB, se borra solo al *terminar*, no al *detener*).

---

## Respaldo local completo

Backup independiente de ambos servidores en `C:\Users\Santiago\Documents\Proyectos\BackUp30082026\` (dumps de Postgres, volumen de MinIO, imágenes Docker ya construidas, código fuente exacto de AWS, configs de ambos servidores, ambas llaves SSH). Ver su `README.md` para pasos de restauración.
