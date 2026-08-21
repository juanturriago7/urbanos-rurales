# Spec 02 — Catálogo de tipos de inmueble y características administrable

**Requerimientos originales cubiertos:**
- "En tipo de inmueble agregar edificio."
- "En características, que se puedan ir generando con el tiempo... que cuando se
  vaya a crear el inmueble aparezca la nueva. Por ejemplo en la costa tiene zona de
  vacas, restaurante interno."
- "Como características obligatorias: agregar zona infantil, playa."

**Depende de:** nada. **Migración propia:** sí, sobre `tipos_inmueble` (agrega una
columna + siembra "Edificio"). Es la única migración de este lote de specs que la
spec 03 necesita para poder arrancar — mergéala primero.

## Objetivo

Dar de alta CRUD admin para `tipos_inmueble` y para
`categorias_caracteristica`/`caracteristicas`, para que el catálogo crezca sin
deploy (tal como ya preveía `Task/BackEnd/03-backlog-backend.md`, ítems RF-100 a
RF-102, nunca implementados). De paso, agrega a `tipos_inmueble` el flag
`es_propiedad_horizontal` que la spec 03 necesita para decidir si un tipo de
inmueble tiene "área de terreno" propia o no.

## Por qué el flag de propiedad horizontal vive en el catálogo y no hardcodeado

El cliente listó apartamento/oficina/local como ejemplos de "propiedad horizontal"
al pedir el cambio de ficha técnica (spec 03), pero también pidió que el catálogo de
tipos quede abierto (este mismo mensaje, ítem "agregar edificio"). Si la regla
PH/no-PH se hardcodea por slug en el código (`if (tipo === 'apartamento' || ...)`),
cualquier tipo nuevo agregado después por el propio catálogo administrable queda sin
clasificar. Por eso `es_propiedad_horizontal` es una columna de `tipos_inmueble`,
editable desde el mismo panel admin que crea el tipo — dato, no código.

## Modelo de datos

**Migración `AgregarFlagPropiedadHorizontalYEdificio`** (nombre sugerido; ajustar al
gusto siempre que quede claro):

```sql
ALTER TABLE tipos_inmueble
    ADD COLUMN es_propiedad_horizontal BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE tipos_inmueble
    SET es_propiedad_horizontal = FALSE
    WHERE slug IN ('casa', 'lote', 'bodega');
-- apartamento, apartaestudio, local, oficina quedan en TRUE (el default).

INSERT INTO tipos_inmueble (nombre, slug, activo, orden, es_propiedad_horizontal)
    VALUES ('Edificio', 'edificio', true, 8, false);
-- Un edificio completo en venta/arriendo no es una unidad de propiedad horizontal
-- en sí mismo — es el predio completo. Ajustable después desde el panel admin.
```

En EF esto es `migrationBuilder.AddColumn<bool>(...)` +
`migrationBuilder.UpdateData(...)` (2 filas, por `slug` o `id`) +
`migrationBuilder.InsertData(...)` (1 fila). Actualizar también
`tipos_inmueble.HasData(...)` en `PortalDbContext.OnModelCreating` (o donde viva el
seed EF-side) para que el modelo y el snapshot no diverjan del estado real de la
tabla tras esta migración.

**Sobre "zona infantil" y "playa" — verificar antes de sembrar duplicados.** El seed
actual (`categorias_caracteristica` id 2 "Zonas comunes") ya incluye `id 13,
"Parque infantil"`. Antes de insertar "Zona infantil" como fila nueva, confirma si
es lo mismo (en cuyo caso solo renómbrala vía el panel nuevo, no dupliques) o si el
cliente distingue un parque infantil exterior de una zona infantil techada/interior
(en cuyo caso sí son dos características distintas). "Playa" y "Restaurante interno"
y "Zona de vacas" no existen hoy bajo ningún nombre — van en una migración de datos
separada (`SembrarCaracteristicasCosta` o similar) o, más simple, se crean la
primera vez a mano desde el panel una vez esté desplegado (no necesitan romper la
regla de "no seed de negocio en migraciones", porque no son secretos ni datos de
desarrollo — son catálogo, igual que el resto de `caracteristicas.HasData`). Si se
siembran por migración, agrupar bajo la categoría "Zonas comunes" (id 2) salvo que
se cree una categoría nueva "Rural / Costa" — decisión de quien implemente.

## Backend

**Crear:**
- `Portal.Application/Interfaces/ITipoInmuebleAdminRepository.cs` +
  `Portal.Infrastructure/Repositories/TipoInmuebleAdminRepository.cs` —
  `CreateAsync`, `UpdateAsync(id, nombre, activo, orden, esPropiedadHorizontal)`.
- `Portal.Application/Interfaces/ICaracteristicaAdminRepository.cs` +
  `Portal.Infrastructure/Repositories/CaracteristicaAdminRepository.cs` —
  CRUD de `caracteristicas` y `categorias_caracteristica` (crear categoría, crear
  característica bajo una categoría, actualizar, desactivar). Ninguno de los dos
  toca `CatalogoRepository.cs` (solo lectura, sin cambios).
- `Portal.Application/Features/Catalogos/TiposInmueble/Commands/{CrearTipoInmueble,ActualizarTipoInmueble}/*`
- `Portal.Application/Features/Catalogos/Caracteristicas/Commands/{CrearCaracteristica,ActualizarCaracteristica}/*`
- `Portal.Application/Features/Catalogos/CategoriasCaracteristica/Commands/CrearCategoriaCaracteristica/*`
- `Portal.Application/Features/Catalogos/DTOs/TiposInmuebleDtos.cs` — mueve
  `TipoInmuebleDto` desde `CatalogoDtos.cs` y **agrega `EsPropiedadHorizontal`**.
- `Portal.Application/Features/Catalogos/DTOs/CaracteristicasDtos.cs` — mueve
  `CaracteristicaDto`, `CaracteristicaPlanaDto`, `CategoriaCaracteristicasDto`.
  (Ver nota de coordinación con la spec 01 sobre `CatalogoDtos.cs` en
  `00-overview.md`.)
- `Portal.Api/Controllers/AdminTiposInmuebleController.cs` —
  `[Authorize(Policy = "AdminOnly")]`, base `/api/admin/catalogos/tipos-inmueble`:
  `POST /`, `PUT /{id}` (incluye `esPropiedadHorizontal` en el body).
- `Portal.Api/Controllers/AdminCaracteristicasController.cs` — mismo policy, base
  `/api/admin/catalogos/caracteristicas`: `POST /`, `PUT /{id}`,
  `POST /categorias`, `PUT /categorias/{id}`.

**Modificar:**
- `Portal.Domain/Entities/TipoInmueble.cs` — agregar propiedad
  `EsPropiedadHorizontal` (bool) y actualizar la factoría `Create(...)`.
- `Backend/src/Portal.Infrastructure/Persistence/Configurations/TipoInmuebleConfiguration.cs`
  — mapear la nueva columna.

## Frontend

**Crear:**
- `features/admin/catalogos/api/tiposInmuebleAdminApi.ts`,
  `features/admin/catalogos/api/caracteristicasAdminApi.ts`
- `features/admin/catalogos/hooks/useTiposInmuebleAdmin.ts`,
  `features/admin/catalogos/hooks/useCaracteristicasAdmin.ts` — invalidan
  `useTiposInmueble()`/`useCaracteristicas()` (los hooks de lectura ya existentes en
  `features/admin/catalogos/hooks/useCatalogos.ts`) al mutar.
- `features/admin/catalogos/pages/TiposInmuebleAdminPage.tsx` — lista + formulario
  crear/editar con el checkbox "¿Es propiedad horizontal?" y su ayuda contextual
  ("un apartamento, oficina o local suele ser PH; una casa, lote o edificio completo
  normalmente no.").
- `features/admin/catalogos/pages/CaracteristicasAdminPage.tsx` — lista agrupada por
  categoría, botón "+ nueva categoría", botón "+ nueva característica" (con
  `nombre`, `icono` opcional, `tipoValor` ∈ `booleano|numero|texto`, `filtrable`).

**Modificar:**
- `features/admin/catalogos/hooks/useCatalogos.ts` / el tipo `TipoInmuebleDto` del
  frontend (en `catalogosApi.ts`) — agregar el campo `esPropiedadHorizontal`
  devuelto por el backend, para que la spec 03 lo consuma en el formulario de
  inmueble.
- `app/router/index.tsx` — agregar `catalogos/tipos-inmueble` y
  `catalogos/caracteristicas` bajo `/admin` (páginas propias, no tabs — ver regla de
  conflictos en `00-overview.md`).

## Criterios de aceptación

- [ ] Tras la migración, "Edificio" aparece en el selector de tipo de inmueble en
      `/admin/properties/nuevo` sin tocar la UI.
- [ ] Un admin puede crear un tipo nuevo (ej. "Finca") y marcarlo como no-PH; el
      tipo aparece de inmediato en el formulario de inmueble y en el filtro público.
- [ ] Un admin puede crear una categoría nueva y una característica dentro de ella;
      aparece de inmediato como checkbox en la sección "Características" del
      formulario de inmueble (`useCaracteristicas()` ya es reactivo a la API, no
      requiere cambios en `InmuebleFormPage.tsx` para esto).
- [ ] `es_propiedad_horizontal` de los 7 tipos existentes quedó como se especificó
      arriba tras la migración (verificar con una consulta manual post-deploy).

## Fuera de alcance

- Reordenar el `orden` de tipos/características vía drag-and-drop (un input numérico
  simple es suficiente para v1).
- Traducción/i18n del catálogo.
- Editor de íconos (el campo `icono` sigue siendo texto libre — nombre de ícono a
  resolver por convención del frontend, igual que hoy).
