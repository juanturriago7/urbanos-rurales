# Portal Inmobiliario — Backend

API .NET 10 del portal inmobiliario de Bogotá D.C. (INM-WEB-001).
Arquitectura limpia, CQRS con MediatR y acceso a datos con Dapper sobre PostgreSQL.

## Arranque rápido

Requisitos: **Docker Desktop** y el **SDK de .NET 10**. Nada más — el script instala
`dotnet-ef` si hace falta.

```powershell
# desde Backend/
./scripts/dev-setup.ps1
dotnet run --project src/Portal.Api
```

El script deja el entorno listo de punta a punta: levanta el contenedor de
PostgreSQL, espera a que acepte conexiones, aplica las migraciones y crea el
usuario administrador de desarrollo. Es idempotente, se puede volver a ejecutar
sin romper nada.

Para reconstruir la base desde cero (borra el volumen y todos los datos locales):

```powershell
./scripts/dev-setup.ps1 -Recreate
```

Comprobación de que quedó arriba:

```powershell
curl http://localhost:5095/health   # -> Healthy
```

## Credenciales de desarrollo

> Solo para desarrollo local. Estas credenciales están en el repositorio a
> propósito y no deben existir en ningún entorno desplegado.

### Base de datos — pgAdmin, DBeaver o `psql`

| Campo      | Valor         |
| ---------- | ------------- |
| Host       | `localhost`   |
| Puerto     | **`5433`**    |
| Base       | `portal_db`   |
| Usuario    | `portal_user` |
| Contraseña | `portal_pass` |

**El puerto es el 5433, no el 5432.** Ver [Puerto 5433](#puerto-5433-y-no-5432).

En pgAdmin: clic derecho sobre *Servers* → *Register* → *Server…*; en la pestaña
*General* ponle un nombre (p. ej. `Portal Local`) y en *Connection* los valores de
la tabla. Marca *Save password* para no reescribirla cada vez.

Conexión directa sin cliente gráfico:

```powershell
docker exec -it portal_postgres psql -U portal_user -d portal_db
```

### Panel administrativo

| Campo      | Valor                |
| ---------- | -------------------- |
| Correo     | `admin@portal.local` |
| Contraseña | `Admin123*`          |

Lo crea `scripts/dev-setup.ps1`, **no** la migración: `InitialSchema` también se
aplica en producción y sembrarlo ahí dejaría una cuenta con contraseña conocida.

```powershell
curl -X POST http://localhost:5095/api/auth/login `
     -H "Content-Type: application/json" `
     -d '{"email":"admin@portal.local","password":"Admin123*"}'
```

### Configuración local

`appsettings.Development.json` está en `.gitignore` y no viaja en el repositorio.
Si no lo tienes, créalo en `src/Portal.Api/`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5433;Database=portal_db;Username=portal_user;Password=portal_pass"
  },
  "Jwt": {
    "Key": "dev-local-only-key-not-for-production-min-32-chars-1234567890"
  }
}
```

`appsettings.json` solo trae marcadores `CHANGE_ME`; los valores reales van en
`appsettings.Development.json`, `appsettings.Production.json` o variables de
entorno.

## Puertos

| Servicio            | URL                     |
| ------------------- | ----------------------- |
| API (perfil `http`) | `http://localhost:5095` |
| API (perfil `https`)| `https://localhost:7054`|
| PostgreSQL          | `localhost:5433`        |
| API en Docker       | `http://localhost:8080` |

## Migraciones

Son migraciones de **EF Core**, pero EF es una herramienta *de diseño*: en runtime
todo el acceso a datos es Dapper. `PortalDbContext` describe el esquema para
generar el DDL y **no está registrado en el contenedor de dependencias**.

Las migraciones **no se aplican solas al arrancar la API**: no hay ningún
`Migrate()`/`MigrateAsync()` en `Program.cs`, a propósito. Se aplican con el
script de arranque o a mano.

Desde la consola del administrador de paquetes de Visual Studio
(*Proyecto predeterminado*: `Portal.Infrastructure`, *Proyecto de inicio*: `Portal.Api`):

```powershell
Add-Migration NombreDeLaMigracion
Update-Database
```

O desde la terminal:

```powershell
dotnet ef migrations add NombreDeLaMigracion --project src/Portal.Infrastructure --startup-project src/Portal.Api
dotnet ef database update --project src/Portal.Infrastructure --startup-project src/Portal.Api
```

`PortalDbContextFactory` resuelve la cadena de conexión en este orden: variable de
entorno `ConnectionStrings__Default`, luego `PORTAL_DB_CONNECTION`, y por último
la de desarrollo del `docker-compose.yml`.

### Agregar una tabla

1. Entidad POCO en `Portal.Domain/Entities/`.
2. `IEntityTypeConfiguration<T>` en `Portal.Infrastructure/Persistence/Configurations/`.
3. `DbSet<T>` en `PortalDbContext`.
4. `Add-Migration` y `Update-Database`.

### ENUM nativos de PostgreSQL

El esquema usa tipos ENUM nativos (`rol_usuario`, `estado_inmueble`, `estado_lead`…).
Para que una columna se genere con el tipo nativo hacen falta **dos** registros:

1. `modelBuilder.HasPostgresEnum<T>()` en `PortalDbContext.OnModelCreating` — emite
   el `CREATE TYPE`.
2. `npgsql.MapEnum<T>("nombre_del_tipo")` en `PortalDbContextFactory` — asocia la
   propiedad al tipo.

**Si falta el segundo, EF no avisa**: cae al mapeo por defecto de un enum de CLR y
genera la columna como `integer`. Eso rompe el SQL de los repositorios Dapper
(`estado = 'publicado'`, `CAST(@Rol AS rol_usuario)`) y los índices filtrados por
etiqueta. Al agregar un enum nuevo, registra los dos y confirma en la migración
generada que la columna dice `type: "nombre_del_tipo"` y no `type: "integer"`.

### Producción

No apliques migraciones desde la aplicación. Genera un script idempotente,
revísalo y aplícalo como paso del despliegue, antes de rotar la versión de la API:

```powershell
dotnet ef migrations script --idempotent --project src/Portal.Infrastructure --startup-project src/Portal.Api -o deploy/migrations.sql
```

Así el usuario de runtime no necesita permisos de DDL de forma permanente y las
migraciones destructivas se revisan antes de correr.

## Comandos

```powershell
dotnet build Portal.slnx
dotnet run --project src/Portal.Api

docker compose up -d postgres    # solo la base
docker compose up -d             # base + API en contenedor (puerto 8080)
docker compose logs -f postgres
docker compose down              # detiene, conserva los datos
docker compose down -v           # detiene y BORRA el volumen
```

Todavía no hay proyectos de pruebas en la solución.

## Problemas conocidos

### Puerto 5433 (y no 5432)

El contenedor publica el **5433** del host. El 5432 suele estar ocupado por una
instalación nativa de PostgreSQL en Windows (servicio `postgresql-x64-NN`), y
dejarlo en 5432 provoca un fallo desconcertante: las herramientas se conectan al
PostgreSQL nativo en lugar del contenedor y devuelven

```
Npgsql.PostgresException 28P01: password authentication failed for user "portal_user"
```

aunque el contenedor esté sano. El rol `portal_user` no existe en ese otro
servidor. Editar `pg_hba.conf` dentro del contenedor no cambia nada, porque la
conexión ni siquiera llega ahí.

Para ver quién tiene el puerto:

```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen |
    ForEach-Object { Get-Process -Id $_.OwningProcess }
```

Dentro de la red de Docker la API sigue hablando con `postgres:5432`; el 5433 solo
aplica desde el host.

### `dotnet ef` no se reconoce

La herramienta se instala en `%USERPROFILE%\.dotnet\tools`, que puede no estar en
el `PATH` de la sesión. `scripts/dev-setup.ps1` la invoca por ruta completa. A
mano:

```powershell
dotnet tool install --global dotnet-ef
& "$env:USERPROFILE\.dotnet\tools\dotnet-ef.exe" --version
```

### El contenedor arranca pero la autenticación falla

`POSTGRES_USER` y `POSTGRES_PASSWORD` solo se aplican cuando el volumen se
inicializa por primera vez. Si el volumen viene de una configuración anterior,
esas variables se ignoran. Solución:

```powershell
./scripts/dev-setup.ps1 -Recreate
```

## Estructura

```
Portal.Api            → Application, Infrastructure   controladores, DI, JWT/CORS/Serilog
Portal.Infrastructure → Application                    repositorios Dapper, EF (migraciones)
Portal.Application    → Domain                         handlers MediatR, DTOs, validadores
Portal.Domain         → (nada)                         entidades POCO, enums
```

Las referencias apuntan siempre hacia adentro. Los detalles de convenciones están
en `CLAUDE.md` (raíz del repositorio) y el diseño funcional en `Task/BackEnd/`.

## Registro de la aplicación

Serilog escribe en consola y en `logs/portal-.log`, con rotación diaria.
