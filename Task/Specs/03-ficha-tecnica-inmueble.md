# Spec 03 — Ficha técnica: propiedad horizontal, área de terreno, video y mapa embebido

**Requerimientos originales cubiertos:**
- "En la ficha técnica, los inmuebles pueden ser de 2 tipos: propiedad horizontal o
  no. El primer campo sería área de terreno y no área construida. Área de terreno
  solo aplica cuando no sea propiedad horizontal (apt, oficina, local). Acá más bien
  agregar el campo de área construida opcional y que ellos lo diligencien cuando
  aplique."
- "Para las publicaciones un nuevo atributo que es un link de YouTube." (ver nota de
  interpretación en `00-overview.md` — se implementa aquí, sobre `inmuebles`.)
- "Quitar todo lo relacionado con longitud y latitud, poner el URL de Google Maps
  embebido para que salga la dirección del inmueble... por ahora [no vamos a
  desarrollar], como alternativa el iframe de la publicación para que salga la
  sección HTML embebida."

**Depende de:** Spec 02 (necesita `tipos_inmueble.es_propiedad_horizontal`).
**Migración propia:** sí, sobre `inmuebles` — una sola, agrupa los tres cambios de
esta spec a propósito para que ningún otro PR toque `inmuebles` en paralelo (ver
regla en `00-overview.md`).

## Objetivo

Tres cambios relacionados a la ficha técnica del inmueble, agrupados porque los tres
tocan la misma tabla/entidad/formulario:

1. **Área de terreno vs. área construida**, condicionado por si el tipo de inmueble
   es propiedad horizontal (PH) o no.
2. **Link de YouTube** — video del inmueble (recorrido virtual, dron, etc.).
3. **Reemplazo de latitud/longitud por un mapa de Google embebido** — se elimina la
   captura manual de coordenadas (nunca tuvo un consumidor real, ver el comentario
   ya existente en `InmuebleConfiguration.cs` sobre por qué se hizo nullable) y se
   reemplaza por una URL de embed que el admin pega directamente desde Google Maps.

## Modelo de datos

**Migración `ActualizarFichaTecnicaInmueble`:**

```sql
ALTER TABLE inmuebles
    DROP COLUMN latitud_exacta,
    DROP COLUMN longitud_exacta,
    DROP COLUMN latitud_aproximada,
    DROP COLUMN longitud_aproximada,
    ADD COLUMN area_terreno_m2 NUMERIC(10,2),
    ADD COLUMN youtube_url VARCHAR(300),
    ADD COLUMN mapa_embed_url VARCHAR(500);

DROP INDEX idx_inmuebles_geo;
```

`direccion_exacta` (texto libre, solo admin) **se mantiene** — solo se elimina la
captura numérica de coordenadas, no la dirección.

`area_construida_m2` ya es nullable en el esquema actual (no hace falta migración
para "hacerla opcional" — ya lo es a nivel de base de datos; lo que cambia es la UI
y la validación condicional, ver abajo).

## Por qué URL de embed y no el iframe HTML completo

El cliente dio dos alternativas: guardar solo el URL de Google Maps embed, o guardar
el `<iframe>` HTML completo que Google entrega en "Compartir → Insertar un mapa".
Se recomienda la primera:

- Guardar HTML crudo de un campo de formulario y renderizarlo tal cual (`dangerouslySetInnerHTML`)
  es una vía de XSS si algún día ese campo deja de estar restringido a
  admins de confianza, o si se reutiliza el patrón en un formulario menos
  controlado. Guardar solo el `src` y construir el `<iframe>` en el propio código
  (`<iframe src={mapaEmbedUrl} ...otros-atributos-fijos />`) elimina esa superficie
  por completo.
- Es validable: basta un `Must(url => url.StartsWith("https://www.google.com/maps/embed"))`
  en FluentValidation para rechazar cualquier cosa que no sea, de hecho, un embed de
  Google Maps.

Si en la práctica el campo "solo URL" resulta muy restrictivo (ej. el admin copia el
`<iframe>` completo por error, sin extraer el `src`), la mitigación de UI es simple:
en el input, si se detecta que el valor pegado es un `<iframe ...>` completo,
extraer el `src` con una regex antes de guardarlo — no hace falta almacenar HTML
para eso.

## Backend

**Modificar:**
- `Portal.Domain/Entities/Inmueble.cs` — quitar `LatitudExacta/LongitudExacta/
  LatitudAproximada/LongitudAproximada`; agregar `AreaTerrenoM2`, `YoutubeUrl`,
  `MapaEmbedUrl`; actualizar `Create(...)`.
- `Backend/src/Portal.Infrastructure/Persistence/Configurations/InmuebleConfiguration.cs`
  — quitar los 4 `builder.Property(...)` de lat/long y el `builder.HasIndex(...)`
  `idx_inmuebles_geo`; agregar mapeo de las 3 columnas nuevas
  (`area_terreno_m2` con `HasPrecision(10, 2)`, `youtube_url` con
  `HasMaxLength(300)`, `mapa_embed_url` con `HasMaxLength(500)`).
- `Portal.Application/Features/Inmuebles/Commands/InmuebleDatosCommandBase.cs` —
  quitar los 4 campos de lat/long; agregar `AreaTerrenoM2 (decimal?)`,
  `YoutubeUrl (string?)`, `MapaEmbedUrl (string?)`.
- `InmuebleDatosValidatorBase<T>` (mismo archivo) — quitar las reglas de
  lat/long; agregar:
  ```csharp
  RuleFor(x => x.MapaEmbedUrl)
      .Must(u => u!.StartsWith("https://www.google.com/maps/embed"))
      .When(x => !string.IsNullOrEmpty(x.MapaEmbedUrl))
      .WithMessage("El mapa debe ser una URL de embed de Google Maps (https://www.google.com/maps/embed...).");
  RuleFor(x => x.YoutubeUrl)
      .Must(u => u!.Contains("youtube.com") || u!.Contains("youtu.be"))
      .When(x => !string.IsNullOrEmpty(x.YoutubeUrl))
      .WithMessage("El link debe ser una URL de YouTube.");
  RuleFor(x => x.AreaTerrenoM2).GreaterThan(0).When(x => x.AreaTerrenoM2 is not null);
  ```
  **La regla "área de terreno obligatoria si el tipo no es PH" NO va en el
  validator** — el validator no tiene acceso a base de datos y no debería
  necesitarlo. Va en el handler (ver abajo), como regla de negocio con `Result`,
  siguiendo la convención ya establecida en `CLAUDE.md` ("Write operations return
  `Result`/`Result<T>` ... para expected failure paths").
- `CrearInmuebleCommandHandler.cs` / `ActualizarInmuebleCommandHandler.cs` — antes
  de persistir, resolver el tipo de inmueble seleccionado (reusar
  `ICatalogoRepository.GetTiposInmuebleAsync()`, que tras la spec 02 ya trae
  `EsPropiedadHorizontal`, o agregar un `GetTipoInmueblePorIdAsync(int id)` puntual
  si conviene más por rendimiento — cualquiera de las dos es válida). Si
  `!esPropiedadHorizontal && AreaTerrenoM2 is null` → `Result.Failure("El área de
  terreno es obligatoria para este tipo de inmueble.")`.
- `Portal.Application/Features/Inmuebles/DTOs/InmuebleAdminDtos.cs` — quitar
  lat/long de `InmuebleAdminDetalleDto`/list item si estaban ahí; agregar
  `AreaTerrenoM2`, `YoutubeUrl`, `MapaEmbedUrl`.
- `Portal.Application/Features/Inmuebles/DTOs/InmueblePublicoDtos.cs` — mismo
  cambio en `InmueblePublicoDetalleDto` (agregar también `EsPropiedadHorizontal`,
  resuelto vía join a `tipos_inmueble` en la query, para que el frontend público
  sepa qué área mostrar sin tener que cargar todo el catálogo de tipos aparte); en
  `InmueblePublicoListItemDto` agregar `AreaTerrenoM2` (para las tarjetas de listado
  que quieran mostrarla en tipos no-PH).
- `Portal.Infrastructure/Repositories/InmuebleRepository.cs` — actualizar las listas
  de columnas de los `INSERT`/`UPDATE`/`SELECT` Dapper (quitar 4, agregar 3) tanto
  en el repositorio admin como en el público (`Portal.Infrastructure/Repositories/`
  — verificar si son la misma clase o clases separadas para admin/público al
  implementar).

## Frontend

**Modificar `features/admin/properties/pages/InmuebleFormPage.tsx`:**
- Sección "Ficha técnica": reordenar para que `areaTerrenoM2` aparezca primero,
  `areaConstruidaM2` segundo. `areaTerrenoM2` solo se renderiza (y es requerido) si
  `tiposInmueble.find(t => t.id === tipoInmuebleIdSeleccionado)?.esPropiedadHorizontal === false`;
  si es PH, ese campo no aparece en absoluto y solo se muestra `areaConstruidaM2`
  (opcional, sin cambios respecto a hoy). Necesita el campo `esPropiedadHorizontal`
  que la spec 02 agrega a `useTiposInmueble()`.
- Sección "Dirección y coordenadas" (renombrar a "Dirección y ubicación en mapa"):
  quitar los dos `<input type="number">` de `latitudAproximada`/`longitudAproximada`;
  agregar un `<input>` de texto `mapaEmbedUrl` con texto de ayuda ("En Google Maps:
  Compartir → Insertar un mapa → copia el link que empieza por
  https://www.google.com/maps/embed...") y una previsualización en vivo con un
  `<iframe>` debajo del input cuando el valor pasa la validación de prefijo.
- Nueva sección o campo junto a la galería de fotos: `youtubeUrl` (texto), con
  previsualización en vivo (parsear el ID del video del URL guardado y mostrar
  `https://www.youtube.com/embed/{id}` en un iframe de prueba).
- Zod schema del formulario: quitar `latitudAproximada`/`longitudAproximada`
  (`required`); agregar `areaTerrenoM2` (`.optional()` a nivel de tipo, pero con un
  `.superRefine()` que lo exija cuando el tipo seleccionado no es PH — mismo
  criterio que el backend), `youtubeUrl` y `mapaEmbedUrl` (ambos opcionales, con
  regex de formato).

**Modificar `features/public/properties/pages/InmuebleDetallePage.tsx`:**
- Bloque de specs: mostrar `areaTerrenoM2` en vez de (o junto a, si ambos existen)
  `areaConstruidaM2` cuando `inmueble.esPropiedadHorizontal === false`.
- Nueva sección "Ubicación" con `<iframe src={inmueble.mapaEmbedUrl}>` (si existe;
  si no, mensaje "Ubicación no disponible" en vez de mapa roto).
- Nueva sección "Video" con el YouTube embebido (si `youtubeUrl` existe), debajo o
  junto a la galería.

**Modificar (menor) `features/public/properties/pages/InmueblesListPage.tsx`** —
en `TarjetaInmueble`, mostrar área de terreno en vez de área construida cuando
aplique (mismo criterio, ahora disponible en `InmueblePublicoListItemDto`).

**Modificar tipos:** `features/admin/properties/api/inmueblesApi.ts` y
`features/public/properties/api/inmueblesPublicApi.ts` — quitar
`latitudAproximada/longitudAproximada` de los tipos TS, agregar los 3 campos nuevos.

## Criterios de aceptación

- [ ] Crear un inmueble tipo "Casa" (no-PH) sin área de terreno → 400 con mensaje
      claro, tanto en frontend (antes de enviar) como en backend (si se hace un
      request directo saltándose la UI).
- [ ] Crear un inmueble tipo "Apartamento" (PH) no muestra el campo área de terreno
      en absoluto, ni lo exige.
- [ ] Pegar una URL de Google Maps embed válida en el formulario admin la
      previsualiza correctamente y, tras guardar, aparece el mapa en la ficha
      pública.
- [ ] Pegar cualquier URL que no empiece por `https://www.google.com/maps/embed`
      es rechazado con mensaje claro.
- [ ] Un inmueble con `youtubeUrl` muestra el video embebido en su ficha pública;
      sin `youtubeUrl`, esa sección no se renderiza (no hay hueco vacío).
- [ ] Ningún campo de latitud/longitud sigue existiendo en el formulario admin, en
      los DTOs, ni en el esquema de base de datos tras la migración.

## Fuera de alcance

- Mapa interactivo propio (Leaflet/Mapbox/Google Maps JS API) — el iframe de embed
  es la única superficie de mapa por ahora.
- Geocodificación automática desde `direccion_exacta`.
- Soporte para otros proveedores de video (Vimeo, etc.) — solo YouTube.
