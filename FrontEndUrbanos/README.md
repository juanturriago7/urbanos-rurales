# Portal Inmobiliario — Frontend

Sitio público y panel administrativo del portal inmobiliario de Bogotá D.C.
(INM-WEB-001). React 19 + Vite + TypeScript, con TanStack Query para estado de
servidor y Tailwind CSS v4.

## Arranque rápido

Requisitos: **Node.js 22+** y **pnpm**. El repositorio trae `pnpm-lock.yaml`, así
que no uses `npm install` (generaría un lockfile distinto).

```powershell
# desde FrontEndUrbanos/
Copy-Item .env.example .env
pnpm install
pnpm dev
```

Queda en **http://localhost:5173**.

El backend debe estar corriendo aparte; mira `Backend/README.md`:

```powershell
# desde Backend/
./scripts/dev-setup.ps1
dotnet run --project src/Portal.Api
```

### Si no tienes pnpm

```powershell
npm install -g pnpm
```

`corepack enable pnpm` es la vía oficial, pero en Windows escribe en
`C:\Program Files\nodejs` y falla con `EPERM` salvo que abras la terminal como
administrador.

## Variables de entorno

`.env` está en `.gitignore`; el que se versiona es `.env.example`. Cópialo tal
cual y ajusta si hace falta.

| Variable            | Valor por defecto       | Para qué sirve                       |
| ------------------- | ----------------------- | ------------------------------------ |
| `VITE_API_BASE_URL` | `http://localhost:5095` | URL base de la API                   |
| `VITE_APP_NAME`     | `Portal Inmobiliario`   | Nombre visible de la aplicación      |

**`VITE_API_BASE_URL` debe coincidir con el perfil con el que corres el backend:**

| Cómo levantas el backend             | Valor                   |
| ------------------------------------ | ----------------------- |
| `dotnet run --project src/Portal.Api`| `http://localhost:5095` |
| `docker compose up -d`               | `http://localhost:8080` |

Las peticiones salen **directas** a la API, no por el proxy de Vite: el backend
ya autoriza el origen `http://localhost:5173` en `Cors:AllowedOrigins`. Si dejas
la variable vacía, las peticiones salen relativas y las atiende el proxy `/api`
de `vite.config.ts`.

> Al agregar una variable nueva, decláala también en `src/vite-env.d.ts` para
> tener autocompletado y verificación de tipos.

## Comandos

```powershell
pnpm dev        # servidor de desarrollo en :5173
pnpm build      # tsc -b && vite build
pnpm lint       # eslint .
pnpm preview    # sirve el build de producción
```

Todavía no hay runner de pruebas configurado.

## Estructura

```
src/
  app/
    layouts/     PublicLayout, AdminLayout
    router/      árbol de rutas en index.tsx; AuthGuard.tsx protege /admin/*
    providers/   AppProviders.tsx (cliente de React Query, etc.)
  features/
    public/<feature>/pages/
    admin/<feature>/{api,hooks,pages}/
  shared/
    components/ui/   Button, Spinner, …
    hooks/           useAuthStore.ts (Zustand)
    lib/             axios.ts, queryClient.ts
    types/           api.ts, auth.ts
```

- Alias `@/*` → `src/*` (declarado en `vite.config.ts` y `tsconfig.app.json`).
- Cada feature del admin tiene su `api/*.ts` (llamadas axios) y sus `hooks/use*.ts`
  (envoltorios de `useQuery`/`useMutation`). **Nunca llames `apiClient` desde una
  página**: pasa siempre por un hook.
- Una sola instancia de axios, en `shared/lib/axios.ts`. Inyecta el bearer token
  y refresca en 401 de forma transparente. No crees instancias adicionales.
- Los datos de servidor viven en React Query, no en Zustand.

Las convenciones completas están en `CLAUDE.md` (raíz) y el contrato de la API en
`Task/FrontEnd/02-contrato-api-referencia.md`.

## Estado actual

### Funcionando

- **Login real** contra `POST /api/auth/login`, con JWT y refresh automático.
  Entra con `admin@portal.local` / `Admin123*`.
- **Listado de inmuebles** (`/admin/properties`) con filtro por estado, búsqueda
  y paginación.
- **Alta de inmuebles** (`/admin/properties/nuevo`): ficha técnica, ubicación,
  operaciones de venta y arriendo, y características por categoría.
- **Acciones del listado**: publicar, pausar, destacar y eliminar.

### Pendiente

- **Editar** un inmueble existente. El backend ya expone
  `GET /api/admin/inmuebles/{id}` y `PUT /api/admin/inmuebles/{id}`; falta la
  pantalla, que puede reutilizar el formulario de alta.
- **Galería de imágenes** (RF-090 a RF-094). Es lo que hoy bloquea publicar: el
  backend aplica RF-077 y rechaza el cambio a `publicado` mientras el inmueble no
  tenga al menos una imagen. El botón muestra el motivo devuelto por la API.
- `/admin/leads` y `/admin/media` siguen siendo placeholders en el router.
- **Gestión de usuarios.** No hay CRUD de usuarios en el backend; `RolesController`
  solo tiene `GET`. Los roles (`Admin`, `Asesor`) son un enum de C#, no datos
  editables: no hay permisos que configurar desde la interfaz.

El backlog completo está en `Task/FrontEnd/03-backlog-frontend.md`.
