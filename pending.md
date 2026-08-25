# Pendientes

Estado al **2026-08-25**, tras mergear `feature/edicion-inmuebles` a `develop` (`c0ab74a`).

Ordenados por lo que más duele. Los tres primeros bloquean o rompen algo; el
resto es pulido con dueño claro.

---

## 1. `dotnet ef database update` no funciona — bloquea montar el entorno

**Prioridad: alta.** Cualquiera que clone el repo se estrella con esto.

```
System.InvalidOperationException: An error was generated for warning
'Microsoft.EntityFrameworkCore.Migrations.PendingModelChangesWarning':
The model for context 'PortalDbContext' has pending changes.
Add a new migration before updating the database.
```

El modelo de `PortalDbContext` tiene cambios que **ninguna migración captura**, así
que EF se niega a migrar. Consecuencia real, verificada el 2026-08-25: una base
local quedó con solo 2 de las 6 migraciones del repo, y `GET /api/admin/inmuebles/{id}`
devolvía **500** con `column i.area_terreno_m2 does not exist`.

**Arreglo:** generar la migración que falta (`Add-Migration`), revisando que el diff
sea el esperado y no arrastre basura.

**Rodeo mientras tanto** (lo usé para poder verificar):

```powershell
dotnet ef migrations script --idempotent `
  --project src/Portal.Infrastructure --startup-project src/Portal.Api -o migraciones.sql
docker cp migraciones.sql portal_postgres:/tmp/migraciones.sql
docker exec portal_postgres psql -U portal_user -d portal_db -f /tmp/migraciones.sql
```

`migrations script` no corre la validación, por eso sí funciona. Ojo: al aplicarlo con
`psql -f`, las migraciones de **blog** y **postulaciones** fallan por cómo psql parsea
los bloques `DO $$`; las otras cuatro entran bien.

---

## 2. `pnpm lint` falla en `develop`

**Prioridad: alta** — está roto en la rama principal, así que el lint no sirve como
señal para nadie.

`FrontEndUrbanos/src/features/admin/blog/pages/BlogAdminFormPage.tsx:38`
→ `react-hooks/set-state-in-effect`

```
setImagenPortadaUrl(articuloExistente.imagenPortadaUrl ?? '')
```

Viene de la spec 06. El patrón correcto suele ser derivar el estado en el render o
usar `key` para remontar, en vez de sincronizarlo en un efecto.

---

## 3. `dev-setup.ps1` falla en un clone limpio

**Prioridad: media.**

- Le falta `dotnet restore` antes de las migraciones.
- Su **línea 123** levanta solo `postgres`:
  ```powershell
  Invoke-Externo { docker compose up -d postgres } '...'
  ```
  Debería ser `postgres minio minio-init`. Sin minio **la subida de imágenes no
  funciona** — hay que levantarlo a mano.

Este script además arrastra el problema del punto 1: aunque se arregle, sus
migraciones seguirán fallando hasta que exista la migración que falta.

---

## 4. Pulido de la pantalla de edición

Todos salieron de las revisiones de `feature/edicion-inmuebles` y se difirieron a
propósito: ninguno afecta correctitud.

| Qué | Dónde | Por qué importa |
|---|---|---|
| No hay feedback de éxito al guardar | `InmuebleEditarPage.tsx` | El usuario no ve nada al guardar y es probable que haga clic dos veces. **El más visible de los cuatro.** |
| Falta encabezado y botón "Cancelar" | `InmuebleEditarPage.tsx` | Asimétrico con la página de alta, que sí los tiene. No se ve qué inmueble se está editando. |
| `isError` colapsa todo fallo en "Inmueble no encontrado" | `InmuebleEditarPage.tsx` | Un 500 o una sesión vencida dicen que el registro no existe. Sin opción de reintentar. |
| El enlace "Editar" ignora `deshabilitado` | `InmueblesPage.tsx` | Cosmético: los botones hermanos sí se deshabilitan durante una mutación. |

---

## 5. Deuda técnica anotada, sin urgencia

- **`aDatosInput` no obliga por tipo a pasar `previo`.** `metaTitulo`,
  `metaDescripcion` y `asesorId` son opcionales en `InmuebleDatosInput`, así que
  nada impide que un futuro llamador edite sin preservarlos y repita el bug de
  borrado silencioso. Hoy lo cubren un test y un docblock, no el compilador.
  Separar los tipos de crear y actualizar lo cerraría, a costa de romper el espejo
  deliberado con `InmuebleDatosCommandBase` del backend.
- **`youtubeUrl` / `mapaEmbedUrl`** usan `z.string().trim().optional()` en vez de
  `textoOpcional`, así que al limpiar el campo persisten `''` en vez de `null`.
  Inofensivo hoy; la pantalla de edición es el primer sitio donde se puede notar.
- **`vite.config.ts`**: `include: ['src/**/*.test.ts']` excluiría cualquier
  `.test.tsx` futuro, y `globals: true` está de más porque todos los tests importan
  explícitamente de `'vitest'`.
- **`pnpm-workspace.yaml`** tiene `allowBuilds: esbuild: false`, necesario para que
  `pnpm` no se trabe en un gate de build scripts. Merece un comentario que explique
  por qué está, para que nadie lo borre.

---

## Resueltos en la sesión del 2026-08-24/25

- ✅ **Pantalla de edición de inmuebles** — `/admin/properties/:id/editar`, con campos,
  operaciones y fotos sobre un inmueble existente.
- ✅ **Bug de Zod 4** — `z.union([... z.undefined()])` ya no marca la clave como
  opcional en Zod 4, así que no se podía crear un inmueble con una sola operación.
  Arreglado con `.optional()`; verificado en vivo creando uno solo con arriendo.
- ✅ **El `PUT` borraba columnas en silencio** — el endpoint es *full replace* y el
  payload omitía `metaTitulo`, `metaDescripcion`, `asesorId` y el `valor` de las
  características, así que **cada guardado en edición los borraba**. No estaba en
  ningún pendiente: lo encontró la revisión de rama completa. Verificado en vivo en
  ambas direcciones.
- ✅ **Iconos rotos del sitio público** — ya estaban arreglados de antes; 0 referencias
  a `figma.com/api/mcp/asset` en el código.
- ✅ **Vitest montado** — entorno node, sin DOM ni Testing Library. 29 tests sobre
  schema, mapeadores y funciones de API. Disponible para todo el proyecto.

---

## Nota sobre los worktrees

**No usar `git worktree` en este repo.** Falla de verdad, por el límite `MAX_PATH`
(260) de Windows: la raíz de un worktree son ~134 caracteres y el archivo más largo
del repo son 138 → 272. El error es
`Filename too long` / `fatal: Could not reset index file to revision 'HEAD'`.

Los archivos que lo revientan llegaron con la spec 02
(`Features/Catalogos/Caracteristicas/Commands/ActualizarCategoria/...`), por eso la
spec 01 sí se pudo hacer en worktree en su momento y ya no.

Trabajar con ramas normales sobre el checkout actual: la ruta base es 59 caracteres
más corta y no hay problema.
