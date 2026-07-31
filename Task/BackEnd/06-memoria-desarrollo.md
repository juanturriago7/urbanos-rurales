# 06. Memoria de desarrollo Backend

> Archivo de memoria viva: registra el estado real de implementación de cada vertical del backlog
> (`03-backlog-backend.md`) y las decisiones tomadas durante el desarrollo.
> **Actualizar cada vez que se complete o bloquee una tarea.**

Última actualización: 2026-07-25

## Estado por vertical

| # | Vertical | Estado | Notas |
| --- | --- | --- | --- |
| 1 | Infraestructura de datos (migraciones V003/V004 + seeds) | ✅ Completado | `V003__dominio_inmobiliario.sql` (+down) y `V004__seeds_catalogos.sql` (+down); entidades `Inmueble`, `InmuebleOperacion`, `Lead` y enums en `Portal.Domain` |
| 2 | Autenticación (login, refresh, logout, recuperar password, bloqueo RF-063) | ✅ Completado | `AuthController` + 5 commands; BCrypt, JWT con rotación de refresh, tokens de reset de un solo uso |
| 3 | Catálogos públicos (ubicaciones árbol, tipos, características agrupadas) | ✅ Completado | `CatalogosController` + 3 queries |
| 4 | CRUD admin de inmuebles + operaciones (RF-070..078) | ✅ Completado | `AdminInmueblesController` + 6 commands + 2 queries; código/slug automáticos (RF-074), validación de publicación (RF-077) |
| 5 | Búsqueda pública (filtros, orden, paginación, texto libre, similares) | ✅ Completado | `InmueblesController` público; filtros del contrato en snake_case, subárbol de ubicaciones con CTE recursiva, tsvector para `q` |
| 6 | Leads (captura pública + gestión admin) | ✅ Completado | `POST /api/leads` (rate limit 5/min por IP + honeypot) y `GET/PUT /api/admin/leads` |
| 7 | SEO: sitemap.xml dinámico + robots.txt | ✅ Completado | `GET /api/sitemap.xml` y `GET /robots.txt` (bloquea `/admin`, RNF-024) |
| 8 | Multimedia (S3 + pipeline WebP) | 🚫 Bloqueado | Requiere confirmar proveedor de objetos (ver `05-proximos-pasos.md` #3). Se deja `imagenes` en DDL y endpoints fuera de alcance de esta fase |
| 9 | Sesión externalizada Redis (RNF-012) | 🚫 Bloqueado | JWT stateless cubre el MVP; Redis se decide en infra de despliegue |
| 10 | Observabilidad / backups / GA4 | 🚫 Bloqueado | Tareas de infraestructura de despliegue, no de código |

Leyenda: ✅ Completado · 🔄 En progreso · ⏳ Pendiente · 🚫 Bloqueado (decisión externa)

## Decisiones de diseño

- **Refresh tokens**: el frontend (interceptor axios) espera `access_token` + `refresh_token` y endpoint de refresh.
  Se agrega `POST /api/auth/refresh` al contrato. El refresh token se guarda *hasheado* (SHA-256) en
  `usuarios.refresh_token_hash` + `refresh_token_expira` (modelo de sesión única por usuario).
- **Hash de contraseñas**: BCrypt (`BCrypt.Net-Next`), cumple RNF-021.
- **Recuperación de contraseña (RF-062)**: tabla `password_reset_tokens` con token de un solo uso hasheado
  y expiración de 1 hora. El envío de correo queda tras la interfaz `ICorreoService` (implementación dev:
  escribe al log; SMTP real se conecta en despliegue).
- **Anti-spam de leads (RNF-023)**: rate limiting nativo de ASP.NET (ventana fija por IP) + campo honeypot.
  reCAPTCHA v3 se integrará cuando haya claves del sitio.
- **Enums Postgres nativos** (`estado_inmueble`, `tipo_operacion`, etc.): se leen con `::text` y se escriben
  con `CAST(@p AS tipo)`, igual que `rol_usuario`.
- **Entidades del dominio Task**: no heredan de `BaseEntity` (PK `BIGSERIAL`, `creado_en`), siguiendo el
  precedente de `Usuario`.
- **`busqueda_tsv`**: se mantiene con trigger en Postgres (config `spanish` + `unaccent`), no desde C#.

## Registro de avance

- **2026-07-25** — Inventario inicial: solo existe slice `Roles` + entidad/repo `Usuario` (sin login).
  Se crea este archivo de memoria y se arranca la vertical 1 (migraciones).
- **2026-07-25** — ✅ Vertical 1: migraciones `V003` (DDL dominio completo + trigger `busqueda_tsv` +
  columnas refresh token + `password_reset_tokens`) y `V004` (seeds: 6 zonas, 19 localidades, UPZ/barrios
  de ejemplo, 7 tipos de inmueble, 4 categorías con 23 características, admin dev
  `admin@portal.local` / `Admin123*` vía `pgcrypto`). Entidades de dominio y enums creados;
  `UsuarioRepository` actualizado con columnas de refresh token.
- **2026-07-25** — ✅ Vertical 2 (Auth): `POST /api/auth/{login,refresh,logout,recuperar-password,restablecer-password}`.
  Login devuelve `{ user, tokens }` y refresh `{ accessToken, refreshToken, expiresIn }`, la forma exacta
  que ya espera el frontend (`shared/types/auth.ts` + interceptor axios). Bloqueo tras 5 intentos (RF-063)
  vía reglas de la entidad `Usuario`; mensajes genéricos anti-enumeración; refresh token con rotación,
  persistido como SHA-256. Nuevos servicios en Infrastructure: `BcryptPasswordHasher`, `JwtTokenService`,
  `CorreoLogService` (dev: escribe al log). Paquetes agregados a Infrastructure: `BCrypt.Net-Next`,
  `System.IdentityModel.Tokens.Jwt`.
  ⚠ Nota: no hay SDK de .NET en la máquina (solo runtimes 8/9); se está instalando .NET 10 SDK en el
  perfil de usuario para poder compilar.
- **2026-07-25** — ✅ Vertical 3 (Catálogos): `GET /api/catalogos/{ubicaciones,tipos-inmueble,caracteristicas}`.
  El repo devuelve filas planas y los handlers arman el árbol/agrupación.
- **2026-07-25** — ✅ Vertical 4 (CRUD admin inmuebles): `GET/POST /api/admin/inmuebles`,
  `GET/PUT/DELETE /api/admin/inmuebles/{id}`, `PUT {id}/estado`, `PUT {id}/destacado`,
  `POST|PUT {id}/operaciones` (upsert venta/arriendo, RF-076). Creación transaccional del agregado
  (inmueble + operaciones + características). Publicar exige campos obligatorios + imagen + operación
  activa (RF-077). Se instaló .NET 10 SDK (10.0.302) en el perfil de usuario; primer build falló por
  downgrade `Npgsql 10 → 9.0.3` (conflicto con paquetes EF Core 10 preexistentes) → se subió `Npgsql`
  a 10.0.0.
- **2026-07-25** — ✅ Vertical 5 (Búsqueda pública): `GET /api/inmuebles` (filtros del contrato:
  `operacion, tipo, ubicacion_id, precio_min/max, area_min/max, habitaciones, banos, parqueaderos,
  mascotas, estrato, admin_incluida, q, orden, page`), `GET /api/inmuebles/{slug}` (sin dirección
  exacta, RF-044) y `GET /api/inmuebles/{id}/similares` (RF-046: mismo barrio + tipo + precio ±30%).
- **2026-07-25** — ✅ Vertical 6 (Leads): `POST /api/leads` público con rate limiting nativo de ASP.NET
  (5 req/min por IP, policy `leads`) + campo honeypot `sitio` (si viene lleno responde éxito falso sin
  persistir). `GET/PUT /api/admin/leads` para gestión/asignación. Notificación por `ICorreoService` al
  crear lead. `Lead.IpOrigen` quedó como `IPAddress?` (mapeo natural de Npgsql para `INET`).
- **2026-07-25** — ✅ Vertical 7 (SEO): `SeoController` con `GET /api/sitemap.xml` (home + búsqueda +
  fichas publicadas con `lastmod`) y `GET /robots.txt` (Disallow `/admin`, RNF-024). URL base del sitio
  en config `Frontend:BaseUrl`.
- **2026-07-25** — ✅ Cierre: `dotnet build Portal.slnx` en verde (0 errores). Contrato de API
  actualizado en ambas copias (`Task/BackEnd/04` y `Task/FrontEnd/02`) con `POST /api/auth/refresh` y
  `POST /api/auth/restablecer-password`.

## Notas para retomar

- **Compilar**: el SDK .NET 10 (10.0.302) quedó en `C:\Users\Invitado\.dotnet` (no está en el PATH
  global). En una terminal nueva: `$env:PATH = "$env:USERPROFILE\.dotnet;$env:PATH"` y luego
  `dotnet build Portal.slnx` desde `Backend/`.
- **Base de datos**: aplicar manualmente y en orden `V001` → `V002` → `V003` → `V004`
  (`src/Portal.Infrastructure/Migrations/`). V004 requiere `pgcrypto` (la crea la propia migración).
  Credenciales dev tras V004: `admin@portal.local` / `Admin123*` (⚠ solo desarrollo).
- **Warnings NU1903 preexistentes**: `Microsoft.OpenApi 2.0.0` (vía `Microsoft.AspNetCore.OpenApi`) y
  `System.Security.Cryptography.Xml 9.0.0` (vía paquetes EF Core) tienen avisos de vulnerabilidad;
  conviene subir esas referencias cuando haya versiones parcheadas.
- **Cambio preexistente tocado**: se subió `Npgsql` 9.0.3 → 10.0.0 en `Portal.Infrastructure` porque
  los paquetes EF Core 10 (agregados fuera de esta sesión) exigían `Npgsql >= 10`.
- **Pendientes bloqueados**: multimedia/S3 (falta proveedor), Redis (RNF-012), reCAPTCHA v3 (faltan
  claves), SMTP real para `ICorreoService`, backups/observabilidad (infra de despliegue).
