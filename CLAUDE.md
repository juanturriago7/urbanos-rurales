# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Real-estate listing portal for Bogotá D.C. ("Plataforma Web Inmobiliaria", project code INM-WEB-001). Two independent apps in one repo:

- **`Backend/`** — .NET 10 Web API (Clean Architecture, CQRS/MediatR, Dapper over PostgreSQL)
- **`FrontEndUrbanos/`** — React 19 + Vite + TypeScript admin panel and public site

`Task/BackEnd/*.md` and `Task/FrontEnd/*.md` are the source-of-truth planning docs (numbered files: full DB schema DDL in `Task/BackEnd/02-modelo-de-datos.md`, the public/admin API contract in `04-contrato-api-frontend.md`, and the feature backlog with requirement IDs RF-xxx / RNF-xxx in `03-backlog-backend.md`). Consult them before adding new endpoints, tables, or pages — most of the domain (inmuebles, operaciones, características, leads, ubicaciones jerárquicas) is designed there but not yet implemented in code; only the `roles`/`usuarios` slice currently exists.

## Backend (`Backend/`)

### Commands

```bash
# from Backend/
dotnet build Portal.slnx
dotnet run --project src/Portal.Api        # runs on the port in Properties/launchSettings.json
docker compose up -d                       # postgres (postgis/postgis:16) + api, see docker-compose.yml
```

There are no test projects in the solution yet.

**Migrations are EF Core migrations**, applied by hand from Visual Studio's Package Manager Console (Default project: `Portal.Infrastructure`, Startup project: `Portal.Api`):

```powershell
Add-Migration InitialSchema
Update-Database
```

Nothing migrates automatically: there is **no** `Migrate()`/`MigrateAsync()` call in `Program.cs`, and docker-compose no longer mounts anything into `docker-entrypoint-initdb.d`. Bring the postgres container up first, then run `Update-Database`. `PortalDbContextFactory` supplies the design-time connection string from `ConnectionStrings__Default` / `PORTAL_DB_CONNECTION`, falling back to the docker-compose dev credentials.

The original hand-written SQL migrations are kept for reference only in `Backend/db/sql-legacy/` — they are superseded by the EF model and must not be applied alongside it.

Secrets: `appsettings.json` ships placeholder `CHANGE_ME` values for `ConnectionStrings:Default` and `Jwt:Key`; real values belong in `appsettings.Development.json` / `appsettings.Production.json` (gitignored) or environment variables.

### Architecture

Strict Clean Architecture with four projects, referencing inward only:

```
Portal.Api            → Application, Infrastructure   (controllers, DI wiring, JWT/CORS/Serilog setup)
Portal.Infrastructure → Application                    (Dapper repositories, DbConnectionFactory, SQL migrations)
Portal.Application    → Domain                         (MediatR handlers, DTOs, validators, interfaces)
Portal.Domain         → (nothing)                      (POCO entities, enums, no external deps)
```

Key conventions, established by the `Roles` feature (`src/Portal.Application/Features/Roles/`) — follow this shape for every new feature:

- **CQRS via MediatR**: one folder per feature under `Features/<Name>/{Queries,Commands}/<Verb>/`, each with a `record` request + a `sealed class ...Handler : IRequestHandler<,>`. Controllers only translate HTTP → MediatR request → `Ok(result)`; no business logic in controllers.
- **Runtime data access is Dapper only.** EF Core is present but is a *design-time tool for migrations only*: `PortalDbContext` (`Persistence/PortalDbContext.cs`) describes the schema so EF can generate DDL, is deliberately **not registered in DI**, and no repository or handler may query through it. Adding a table means adding an entity + an `IEntityTypeConfiguration<T>` under `Persistence/Configurations/`, then `Add-Migration`. Repositories live in `Portal.Infrastructure/Repositories/`, implement interfaces from `Portal.Application/Interfaces/`, and are `internal sealed`. SQL uses explicit `AS PascalCase` aliases to map `snake_case` Postgres columns straight onto DTOs (see `RoleRepository`). Get connections via the injected `DbConnectionFactory` (singleton), one `using var conn = await _connectionFactory.OpenAsync(ct)` per repository call.
- **Domain entities** are POCOs with private setters, a private parameterless ctor for Dapper hydration, and a static `Create(...)` factory that validates invariants (see `Usuario.cs`). Business rules live on the entity, not in handlers. `BaseEntity` (`Id: Guid`, `CreatedAt`, `UpdatedAt`, `IsDeleted`) exists but does **not** fit the planned schema — the Task DDL uses `BIGSERIAL` PKs, `creado_en`, and `activo`, so entities built from it stand alone.
- **Validation**: FluentValidation validators are auto-discovered and run through `ValidationBehavior<,>`, a MediatR pipeline behavior — throws `FluentValidation.ValidationException`, which `ErrorHandlingMiddleware` turns into a 400 ProblemDetails response. Don't hand-roll validation in handlers.
- **Errors**: all exceptions are caught centrally in `ErrorHandlingMiddleware` (registered first in the pipeline) and mapped to RFC 7807 ProblemDetails (`ValidationException`→400, `UnauthorizedAccessException`→401, `KeyNotFoundException`→404, else 500). Don't add try/catch in controllers/handlers for these cases.
- **Write operations** return `Result` / `Result<T>` (`Portal.Application/Common/Result.cs`) instead of throwing, for expected failure paths.
- **Pagination**: list queries take a `PaginationParams(Page, PageSize)` (`.WithClamp()` enforces `MaxPageSize = 100`) and return `PagedResult<T>`.
- **Auth**: JWT bearer, roles are `Admin` / `Asesor` (`RolUsuario` enum ↔ native Postgres enum `rol_usuario` with lowercase labels; `UsuarioRepository` reads it via `rol::text` and writes it via `CAST(@Rol AS rol_usuario)`). Authorization policies defined in `Program.cs`: `AdminOnly`, `AsesorOrAdmin` — apply via `[Authorize(Policy = "...")]` on actions, `[Authorize]` alone at controller level. There is no login endpoint yet, only the JWT validation setup.
- **Logging**: Serilog, configured in `Program.cs` + `appsettings.json` (`Serilog` section), writes to console and `logs/portal-.log` (daily rolling).

## Frontend (`FrontEndUrbanos/`)

### Commands

```bash
# from FrontEndUrbanos/, package manager is pnpm (pnpm-lock.yaml / pnpm-workspace.yaml)
pnpm dev        # vite dev server on :5173, proxies /api -> http://localhost:8080
pnpm build      # tsc -b && vite build
pnpm lint       # eslint .
pnpm preview
```

No test runner is configured yet.

### Architecture

Feature-sliced structure under `src/`:

```
app/
  layouts/     PublicLayout, AdminLayout
  router/      createBrowserRouter tree in index.tsx; AuthGuard.tsx gates /admin/* routes
  providers/   AppProviders.tsx (React Query client, etc.)
features/
  public/<feature>/pages/     e.g. properties/pages/HomePage.tsx
  admin/<feature>/{api,hooks,pages}/   e.g. users/{api/rolesApi.ts, hooks/useRoles.ts, pages/RolesPage.tsx}
shared/
  components/ui/   Button, Spinner, etc.
  hooks/           useAuthStore.ts (Zustand)
  lib/             axios.ts, queryClient.ts
  types/           api.ts, auth.ts
```

- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- **Data fetching**: TanStack Query for server state. Each admin feature has its own `api/*.ts` (axios calls) and `hooks/use*.ts` (`useQuery`/`useMutation` wrappers) — see `features/admin/users/`. Never call `apiClient` directly from a page component; go through a hook.
- **HTTP client**: single axios instance in `shared/lib/axios.ts` (`apiClient`). It auto-injects the bearer token from `localStorage['access_token']` and has a response interceptor that transparently refreshes on 401 (queues concurrent requests during refresh, redirects to `/admin/login` if refresh fails). Don't create additional axios instances.
- **Auth state**: `useAuthStore` (Zustand + `persist`) holds `user`/`isAuthenticated` in localStorage (`portal-auth` key); raw tokens live directly in `localStorage['access_token']`/`['refresh_token']`, not in the Zustand store. Server data (roles, users, listings) belongs in React Query, not Zustand.
- **Forms**: React Hook Form + Zod resolvers (`@hookform/resolvers`) for admin forms.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no separate `tailwind.config.js` — v4 CSS-based config). Prettier auto-sorts Tailwind classes (`prettier-plugin-tailwindcss`).
- **Formatting**: Prettier — no semicolons, single quotes, trailing commas everywhere, 100-char width. Run through `pnpm lint`/editor integration, not a separate script.
- **Routing**: public routes and `/admin/login` are unguarded; everything under `/admin` (except `/admin/login`) is nested inside `<AuthGuard />`, which wraps `<AdminLayout />`.
- Env vars are read via `import.meta.env.VITE_*` (see `.env`, e.g. `VITE_API_BASE_URL`).

## Cross-cutting notes

- Spanish is the language of the domain model, code comments, DB columns, and planning docs — name new domain code (entities, columns, DTOs) in Spanish, matching the Task DDL (`inmuebles`, `caracteristicas`, `ubicaciones`, `leads`, `usuarios`). The only English holdout is the `roles` catalog table and its `Roles` feature slice; everything built from the Task docs goes in Spanish.
- Frontend and backend are built to develop in parallel against the API contract in `Task/BackEnd/04-contrato-api-frontend.md` (mirrored in `Task/FrontEnd/02-contrato-api-referencia.md`) — check it for expected request/response shapes before inventing new ones, and update both copies if an endpoint changes.
