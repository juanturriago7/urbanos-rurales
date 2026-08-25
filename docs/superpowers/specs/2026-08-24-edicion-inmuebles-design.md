# Diseño — Pantalla de edición de inmuebles

**Fecha:** 2026-08-24
**Rama:** `feature/edicion-inmuebles`
**Origen:** pendiente #3 de la bitácora de `develop` (no es una spec del lote `Task/Specs/`).

## Problema

El router admin solo tiene `properties` y `properties/nuevo`. No existe ruta de
edición, así que un inmueble ya creado no se puede modificar desde la web. El
síntoma más visible: `GaleriaImagenes` solo se monta después de crear, de modo
que a un inmueble existente no se le pueden agregar ni cambiar fotos.

## Estado actual verificado (2026-08-24)

**Backend: completo, no requiere cambios.** `AdminInmueblesController`
(`api/admin/inmuebles`) ya expone:

| Endpoint | Línea | Uso en este diseño |
|---|---|---|
| `GET /{id:long}` | 47 | Cargar valores iniciales del formulario |
| `PUT /{id:long}` | 69 | Guardar campos del inmueble |
| `PUT /{id:long}/operaciones` | 116 | Guardar operaciones (venta/arriendo + precios) |

**Frontend: faltan las cuatro piezas.**

- `api/inmueblesApi.ts` tiene `getInmueblesAdmin`, `crearInmueble`,
  `cambiarEstadoInmueble`, `marcarDestacado`, `eliminarInmueble` — pero **no**
  `getInmuebleAdmin(id)` ni ninguna función de actualización.
- `hooks/useInmuebles.ts` no tiene hook de detalle ni de actualización.
- `app/router/index.tsx` no tiene la ruta de edición.
- `pages/InmueblesPage.tsx` ofrece publicar/pausar/destacar/eliminar, pero
  ninguna acción "Editar".
- `components/GaleriaImagenes.tsx` recibe **solo** `inmuebleId: number`, así que
  ya es reutilizable tal cual — no se toca.

**Precedente en el repo:** `BlogAdminFormPage` sirve `blog/nuevo` y
`blog/:id/editar` con el mismo componente vía `isEdit = Boolean(params.id)`.
Este diseño se aparta de ese patrón por una razón concreta, explicada abajo.

## Alcance

Dentro:

- Edición de todos los campos del inmueble.
- Edición de operaciones (venta/arriendo y sus precios).
- Gestión de fotos sobre un inmueble existente.

- **Arreglo del bug de Zod 4** en `numeroOpcional` (ver abajo).

Fuera:

- Cambios de backend (no hacen falta).
- Tests de renderizado/DOM (ver sección Testing).

### Bug de Zod 4 incluido en esta rama

`InmuebleFormPage.tsx:37-39` define:

```ts
const numeroOpcional = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
```

En Zod 4 un `z.union([... z.undefined()])` ya **no** marca la clave como
opcional, así que no se puede crear un inmueble con una sola operación (venta o
arriendo). Es el pendiente #1 de la bitácora de `develop`.

Se arregla aquí, no en una rama aparte, porque `numeroOpcional` alimenta tanto
las áreas como `precioVenta`/`precioArriendo` y es precisamente el schema que
esta rama extrae a `InmuebleForm`. Sin el arreglo no se puede verificar de
verdad ninguno de los criterios de aceptación de creación ni de edición.
Arreglo: agregar `.optional()`. Queda cubierto por un test de schema en Vitest.

## Decisión de diseño: extraer el formulario

`InmuebleFormPage.tsx` tiene **625 líneas** y hoy solo sirve para crear. Se
consideraron tres caminos:

| Opción | Resultado | Descartada porque |
|---|---|---|
| Reutilizar con `isEdit` (patrón blog) | Diff mínimo | El archivo crecería a ~750+ líneas. El de blog aguanta el patrón porque tiene 161. |
| Página de edición independiente | Riesgo cero sobre creación | Duplica ~600 líneas de formulario y su schema Zod; todo cambio futuro habría que hacerlo dos veces. |
| **Extraer `InmuebleForm` compartido** | **Elegida** | Añadir un segundo consumidor del formulario es justo el momento en que la extracción se justifica; deja el archivo grande en tamaño manejable. |

## Arquitectura

### Archivos a crear

- `features/admin/properties/schemas/inmuebleSchema.ts` — el schema Zod y sus
  tipos inferidos, **en archivo propio y sin dependencias de React**, para poder
  ejercitarlo en Vitest sin entorno DOM. Aquí vive `numeroOpcional` ya corregido.
- `features/admin/properties/components/InmuebleForm.tsx` — el formulario
  extraído (campos y React Hook Form; el schema lo importa del archivo anterior).
  Props: `{ valoresIniciales?, onSubmit, enviando, textoBoton }`. **No sabe si
  crea o edita** — esa decisión vive en las páginas.
- `features/admin/properties/pages/InmuebleEditarPage.tsx` — envoltura de
  edición: carga por id y monta `InmuebleForm` + `GaleriaImagenes`.

### Dónde viven las operaciones (resuelto explícitamente)

Los campos de operación (`tieneVenta`, `precioVenta`, `tieneArriendo`,
`precioArriendo`) **no son un bloque aparte**: viven dentro del schema Zod del
formulario, con `refine` cruzados que exigen al menos una operación y que el
precio sea > 0 cuando la operación está activa (`InmuebleFormPage.tsx:100-128`).

Por tanto: `InmuebleForm` los incluye, y **la página decide cómo persistirlos**.

| Página | Persistencia |
|---|---|
| Crear | Un solo `POST /api/admin/inmuebles` con `operaciones` embebido en el payload (`CrearInmuebleInput.operaciones`). |
| Editar | `PUT /{id}` con los campos, y **una llamada a `PUT /{id}/operaciones` por cada tipo de operación**. |

**`PUT /{id}/operaciones` recibe UNA operación, no un arreglo.** Su body es
`UpsertOperacionCommand`:

```csharp
public sealed record UpsertOperacionCommand(
    string TipoOperacion,        // 'venta' | 'arriendo'
    decimal Precio,
    decimal? CuotaAdministracion,
    bool AdminIncluida,
    string? Estado,              // 'disponible' | 'reservado' | 'cerrado'
    bool? Activo);
```

Consecuencias para la edición:

- Editar un inmueble con venta y arriendo son **dos** llamadas, una por tipo.
- **No existe endpoint de borrado de operación.** Para quitar una operación que
  el usuario desmarcó se envía la misma operación con `Activo: false`. El
  validador exige `Precio > 0` siempre, así que al desactivar hay que reenviar
  el precio que ya tenía (viene en `InmuebleAdminDetalleDto.Operaciones`), no
  un `0`.
- Las llamadas se hacen en secuencia: primero los campos; si eso falla, no se
  disparan las de operaciones y se muestra el error sin dejar el formulario en
  estado inconsistente.
- `features/admin/properties/api/inmueblesApi.test.ts`
- `features/admin/properties/schemas/inmuebleSchema.test.ts`
- `features/admin/properties/schemas/inmuebleMappers.test.ts`

### Archivos a modificar (diffs aditivos)

- `api/inmueblesApi.ts` — agregar `getInmuebleAdmin(id)`,
  `actualizarInmueble(id, input)`, `upsertOperacion(id, operacion)`. La última
  es **una operación por llamada**, no un arreglo, porque así es el endpoint.
- `hooks/useInmuebles.ts` — agregar `useInmueble(id)` y
  `useActualizarInmueble()`. No hay hook aparte para operaciones: el bucle que
  llama a `upsertOperacion` una vez por operación vive dentro de
  `useActualizarInmueble`, para garantizar que los campos se guarden primero y
  que un fallo ahí no deje operaciones aplicadas a medias.
- `pages/InmuebleFormPage.tsx` — reducir a envoltura delgada de creación.
- `app/router/index.tsx` — una línea:
  `{ path: 'properties/:id/editar', element: <InmuebleEditarPage /> }`.
- `pages/InmueblesPage.tsx` — acción "Editar" por fila.
- `vite.config.ts` y `package.json` — configuración de Vitest.

### Archivos que NO se tocan

`components/GaleriaImagenes.tsx`, `components/TarjetaFotos.tsx`,
`hooks/useImagenes.ts`, y todo el backend.

## Flujo de datos

```
Lista admin ──"Editar"──▶ /admin/properties/:id/editar
                              │
                              ├─ useInmueble(id) ─────▶ GET  /api/admin/inmuebles/{id}
                              ├─ submit campos ───────▶ PUT  /api/admin/inmuebles/{id}
                              ├─ submit operaciones ──▶ PUT  /api/admin/inmuebles/{id}/operaciones
                              └─ GaleriaImagenes ─────▶ (sus propias queries, sin cambios)
```

Claves de React Query (`inmueblesQueryKeys`): la lista usa
`['inmuebles', 'list', filtro]` y el detalle `['inmuebles', 'detalle', id]`,
ambas bajo el prefijo común `['inmuebles']`. Toda mutación invalida ese
prefijo, y por coincidencia parcial de clave eso alcanza también al detalle.

**Cómo se resolvió lo de subir fotos tras crear:** `InmuebleFormPage` **no**
navega a `/admin/properties/:id/editar`. Se llegó a considerar (es lo que hace
`BlogAdminFormPage`), pero se implementó el intercambio en el sitio: una vez
creado el inmueble el formulario se bloquea y la tarjeta de fotos de la barra
lateral pasa de `TarjetaFotos` "bloqueada" a la galería real, sin cambiar de
ruta. Eso resuelve el síntoma original sin perder el contexto de la página.

## Manejo de errores

El grueso ya está resuelto por infraestructura existente:
`ErrorHandlingMiddleware` devuelve RFC 7807 ProblemDetails, y el interceptor de
`shared/lib/axios.ts` maneja 401 con refresh transparente.

Queda por cubrir en esta pantalla:

- **Id inválido o 404** → mensaje "Inmueble no encontrado" con link a la lista.
  No dejar la página en spinner indefinido.
- **Carga inicial** → estado de carga mientras `useInmueble` resuelve, siguiendo
  el patrón `cargandoExistente` de `BlogAdminFormPage`.
- **400 de validación del backend** → mensaje general en `errors.root` del
  formulario, usando el helper `mensajeDeError` ya existente. **No** se mapea
  campo por campo: la página de creación tampoco lo hace hoy, y la validación
  Zod del cliente ya replica las reglas del validador de FluentValidation, así
  que un 400 con detalle por campo es el caso raro. Mapear ProblemDetails a
  campos sería una mejora transversal a todos los formularios del admin, no de
  esta pantalla.

## Testing

Vitest **sin** Testing Library ni entorno DOM (decisión explícita del usuario).

- `inmueblesApi.test.ts` — verifica URL, método HTTP y forma del payload de
  `getInmuebleAdmin`, `actualizarInmueble` y `upsertOperacion`, con
  `apiClient` mockeado. El de `upsertOperacion` además fija que el body sea la
  operación suelta y no un arreglo, que es el error fácil de cometer aquí.
- **No hay `useInmuebles.test.ts`.** Se había planeado para verificar claves de
  query e invalidaciones, pero un hook de React Query no se puede ejercitar sin
  renderer, y este proyecto renuncia al entorno DOM a propósito. En su lugar la
  lógica que valía la pena probar se empujó fuera de los hooks, a mapeadores
  puros (`schemas/inmuebleMappers.ts`), que sí quedan cubiertos. Los hooks se
  quedaron como envoltura delgada sin lógica propia.
- `inmuebleMappers.test.ts` — verifica el ida y vuelta entre el detalle del
  backend y el formulario: qué operaciones quedan marcadas, cómo se desactiva
  una operación desmarcada, y qué campos que el formulario no edita
  (`metaTitulo`, `metaDescripcion`, `asesorId`, el `valor` de cada
  característica) hay que reenviar al editar para que el PUT —que es un
  reemplazo completo, no un merge— no los borre.
- `inmuebleSchema.test.ts` — verifica el schema Zod extraído: que acepta una
  sola operación (solo venta / solo arriendo), que rechaza cero operaciones, y
  que exige precio > 0 cuando la operación está activa. Este es el test que
  cubre el arreglo del bug de Zod 4 y es el único que toca el formulario, ya que
  el schema se puede ejercitar sin DOM.

**Riesgo asumido y su mitigación.** Al no haber tests de DOM, la extracción de
`InmuebleForm` no queda cubierta por ninguna prueba automatizada — y es
precisamente el cambio con más riesgo del lote, porque toca código de creación
que hoy funciona. Mitigación acordada: hacer la extracción como **movimiento
puro**, sin alterar lógica, validada con `pnpm build` (que corre `tsc -b`) más
una prueba manual del flujo de creación completo antes de dar por buena la
rama.

## Criterios de aceptación

- [ ] Desde la lista admin existe una acción "Editar" por inmueble que lleva a
      `/admin/properties/:id/editar`.
- [ ] La pantalla carga los valores actuales del inmueble en el formulario.
- [ ] Guardar cambios de campos persiste vía `PUT /api/admin/inmuebles/{id}` y
      la lista refleja el cambio sin recargar la página.
- [ ] Se pueden editar las operaciones (venta/arriendo y precios) y persisten.
- [ ] Se pueden agregar, marcar como portada y eliminar fotos de un inmueble ya
      existente.
- [ ] Un id inexistente muestra "Inmueble no encontrado", no un spinner eterno.
- [ ] Crear un inmueble sigue funcionando tras el refactor (verificación manual
      explícita del flujo completo).
- [ ] Se puede crear un inmueble con **una sola** operación —solo venta o solo
      arriendo— sin que el schema exija la otra (bug de Zod 4 arreglado).
- [ ] `pnpm build` pasa y los tests de api/hooks/schema pasan.

## Notas de proceso

- Rama `feature/edicion-inmuebles` creada sobre el checkout actual, **sin
  worktree**: los worktrees fallan en este repo por el límite `MAX_PATH` (260)
  de Windows — la raíz de un worktree son ~134 caracteres y el archivo más largo
  del repo son 138, lo que da 272.
- Agregar Vitest es una dependencia nueva de una sola vez, no el "re-setup por
  feature" que el flujo del proyecto prohíbe.
