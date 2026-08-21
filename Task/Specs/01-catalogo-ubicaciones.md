# Spec 01 — Catálogo de ubicaciones administrable

**Requerimiento original:** "Agregar municipios en ubicación: Chía, Cajicá,
Palmira, Valle, Meta, Puerto Gaitán, Santa Marta... la idea es dejarlo abierto."

**Depende de:** nada. **Migración propia:** ninguna.

## Objetivo

Hoy `ubicaciones` solo tiene sembrados 6 nodos "zona" de Bogotá (Norte,
Noroccidente, Occidente, Centro, Sur, Suroccidente) — cualquier ubicación nueva
requiere un `INSERT` manual en base de datos. El objetivo es dar de alta un panel
admin de CRUD sobre `ubicaciones` para que el equipo pueda agregar municipios/zonas/
barrios sin depender de un deploy, empezando por los que pidió el cliente (Chía,
Cajicá, Palmira, Meta/Puerto Gaitán, Santa Marta).

## Por qué no hace falta tocar el esquema

`ubicaciones` ya es una jerarquía autorreferenciada genérica
(`padre_id → ubicaciones.id`) sin ningún `CHECK` que ate el `tipo` de una fila al
`tipo` de su padre — el único contrato es `UNIQUE(tipo, slug, padre_id)`. El enum
`tipo_ubicacion` (`zona | localidad | upz | barrio`) fue pensado para Bogotá
(zona → localidad → UPZ → barrio) pero nada impide reutilizar esas mismas etiquetas
para otras jerarquías, saltándose niveles que no apliquen:

- `zona` → agrupador regional amplio (ej. "Cundinamarca", "Meta", "Costa Caribe")
- `localidad` → municipio (ej. "Chía", "Cajicá", "Puerto Gaitán", "Santa Marta")
- `upz` → se salta fuera de Bogotá (un barrio puede colgar directo de `localidad`)
- `barrio` → barrio o vereda

`InmuebleDetallePage.tsx` ya renderiza la cadena de ubicación de forma genérica
(`inmueble.ubicacion.map(u => u.nombre).join(' · ')`), sin asumir una cantidad fija
de niveles — así que esta reutilización no rompe nada existente en el frontend
público. **No se propone tocar `CREATE TYPE tipo_ubicacion`** — evita el riesgo/
complejidad de un `ALTER TYPE ... ADD VALUE` y no aporta nada que ya no se pueda
lograr con las 4 etiquetas actuales usadas con criterio.

## Backend

**Crear:**
- `Portal.Application/Interfaces/IUbicacionAdminRepository.cs` — interfaz de
  escritura, separada de `ICatalogoRepository` (que sigue siendo solo lectura y no
  se toca):
  ```csharp
  public interface IUbicacionAdminRepository
  {
      Task<long> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default);
      Task<bool> UpdateAsync(long id, string nombre, long? padreId, bool activo, CancellationToken ct = default);
      Task<bool> ExisteSlugHermanoAsync(string tipo, string slug, long? padreId, long? excluirId, CancellationToken ct = default);
      Task<bool> EsDescendienteAsync(long posiblePadreId, long deId, CancellationToken ct = default); // anti-ciclos
  }
  ```
- `Portal.Infrastructure/Repositories/UbicacionAdminRepository.cs` — implementación
  Dapper (`internal sealed`, mismo patrón que `RoleRepository`/`InmuebleRepository`).
- `Portal.Application/Features/Catalogos/Ubicaciones/Commands/CrearUbicacion/CrearUbicacionCommand.cs`
  (+ Handler + Validator): `{ Tipo, Nombre, PadreId? }`. Reutiliza (o extrae a un
  helper compartido si no existe ya uno) el generador de slug que usa
  `CrearInmuebleCommandHandler` para `inmuebles.slug`.
- `Portal.Application/Features/Catalogos/Ubicaciones/Commands/ActualizarUbicacion/ActualizarUbicacionCommand.cs`
  (+ Handler + Validator): `{ Id, Nombre, PadreId?, Activo }`.
- `Portal.Application/Features/Catalogos/DTOs/UbicacionDtos.cs` — mueve aquí
  `UbicacionPlanaDto`, `UbicacionBusquedaDto`, `UbicacionNodoDto` desde
  `CatalogoDtos.cs`, y **agrega `Activo`** a los tres (hoy ninguno lo expone; el
  árbol admin necesita distinguir nodos inactivos para poder reactivarlos).
- `Portal.Api/Controllers/AdminUbicacionesController.cs` — nuevo controlador,
  `[Authorize(Policy = "AdminOnly")]`, base `/api/admin/catalogos/ubicaciones`:
  - `POST /` → `CrearUbicacionCommand`
  - `PUT /{id}` → `ActualizarUbicacionCommand`
  - `DELETE /{id}` → soft-delete (`Activo = false`); **nunca** `DELETE` físico —
    `inmuebles.ubicacion_id` referencia esta tabla con `OnDelete(Restrict)`.

**Reglas de validación clave:**
- `Nombre` no vacío, máx. 120 (igual que la columna).
- `Tipo` ∈ `{zona, localidad, upz, barrio}`.
- Unicidad de hermano: mismo `(tipo, slug, padre_id)` ya existente y activo → 400.
- Anti-ciclo: al actualizar, `PadreId` no puede ser el propio `Id` ni un
  descendiente suyo (usa `EsDescendienteAsync`, recorre `padre_id` hacia arriba).
- Al desactivar un nodo con hijos activos, exigir confirmación explícita en el
  payload (`desactivarHijos: bool`) — si es `false` y tiene hijos activos, 400 con
  mensaje claro; si es `true`, desactiva en cascada (misma transacción).

## Frontend

**Crear:**
- `features/admin/catalogos/api/ubicacionesAdminApi.ts` — `crearUbicacion`,
  `actualizarUbicacion`, `desactivarUbicacion`, más `getUbicacionesAdmin` (reusa
  `GET /api/catalogos/ubicaciones` existente, pero como este es admin y necesita ver
  inactivos, verificar si hace falta una variante `?incluirInactivos=true` en el
  query público existente, o un nuevo endpoint `GET /api/admin/catalogos/ubicaciones`
  — decisión de implementación, cualquiera de las dos es válida).
- `features/admin/catalogos/hooks/useUbicacionesAdmin.ts` — `useMutation`/`useQuery`
  wrappers (patrón `useInmuebles.ts`), invalidando la query de catálogos públicos al
  mutar para que el formulario de inmueble vea los cambios sin recargar.
- `features/admin/catalogos/pages/UbicacionesAdminPage.tsx` — vista de árbol
  (indentado por nivel), botón "+ nueva zona" en la raíz, "+ agregar hijo" por nodo,
  editar nombre inline, desactivar/reactivar. **Página propia, no una tab dentro de
  un archivo compartido** (ver regla de conflictos en `00-overview.md`).
- `features/admin/catalogos/components/UbicacionTreeEditor.tsx` (opcional, si el
  árbol amerita extraerse de la página).

**Modificar (diffs aditivos, ver reglas en `00-overview.md`):**
- `app/router/index.tsx` — agregar `{ path: 'catalogos/ubicaciones', element: <UbicacionesAdminPage /> }`
  dentro del árbol `/admin`.
- Menú/sidebar del admin (localizar dónde vive la navegación de `AdminLayout` al
  implementar; no se verificó la ruta exacta del archivo en esta spec) — agregar el
  link "Ubicaciones".

El formulario público de inmueble (`InmuebleFormPage.tsx`) y el árbol de filtros
público **no requieren cambios** — ya leen `/api/catalogos/ubicaciones` en vivo vía
`useUbicaciones()`, así que cualquier nodo nuevo creado desde este panel aparece de
inmediato sin tocar ese código.

## Criterios de aceptación

- [ ] Un admin puede crear "Cundinamarca" (zona) → "Chía" (localidad) sin migración.
- [ ] Un admin puede crear "Meta" (zona) → "Puerto Gaitán" (localidad).
- [ ] Un admin puede crear "Valle del Cauca" (zona) → "Palmira" (localidad).
- [ ] Un admin puede crear "Santa Marta" (como zona o localidad, a su criterio).
- [ ] La ubicación nueva aparece de inmediato en el selector de `/admin/properties/nuevo`.
- [ ] Intentar mover un nodo dentro de su propio subárbol (ciclo) devuelve 400.
- [ ] Desactivar un nodo con hijos activos sin `desactivarHijos: true` devuelve 400.
- [ ] Ubicaciones desactivadas no aparecen en `/api/catalogos/ubicaciones` (público)
      pero los inmuebles que ya las referencian siguen funcionando (no se rompe la FK).

## Fuera de alcance

- Importación masiva (DIVIPOLA u otra fuente oficial).
- Geocodificación automática de nuevas ubicaciones.
- Fusión/renombrado masivo de ubicaciones existentes.
