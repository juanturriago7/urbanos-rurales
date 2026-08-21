# Spec 04 — Listado público: filtro por característica + quitar botón de favoritos

**Requerimientos originales cubiertos:**
- "En el menú de las publicaciones, filtrar también por característica." (ver nota
  de interpretación de "publicaciones" en `00-overview.md` — aquí es el listado
  público de inmuebles, `/inmuebles`.)
- "En los inmuebles hay un corazón, quitarlo."

**Depende de:** nada (el catálogo de características ya es legible públicamente hoy
vía `/api/catalogos/caracteristicas` — no requiere que la spec 02 esté hecha).
**Migración propia:** ninguna.

## Objetivo

`Task/FrontEnd/01-atributos-filtros-ui.md` ya documentaba esta necesidad ("el
componente de filtros debe leer la lista de características filtrables desde
`/api/catalogos/caracteristicas` y renderizar checkboxes automáticamente") pero
nunca se implementó — `InmueblesListPage.tsx` hoy solo filtra por tipo, ubicación,
área mínima y estrato. Esta spec cierra ese vacío, y de paso elimina el botón de
"guardar en favoritos" (ícono de corazón) que hoy no hace nada — no tiene `onClick`,
no persiste estado, es puramente decorativo (confirmado: no aparece en ningún otro
lugar del sitio — ni en la ficha de detalle ni en el home).

## Backend

**Modificar:**
- `Portal.Application/Features/Inmuebles/DTOs/InmueblePublicoDtos.cs` —
  `InmueblesFiltro` gana un campo `IReadOnlyList<int>? CaracteristicaIds`.
- `Portal.Application/Features/Inmuebles/Queries/BuscarInmuebles/BuscarInmueblesQuery.cs` /
  `BuscarInmueblesQueryValidator` — sin reglas nuevas de validación más allá de que
  cada id sea positivo (opcional, no crítico).
- `Portal.Application/Interfaces/IInmueblePublicoRepository.cs` /
  `Portal.Infrastructure/Repositories/` (repositorio público) — el método
  `BuscarAsync` agrega, cuando `CaracteristicaIds` no es nulo/vacío, una condición
  tipo:
  ```sql
  AND NOT EXISTS (
      SELECT 1 FROM unnest(@CaracteristicaIds) AS req(id)
      WHERE NOT EXISTS (
          SELECT 1 FROM inmueble_caracteristicas ic
          WHERE ic.inmueble_id = i.id AND ic.caracteristica_id = req.id
      )
  )
  ```
  (semántica AND: el inmueble debe tener *todas* las características seleccionadas,
  coherente con "combinación de filtros AND" de RF-021). Si el volumen de datos lo
  justifica, un `GROUP BY ... HAVING COUNT(DISTINCT caracteristica_id) = @Cantidad`
  sobre un `JOIN` es una alternativa equivalente y puede resultar más simple de leer
  — cualquiera de las dos es aceptable.
- `Portal.Api/Controllers/InmueblesController.cs` — el binding del query string para
  `caracteristicaIds` (ej. `?caracteristicaIds=9,10,13`, valores separados por
  coma). **Antes de elegir el formato exacto, revisar cómo el controlador ya
  bindea el resto de parámetros del filtro** (query string plano vs. algún binder
  custom) para mantener el mismo estilo — no se verificó ese detalle al escribir
  esta spec.

## Frontend

**Modificar `features/public/properties/pages/InmueblesListPage.tsx`:**
- Nuevo bloque de filtros por característica dentro del panel de filtros existente,
  alimentado por `useCaracteristicas()` (hook de lectura ya existente en
  `features/admin/catalogos/hooks/useCatalogos.ts` — si ese hook vive bajo `admin/`,
  moverlo a `shared/` o crear un equivalente público simple; no debería requerir
  sesión, ya que `/api/catalogos/caracteristicas` es `[AllowAnonymous]`).
  Renderizado **genérico por categoría** (checkboxes agrupados bajo el nombre de
  cada `categoriaNombre`), sin ninguna lista hardcodeada — igual al mandato de
  `Task/FrontEnd/01-atributos-filtros-ui.md`. Solo se muestran características con
  `filtrable: true`.
- Sincronizar la selección con `searchParams` (ej. `?caracteristicas=9,10`),
  siguiendo el mismo patrón que ya usa `setFiltro(key, val)` en este archivo para
  `tipo`/`area_min`/`estrato`.
- **Quitar** el botón de favoritos completo: el `<button aria-label="Guardar en
  favoritos">` con el ícono `Heart`, su import de `lucide-react`, y el `alt`/estilo
  asociado en `TarjetaInmueble`. Es una eliminación pura, sin reemplazo.

**Modificar `features/public/properties/api/inmueblesPublicApi.ts`:**
- `FiltroInmueblesPublico` (tipo TS) gana `caracteristicaIds?: number[]`.

## Criterios de aceptación

- [ ] Marcar una característica en el panel de filtros reduce el listado a
      inmuebles que la tienen (verificar con al menos 2 características marcadas a
      la vez → intersección, no unión).
- [ ] El panel de filtros no tiene ninguna característica hardcodeada en el código
      — agregar una característica nueva desde el catálogo (spec 02) la hace
      aparecer sin tocar `InmueblesListPage.tsx`.
- [ ] La URL refleja el filtro seleccionado (compartir el link reproduce el mismo
      resultado).
- [ ] El botón de corazón ya no existe en ninguna tarjeta de inmueble del listado
      (`InmueblesListPage.tsx`); `pnpm build`/`pnpm lint` no reportan el import de
      `Heart` como no usado (debe quedar completamente eliminado, no comentado).

## Preguntas abiertas

- Quitar el corazón se interpreta como remoción total de la idea de "favoritos" en
  el sitio público, no como "moverlo a la ficha de detalle" ni "dejarlo pero
  funcional" — confirmar con el cliente si en algún momento quieren una lista de
  favoritos real (típicamente vía `localStorage` sin necesidad de cuenta de
  usuario); no está en el alcance de este lote.

## Fuera de alcance

- Filtro por rango numérico de características tipo "numero" (ej. closets) — solo
  se filtra por presencia/ausencia de características tipo "booleano", que es lo
  que ya soporta `inmueble_caracteristicas` de forma directa.
- Persistencia de favoritos.
