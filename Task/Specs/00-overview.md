# Overview — Nuevos requerimientos (lote 2026-08-21)

Este folder contiene specs de funcionalidad, una por tema, derivadas de una lista de
requerimientos recibida el 2026-08-21. **Extienden** el modelo y el backlog ya
definidos en `Task/BackEnd/02-modelo-de-datos.md` y `Task/BackEnd/03-backlog-backend.md`
— no los reemplazan. Donde no se diga lo contrario, esos documentos siguen siendo la
fuente de verdad.

Son documentos de **spec**, no de plan de ejecución bite-sized. Cada uno describe:
objetivo, dependencias, cambios de modelo de datos, cambios de backend (archivos,
contratos), cambios de frontend (archivos, rutas), criterios de aceptación, y
supuestos/preguntas abiertas que quedaron sin resolver con el cliente. Cuando alguien
se siente a implementar una de estas specs, el paso recomendado es invocar la skill
`superpowers:writing-plans` usando el spec correspondiente como `Spec:` de entrada,
para generar ahí sí el plan granular TDD paso a paso.

Ningún código se tocó para producir este lote de documentos.

## Índice de specs

| # | Spec | Tamaño | Depende de | Migración propia |
|---|------|--------|------------|-------------------|
| 01 | [Catálogo: Ubicaciones administrables](01-catalogo-ubicaciones.md) | M | — | No |
| 02 | [Catálogo: Tipos de inmueble y Características administrables](02-catalogo-tipos-inmueble-caracteristicas.md) | M/L | — | Sí (`tipos_inmueble`) |
| 03 | [Ficha técnica: propiedad horizontal, área de terreno, video y mapa embebido](03-ficha-tecnica-inmueble.md) | L | **02** | Sí (`inmuebles`) |
| 04 | [Listado público: filtro por característica + quitar favoritos](04-listado-filtros-caracteristicas.md) | M | — | No |
| 05 | [Home: resaltar sección de inmuebles destacados](05-home-seccion-destacados.md) | S | — | No |
| 06 | [Módulo de Blog (CRUD)](06-modulo-blog.md) | L | — | Sí (`articulos_blog`) |
| 07 | [Página "Quiénes somos" + "Trabaja con nosotros"](07-quienes-somos-trabaja-con-nosotros.md) | L | — | Sí (`postulaciones_laborales`) |
| 08 | [Sección de certificaciones (template)](08-seccion-certificaciones.md) | S | — | No |

Tamaños relativos: S = 1-2 días, M = 3-5 días, L = 1-2 semanas, para un desarrollador
familiarizado con el repo (Clean Architecture + CQRS/MediatR + Dapper en backend,
feature-sliced React en frontend).

## Grafo de dependencias

```
02 (tipos_inmueble + flag PH) ──▶ 03 (ficha técnica: terreno/PH/video/mapa)

01, 04, 05, 06, 07, 08 → sin dependencias entre sí ni con 02/03
```

Solo hay **una** dependencia dura en todo el lote: la spec 03 necesita que
`tipos_inmueble` tenga la columna `es_propiedad_horizontal` que agrega la spec 02.
Todo lo demás es paralelizable desde el día 1.

## Reparto sugerido para 2 desarrolladores

La idea rectora: **nunca dos personas tocando la misma tabla/migración EF ni el mismo
archivo de formulario en paralelo.** Cada spec abajo lista explícitamente sus
archivos "Crear" vs. "Modificar"; los de "Modificar" son la superficie real de
conflicto y están minimizados a propósito (rutas nuevas en vez de tabs compartidos,
controladores nuevos por dominio de catálogo en vez de extender uno compartido, etc.)

**Desarrollador A**
1. Spec 01 — Catálogo de ubicaciones (sin dependencias, arranca de inmediato)
2. Spec 04 — Filtro por característica + quitar corazón
3. Spec 06 — Módulo de blog (el más grande y el más aislado: cero tablas ni archivos
   compartidos con el resto del lote — buen "llenador" mientras B resuelve la cadena
   02→03)
4. Spec 08 — Sección de certificaciones (relleno corto si sobra tiempo)

**Desarrollador B**
1. Spec 02 — Catálogo de tipos de inmueble y características (+ flag PH)
2. Spec 03 — Ficha técnica del inmueble (arranca en cuanto B mergea su propio 02;
   no requiere esperar a A)
3. Spec 07 — Quiénes somos + Trabaja con nosotros
4. Spec 05 — Home: resaltar destacados (relleno corto)

Este reparto es una sugerción de arranque, no una asignación rígida — ambos
desarrolladores pueden reordenar según ritmo real, siempre respetando que 03 no
puede empezar en serio (los campos que necesita del catálogo) hasta que 02 esté
mergeado en `develop`.

## Reglas para evitar conflictos (léanlas antes de empezar)

**Migraciones EF Core (`Backend/src/Portal.Infrastructure/Migrations/`).** Solo hay
dos migraciones en el repo hoy y el snapshot (`PortalDbContextModelSnapshot.cs`) es
un único archivo compartido por *todas* las migraciones futuras — si dos ramas
generan una migración cada una sin haberse visto, el snapshot resultante en la
segunda rama en mergear va a chocar.

- Antes de correr `Add-Migration`, haz `git pull`/rebase de `develop` para llevar
  cualquier migración ajena ya mergeada.
- Cada spec con "Migración propia" en la tabla de arriba debe producir **una sola
  migración**, nombrada como en su spec, en su propio PR.
- Si al abrir tu PR ya se mergeó una migración ajena que tu rama no tenía cuando
  generaste la tuya: borra tu migración generada (`Remove-Migration`), rebasa, y
  vuelve a correr `Add-Migration` sobre el snapshot ya actualizado. No intentes
  resolver un conflicto de merge a mano en `PortalDbContextModelSnapshot.cs`.
- Ninguna migración de este lote lleva datos de desarrollo (usuarios, passwords) —
  solo catálogo/estructura, así que son seguras para producción (ver regla existente
  en `CLAUDE.md`).

**Backend — controladores y DTOs de catálogo.** `Portal.Application/Features/Catalogos/DTOs/CatalogoDtos.cs`
hoy mezcla en un solo archivo los DTOs de ubicaciones, tipos de inmueble y
características. Las specs 01 y 02 lo tocan ambas (agregan campos a DTOs distintos
dentro del mismo archivo) — para no pisarse, cada spec **separa sus propios DTOs a un
archivo nuevo** (`UbicacionDtos.cs` para 01, `TiposInmuebleDtos.cs`/`CaracteristicasDtos.cs`
para 02) en vez de seguir agregando al archivo compartido. Quien mergee primero deja
`CatalogoDtos.cs` vacío/eliminado; quien mergee segundo, al rebasar, ya no lo
encuentra y simplemente agrega su propio archivo nuevo — no hay conflicto real, solo
coordinación de quién parte primero. `ICatalogoRepository`/`CatalogoRepository.cs`
(solo lectura, existente) no se toca — cada spec agrega su **propia** interfaz/
repositorio de escritura (`IUbicacionAdminRepository`, `ITipoInmuebleAdminRepository`,
`ICaracteristicaAdminRepository`), nunca extiende el de lectura.

**Backend — la tabla `inmuebles`.** Es la más sensible del esquema. Las specs 03 y
05 (la única otra spec que toca código relacionado con inmuebles) NO tocan la misma
superficie: 03 cambia el modelo/columnas, 05 es puramente presentación de datos que
ya existen (`destacado`, `imagenPortada`, etc.) en un componente que hoy está
comentado. Ninguna otra spec de este lote agrega columnas a `inmuebles` — si en el
futuro surge una nueva petición que sí lo requiera, agréguese a la spec 03 en vez de
abrir una migración nueva sobre la misma tabla.

**Frontend — rutas y navegación.** `app/router/index.tsx` y
`app/layouts/public/navItems.ts` son archivos compartidos por casi todas las specs
(cada una agrega su propia ruta). Mantén esos diffs a líneas puramente aditivas
(una línea nueva por ruta, sin reordenar ni reformatear lo existente) para que un
conflicto de merge, si ocurre, sea trivial de resolver.

**Terminología: "publicaciones" está sobrecargado.** En el código actual,
"publicaciones" ya significa específicamente *inmuebles publicados* — el hook
`usePublicaciones.ts`, el componente `PublicacionesDestacadas.tsx` (que literalmente
rotula su sección "Publicaciones" en el home) y el patrón `InmueblePublico*Dto` lo
usan así en todas partes. La spec 06 (blog) **no debe** reutilizar ese nombre para
sus entradas — se llaman `ArticuloBlog`/`articulos_blog` en todo el stack
(entidad, tabla, hooks, rutas) para no chocar semánticamente con el código existente
ni confundir a quien lea ambos módulos.

## Supuestos transversales que quedaron sin confirmar con el cliente

Cada spec individual repite los suyos en su propia sección "Preguntas abiertas", pero
estos dos aparecieron más de una vez en el mensaje original y vale la pena
señalarlos aquí:

- **"Para las publicaciones, un nuevo atributo que es un link de YouTube"** — se
  interpretó como un campo de video en la ficha del **inmueble** (spec 03), no en el
  blog, porque en el mensaje original esta petición aparece antes de que se mencione
  el módulo de blog, y porque el código existente usa "publicaciones" para inmuebles
  (ver arriba). Si en realidad se refería a los artículos del blog (o a ambos), es
  un cambio de una tabla al spec correspondiente, sin impacto en el resto del lote.
- **"Como en la página de urbanosrurales"** (referencia de diseño para "trabaja con
  nosotros") — no se tuvo acceso a esa página como referencia visual al escribir la
  spec 07; el flujo de carga de hoja de vida se diseñó reutilizando el patrón de
  subida de imágenes ya construido (presign → PUT directo a S3 → confirmar), pero
  sin fidelidad de diseño a ese sitio. Si el cliente tiene capturas o el enlace
  exacto, agrégalas como insumo antes de implementar.
