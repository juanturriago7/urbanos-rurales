# FASE 0 — Desbloquear la base de datos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar y aplicar la migración inicial de EF Core para que `docker compose up` + `dotnet ef database update` dejen Postgres con el esquema completo (dominio inmobiliario + auth + seeds) y la API arranque y responda contra datos reales.

**Architecture:** Una única migración EF Core (`InitialSchema`) generada desde `PortalDbContext` (que ya describe el 100% del esquema vía `IEntityTypeConfiguration<T>`). El modelo EF ya declara los ENUM nativos, las extensiones Postgres y los seeds de catálogo vía `HasData` — la migración generada debe incluir todo eso automáticamente. La única pieza que EF no puede expresar (un `INSERT` con `crypt()/gen_salt()` de pgcrypto) se añade a mano sobre el archivo generado, igual que hacía `V004__seeds_catalogos.sql`.

**Tech Stack:** .NET 10, EF Core 10 + Npgsql.EntityFrameworkCore.PostgreSQL 10 (design-time only), dotnet-ef 10.0.5 (ya instalado global), PostgreSQL 16 vía `postgis/postgis:16-3.4` en `Backend/docker-compose.yml`.

## Global Constraints

- Todo comando de este plan se ejecuta desde `Backend/` salvo que se indique lo contrario.
- No aplicar nada de `Backend/db/sql-legacy/*.sql` junto al modelo EF — son solo referencia (CLAUDE.md).
- El runtime de la API sigue siendo Dapper; `PortalDbContext` no se registra en DI y no se toca en este plan.
- No commitear secretos: `appsettings.Development.json` debe quedar excluido en `.gitignore`.
- No hacer `git push` sin confirmar con el usuario primero.
- No inventar un test runner: este proyecto no tiene tests; la verificación de cada tarea es por comando/inspección manual, no por suite automatizada.
- Dominio en español (`inmuebles`, `ubicaciones`, `leads`, etc.) — ya así en el modelo, no se renombra nada en este plan.

---

## File Structure

- `Backend/src/Portal.Infrastructure/Migrations/` — **nueva carpeta**, creada por `dotnet ef migrations add`. Contendrá `<timestamp>_InitialSchema.cs`, `<timestamp>_InitialSchema.Designer.cs` y `PortalDbContextModelSnapshot.cs`.
- `Backend/src/Portal.Api/appsettings.Development.json` — **nuevo archivo**, credenciales de desarrollo reales (gitignored).
- `Backend/.gitignore` — se añade `appsettings.Development.json` a la lista de secretos.
- `Task/BackEnd/06-memoria-desarrollo.md` — se corrigen 3 afirmaciones desactualizadas y se añade una entrada de avance.

---

### Task 1: Generar la migración inicial y verificar su contenido

**Files:**
- Create (autogenerado por la herramienta): `Backend/src/Portal.Infrastructure/Migrations/<timestamp>_InitialSchema.cs`
- Create (autogenerado): `Backend/src/Portal.Infrastructure/Migrations/<timestamp>_InitialSchema.Designer.cs`
- Create (autogenerado): `Backend/src/Portal.Infrastructure/Migrations/PortalDbContextModelSnapshot.cs`

**Interfaces:**
- Produces: el archivo `<timestamp>_InitialSchema.cs` con métodos `Up(MigrationBuilder migrationBuilder)` y `Down(MigrationBuilder migrationBuilder)` — Task 2 edita este mismo archivo.

- [ ] **Step 1: Confirmar que el build sigue en verde**

Run (desde `Backend/`): `dotnet build Portal.slnx`
Expected: `Compilación correcta.` y `0 Errores` (los warnings NU1903 preexistentes son esperados y no bloquean).

- [ ] **Step 2: Generar la migración**

Run (desde `Backend/`):
```bash
dotnet ef migrations add InitialSchema -p src/Portal.Infrastructure -s src/Portal.Api
```
Expected: termina con `Done.` y lista los 3 archivos nuevos bajo `Migrations/`.

- [ ] **Step 3: Verificar que EF generó los ENUM nativos sin intervención manual**

Abrir `<timestamp>_InitialSchema.cs` y confirmar en `Up()` que existen 7 llamadas `migrationBuilder.AlterDatabase()...Annotation("Npgsql:Enum:...")` o el equivalente `CREATE TYPE ... AS ENUM` vía `.Sql(...)` autogenerado para: `rol_usuario`, `tipo_ubicacion`, `estado_inmueble`, `politica_mascotas`, `tipo_operacion`, `estado_operacion`, `estado_lead`.
Expected: los 7 tipos aparecen. Si falta alguno, NO escribirlo a mano todavía — reportar antes de continuar, porque significaría que `PortalDbContext.OnModelCreating` no está siendo leído como se esperaba.

- [ ] **Step 4: Verificar extensiones y columna generada `busqueda_tsv`**

En el mismo archivo, confirmar:
- `migrationBuilder.AlterDatabase()` con anotaciones `Npgsql:PostgresExtension:pg_trgm`, `:unaccent`, `:pgcrypto` (o 3 líneas `CREATE EXTENSION IF NOT EXISTS`).
- La creación de la tabla `inmuebles` incluye la columna `busqueda_tsv` con `computedColumnSql:` (el `setweight(to_tsvector('spanish', ...))` de `InmuebleConfiguration.cs:78-82`) y `stored: true` — **no** debe haber un `CREATE TRIGGER` para esto, ese diseño quedó reemplazado por la columna generada.
Expected: ambas cosas presentes automáticamente.

- [ ] **Step 5: Verificar los seeds de catálogo**

Confirmar que `Up()` incluye `migrationBuilder.InsertData(...)` para las tablas `roles` (2 filas), `tipos_inmueble` (7 filas), `categorias_caracteristica` (4 filas), `caracteristicas` (22 filas) y `ubicaciones` (41 filas).
Expected: las 5 tablas aparecen con `InsertData`. Esto confirma que **no** hace falta portar manualmente el `INSERT` de `V004` para catálogos — solo falta el usuario admin (Task 2).

- [ ] **Step 6: Commit**

```bash
git add src/Portal.Infrastructure/Migrations/
git commit -m "feat(db): generar migracion EF InitialSchema"
```

---

### Task 2: Añadir el seed del usuario admin de desarrollo

El modelo EF no tiene (ni debe tener) un `HasData` para `Usuario`, porque el hash de contraseña se calcula con `crypt()/gen_salt()` de pgcrypto en tiempo de inserción, no como literal estático. Es el único dato de `V004__seeds_catalogos.sql` que de verdad falta.

**Files:**
- Modify: `Backend/src/Portal.Infrastructure/Migrations/<timestamp>_InitialSchema.cs`

**Interfaces:**
- Consumes: la tabla `usuarios` y el enum `rol_usuario` ya creados por `Up()` en los pasos anteriores del mismo archivo (este `Sql()` debe ir **al final** de `Up()`, después de que la tabla exista).

- [ ] **Step 1: Añadir el INSERT al final de `Up()`**

Justo antes del cierre del método `Up(MigrationBuilder migrationBuilder)`, añadir:

```csharp
migrationBuilder.Sql("""
    INSERT INTO usuarios (nombre, correo, password_hash, rol)
    VALUES (
        'Administrador Dev',
        'admin@portal.local',
        crypt('Admin123*', gen_salt('bf', 11)),
        'admin'
    );
    """);
```

- [ ] **Step 2: Añadir el DELETE correspondiente al inicio de `Down()`**

Justo después de la apertura del método `Down(MigrationBuilder migrationBuilder)` (antes de que empiece a borrar tablas), añadir:

```csharp
migrationBuilder.Sql("DELETE FROM usuarios WHERE correo = 'admin@portal.local';");
```

- [ ] **Step 3: Rebuild para confirmar que la edición manual compila**

Run: `dotnet build Portal.slnx`
Expected: `Compilación correcta.`, `0 Errores`.

- [ ] **Step 4: Commit**

```bash
git add src/Portal.Infrastructure/Migrations/
git commit -m "feat(db): sembrar usuario admin de desarrollo en InitialSchema"
```

---

### Task 3: Credenciales de desarrollo reales para poder arrancar la API localmente

`appsettings.json` solo trae placeholders `CHANGE_ME`. No existe `appsettings.Development.json`, así que hoy `dotnet run` no puede autenticar contra Postgres ni firmar JWT con una key real.

**Files:**
- Create: `Backend/src/Portal.Api/appsettings.Development.json`
- Modify: `Backend/.gitignore`

**Interfaces:**
- Consumes: mismas credenciales que `docker-compose.yml:10-12` (`portal_user` / `portal_pass` / `portal_db`) para que el mismo Postgres sirva tanto al contenedor `api` como a `dotnet run` local.

- [ ] **Step 1: Crear `appsettings.Development.json`**

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=portal_db;Username=portal_user;Password=portal_pass"
  },
  "Jwt": {
    "Key": "dev-local-only-key-not-for-production-min-32-chars-1234567890"
  }
}
```

- [ ] **Step 2: Excluir el archivo de git**

En `Backend/.gitignore`, dentro de la sección `## Secrets`, añadir una línea junto a `**/appsettings.Production.json`:

```
**/appsettings.Development.json
```

- [ ] **Step 3: Verificar que git no lo trackea**

Run: `git status --porcelain Backend/src/Portal.Api/appsettings.Development.json`
Expected: sin salida (archivo ignorado, no aparece como untracked).

- [ ] **Step 4: Commit**

```bash
git add Backend/.gitignore
git commit -m "chore(api): ignorar appsettings.Development.json"
```

(El propio `appsettings.Development.json` NO se commitea — queda solo en disco local.)

---

### Task 4: Levantar Postgres y aplicar la migración

**Files:** ninguno (solo comandos; efecto es estado del contenedor + la base de datos).

**Interfaces:**
- Consumes: `Backend/docker-compose.yml` (servicio `postgres`), migración `InitialSchema` de Task 1+2.

- [ ] **Step 1: Levantar solo Postgres**

Run (desde `Backend/`): `docker compose up -d postgres`
Expected: contenedor `portal_postgres` en estado `running`.

- [ ] **Step 2: Esperar a que el healthcheck pase**

Run: `docker compose ps postgres`
Expected: columna `STATUS` muestra `healthy` (puede tardar ~10-20s; repetir el comando si aún dice `starting`).

- [ ] **Step 3: Aplicar la migración**

Run (desde `Backend/`):
```bash
dotnet ef database update -p src/Portal.Infrastructure -s src/Portal.Api
```
Expected: termina con `Done.` sin errores. Si falla con error de conexión, confirmar que `PortalDbContextFactory.ConexionDesarrollo` (`Host=localhost;Port=5432;...Password=portal_pass`) coincide con las credenciales del paso 1 — deberían coincidir siempre porque son las del docker-compose.

- [ ] **Step 4: Verificar el esquema aplicado**

Run:
```bash
docker compose exec postgres psql -U portal_user -d portal_db -c "\dt"
```
Expected: lista incluye `usuarios`, `roles`, `inmuebles`, `inmueble_operaciones`, `inmueble_caracteristicas`, `imagenes`, `leads`, `inmueble_historial`, `ubicaciones`, `tipos_inmueble`, `categorias_caracteristica`, `caracteristicas`, `password_reset_tokens`, `__EFMigrationsHistory`.

- [ ] **Step 5: Verificar los seeds**

Run:
```bash
docker compose exec postgres psql -U portal_user -d portal_db -c "SELECT count(*) FROM tipos_inmueble; SELECT count(*) FROM ubicaciones; SELECT correo, rol::text FROM usuarios;"
```
Expected: `tipos_inmueble` = 7, `ubicaciones` = 41, y una fila `admin@portal.local | admin`.

---

### Task 5: Verificar que la API arranca y responde con datos reales

**Files:** ninguno.

**Interfaces:**
- Consumes: `appsettings.Development.json` (Task 3), base de datos migrada (Task 4), endpoint `GET /api/catalogos/tipos-inmueble` (`Backend/src/Portal.Api/Controllers/CatalogosController.cs:34`).

- [ ] **Step 1: Arrancar la API**

Run (desde `Backend/`, en segundo plano): `dotnet run --project src/Portal.Api`
Expected en el log de arranque: `Now listening on: http://localhost:5095` (perfil `http` de `launchSettings.json`), sin excepciones fatales de Serilog.

- [ ] **Step 2: Probar el endpoint de catálogos**

Run: `curl http://localhost:5095/api/catalogos/tipos-inmueble`
Expected: JSON con 7 objetos (`Apartamento`, `Casa`, `Apartaestudio`, `Local`, `Oficina`, `Bodega`, `Lote`), HTTP 200.

- [ ] **Step 3: Probar el health check**

Run: `curl -i http://localhost:5095/health`
Expected: `HTTP/1.1 200 OK` con cuerpo `Healthy`.

- [ ] **Step 4: Detener la API**

Terminar el proceso de `dotnet run` iniciado en el Step 1.

---

### Task 6: Corregir Task/BackEnd/06-memoria-desarrollo.md

El archivo tiene 3 afirmaciones que ya no son ciertas tras completar FASE 0, y su propia cabecera exige actualizarlo al cerrar cada vertical.

**Files:**
- Modify: `Task/BackEnd/06-memoria-desarrollo.md`

- [ ] **Step 1: Corregir la ruta de migraciones (línea ~90-91)**

Reemplazar:
```
- **Base de datos**: aplicar manualmente y en orden `V001` → `V002` → `V003` → `V004`
  (`src/Portal.Infrastructure/Migrations/`). V004 requiere `pgcrypto` (la crea la propia migración).
  Credenciales dev tras V004: `admin@portal.local` / `Admin123*` (⚠ solo desarrollo).
```
Por:
```
- **Base de datos**: el esquema se aplica con la migración EF `InitialSchema`
  (`Backend/src/Portal.Infrastructure/Migrations/`), generada a partir de `PortalDbContext`.
  Los `.sql` en `Backend/db/sql-legacy/` (V001-V004) son solo referencia histórica — no se aplican.
  Pasos: `docker compose up -d postgres` (desde `Backend/`) y luego
  `dotnet ef database update -p src/Portal.Infrastructure -s src/Portal.Api`.
  Credenciales dev sembradas en la migración: `admin@portal.local` / `Admin123*` (⚠ solo desarrollo).
```

- [ ] **Step 2: Corregir la ruta del SDK (líneas ~87-89)**

Reemplazar:
```
- **Compilar**: el SDK .NET 10 (10.0.302) quedó en `C:\Users\Invitado\.dotnet` (no está en el PATH
  global). En una terminal nueva: `$env:PATH = "$env:USERPROFILE\.dotnet;$env:PATH"` y luego
  `dotnet build Portal.slnx` desde `Backend/`.
```
Por:
```
- **Compilar**: el SDK .NET 10 (10.0.301) está instalado en `C:\Program Files\dotnet` y sí está en el
  PATH global de esta máquina. `dotnet build Portal.slnx` funciona directo desde `Backend/`.
```

- [ ] **Step 3: Corregir la decisión de diseño de `busqueda_tsv` (línea ~41)**

Reemplazar:
```
- **`busqueda_tsv`**: se mantiene con trigger en Postgres (config `spanish` + `unaccent`), no desde C#.
```
Por:
```
- **`busqueda_tsv`**: columna generada y almacenada (`GENERATED ALWAYS AS (...) STORED`), configurada
  desde `InmuebleConfiguration.cs` con `HasComputedColumnSql(..., stored: true)`. No usa `unaccent()`
  (no es IMMUTABLE, Postgres la rechaza en columnas generadas); la config `spanish` ya hace stemming.
  Reemplaza el diseño original de `V003` basado en trigger.
```

- [ ] **Step 4: Añadir entrada de avance**

Al final de `## Registro de avance`, añadir:
```
- **2026-08-05** — ✅ FASE 0 (desbloqueo de base de datos): generada la migración EF `InitialSchema`
  a partir del modelo ya existente en `Portal.Infrastructure/Persistence`. Confirmado que EF genera
  automáticamente los 7 ENUM nativos, las 3 extensiones (`pg_trgm`, `unaccent`, `pgcrypto`) y los seeds
  de catálogo (`HasData` en tipos_inmueble/ubicaciones/categorías/características) — no fue necesario
  portar DDL de `sql-legacy` a mano. Único añadido manual: `INSERT` del usuario admin de desarrollo
  (`admin@portal.local`) vía `migrationBuilder.Sql` con `crypt()/gen_salt()`, porque `HasData` no puede
  expresar un hash calculado en inserción. `docker compose up -d postgres` + `dotnet ef database update`
  aplican el esquema limpio; `GET /api/catalogos/tipos-inmueble` confirmado respondiendo con las 7 filas
  semilla.
```

- [ ] **Step 5: Commit**

```bash
git add Task/BackEnd/06-memoria-desarrollo.md
git commit -m "docs: corregir memoria de desarrollo backend tras FASE 0"
```
