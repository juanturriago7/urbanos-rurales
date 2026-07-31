# Stack tecnológico — Plataforma Web Inmobiliaria (INM-WEB-001)

Stack verificado contra los archivos `.csproj`, el `package.json` y el `docker-compose.yml` del repositorio.

## Backend — `Backend/` (.NET 10)

| Capa | Tecnología |
|---|---|
| Runtime / framework | .NET 10 (`net10.0`), ASP.NET Core Web API |
| Arquitectura | Clean Architecture: `Portal.Api` → `Portal.Application`/`Portal.Infrastructure` → `Portal.Domain` |
| Patrón app | CQRS con **MediatR 12.5** (un handler por comando/query) |
| Acceso a datos (runtime) | **Dapper 2.1.66** + **Npgsql 10** |
| Migraciones (solo diseño) | **EF Core 10** + `Npgsql.EntityFrameworkCore.PostgreSQL` — `PortalDbContext` no está registrado en DI, solo genera DDL |
| Base de datos | **PostgreSQL 16** con **PostGIS 3.4** (`postgis/postgis:16-3.4`) + `pg_stat_statements` |
| Validación | **FluentValidation 11.12** vía `ValidationBehavior<,>` (pipeline de MediatR) |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer` 10.0) + `System.IdentityModel.Tokens.Jwt`; passwords con **BCrypt.Net-Next** |
| Logging | **Serilog** (consola + archivo rotativo diario en `logs/`) |
| API docs | `Microsoft.AspNetCore.OpenApi` 10.0.9 |
| Infra local | Docker Compose (postgres + api en :8080) |

## Frontend — `FrontEndUrbanos/`

| Área | Tecnología |
|---|---|
| UI | **React 19.2** + **TypeScript 6.0** |
| Build | **Vite 8** (`@vitejs/plugin-react`), dev server :5173 con proxy `/api` → :8080 |
| Routing | **React Router DOM 7.18** (`createBrowserRouter`, `AuthGuard` para `/admin/*`) |
| Estado servidor | **TanStack Query 5.101** |
| Estado cliente | **Zustand 5** (con `persist` para auth) |
| HTTP | **Axios 1.18** — instancia única con refresh automático en 401 |
| Formularios | **React Hook Form 7.82** + **Zod 4** (`@hookform/resolvers`) |
| Estilos | **Tailwind CSS v4** vía `@tailwindcss/vite` (sin `tailwind.config.js`) |
| Calidad | ESLint 10 + `typescript-eslint` 8, Prettier 3 con `prettier-plugin-tailwindcss` |
| Gestor de paquetes | **pnpm** |

## Puntos a tener en cuenta

- **No hay tests** en ninguno de los dos lados: la solución no tiene proyectos de test y el frontend no tiene runner configurado.
- El idioma del dominio es **español** (entidades, columnas, DTOs); la única excepción es el slice `Roles` / tabla `roles`.
- Nada migra al arrancar: `Update-Database` se corre a mano desde la consola del administrador de paquetes, con el contenedor de Postgres ya levantado.
