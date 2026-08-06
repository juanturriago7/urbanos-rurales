# Diseño: layout de ancho completo y fotos integradas en "Nuevo inmueble"

## Contexto

`InmuebleFormPage.tsx` (`/admin/properties/nuevo`) hoy vive dentro de un
contenedor `max-w-4xl`, dejando un espacio muerto grande a la derecha en
pantallas anchas. Además, la carga de fotos (`GaleriaImagenes`) solo aparece
en una segunda pantalla que reemplaza el formulario por completo después de
crear el inmueble — una transición brusca que hace parecer que la carga de
fotos es un paso aparte y obligatorio, cuando en realidad es opcional (solo
se exige al menos una foto para *publicar*, RF-077, no para crear).

Restricción de backend confirmada: la carga de imágenes requiere un
`inmuebleId` real (`POST /api/admin/inmuebles/{id}/imagenes/presign`), así
que las fotos no pueden subirse antes de guardar el registro. Ese orden no
cambia; lo que cambia es cómo se presenta en la misma pantalla.

Fuera de alcance para este cambio (confirmado con el usuario): no existe hoy
página ni endpoint de edición de inmuebles (`/admin/properties/:id/editar`,
`PUT` de actualización). Este diseño no los agrega.

## Layout

`InmuebleFormPage` pasa de una columna `max-w-4xl` a un grid de dos columnas
que usa el ancho disponible dentro de `AdminLayout` (que no impone su propio
max-width, confirmado en `AdminLayout.tsx`):

- **Columna principal** (flexible): las secciones existentes del formulario
  — Identificación, Dirección y coordenadas, Ficha técnica, Operaciones,
  Características — en el mismo orden de hoy.
- **Columna lateral** (~320px, `sticky`): botón de acción primario arriba,
  tarjeta de **Fotos** debajo.
- Por debajo del breakpoint `lg`, el grid colapsa a una sola columna
  apilada (formulario primero, luego la columna lateral) — 320px fijos no
  tienen sentido en pantallas angostas.
- La sección "Ficha técnica" (muchos campos cortos) gana `lg:grid-cols-3`
  en su grid interno para aprovechar el ancho extra de la columna principal.
  Las demás secciones se quedan en su grid de 2 columnas actual, porque ya
  tienen campos que ocupan el ancho completo (título, dirección, descripción).

## Tarjeta de Fotos en la columna lateral

- Visible desde el inicio, titulada "Fotos" con una nota "(opcional)" —
  nunca se presenta como requisito para crear.
- **Antes de guardar** (`inmuebleCreadoId === null`): tarjeta deshabilitada
  visualmente, con el texto "Disponible después de guardar el inmueble".
  No hay botón de carga activo.
- **Después de guardar**: la misma tarjeta pasa a renderizar
  `GaleriaImagenes` con el `inmuebleId` recién creado — en el mismo lugar,
  sin reemplazar la página.

## Estado tras crear el inmueble

Cuando `crear()` resuelve con éxito:

- La columna principal completa se envuelve en `<fieldset disabled>` — los
  componentes `Input`/`Select`/`Textarea` de `Field.tsx` ya traen estilos
  `disabled:` (fondo gris, texto secundario), así que no hace falta tocarlos
  individualmente.
- Aparece un banner encima del formulario: "Inmueble creado en borrador. Ya
  puedes subir fotos o terminar." (reemplaza el mensaje verde actual que
  solo se mostraba en la pantalla separada).
- El botón primario de la columna lateral cambia de "Crear inmueble" a "Ir
  al listado" (navega a `/admin/properties`), evitando un reenvío accidental
  del mismo formulario ya deshabilitado.
- El botón "Cancelar" del encabezado desaparece una vez creado (ya no hay
  nada que cancelar).

## Fuera de alcance

- Edición de inmuebles existentes (página, hook, endpoint) — confirmado con
  el usuario como un cambio separado y más grande.
- El error "No se pudo contactar el servidor" que reportó el usuario al
  probar la carga de fotos es, según lo observado, el backend no corriendo
  en ese momento — no hay cambio de código para eso en este diseño.

## Archivos afectados

- `FrontEndUrbanos/src/features/admin/properties/pages/InmuebleFormPage.tsx`
  — reestructura de layout, fieldset deshabilitado, banner, botón de acción
  movido a la columna lateral, integración inline de `GaleriaImagenes`.
- Posiblemente `GaleriaImagenes.tsx` si el card necesita un modo
  "deshabilitado / aún no disponible" antes de que exista `inmuebleId`
  (hoy el componente asume que siempre recibe un `inmuebleId` válido).
