# Spec 06 — Módulo de Blog (CRUD)

**Requerimiento original:** "Nuevo módulo de blog con CRUD para las publicaciones."

**Depende de:** nada. **Migración propia:** sí, tabla(s) enteramente nuevas — cero
solapamiento con cualquier otra tabla tocada en este lote. Es la spec más grande y
más aislada de las ocho: buena candidata para trabajarse en paralelo a todo lo
demás sin coordinación.

⚠️ **Nota de nomenclatura — leer antes de nombrar nada:** en este código,
"publicaciones" ya significa específicamente *inmuebles publicados*
(`usePublicaciones.ts`, `PublicacionesDestacadas.tsx`, que literalmente rotula su
sección "Publicaciones" en el home). El blog **no reutiliza ese nombre en ningún
identificador** — entidad, tabla, hooks, rutas, todo se llama `ArticuloBlog`/
`articulos_blog`/`blog` para evitar colisión semántica. Ver detalle en
`00-overview.md`.

## Objetivo

Un módulo de blog completo: entidad, CRUD admin, listado y detalle públicos.
Alcance de v1 deliberadamente simple — editor de texto plano (no WYSIWYG), sin
comentarios, sin tags/categorías (se puede agregar después sin romper nada, siempre
que la migración inicial no lo estorbe).

## Modelo de datos

**Migración `CrearModuloBlog`** (tabla nueva, no toca ninguna existente):

```sql
CREATE TYPE estado_articulo_blog AS ENUM ('borrador', 'publicado', 'archivado');

CREATE TABLE articulos_blog (
    id                  BIGSERIAL PRIMARY KEY,
    titulo              VARCHAR(160) NOT NULL,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    resumen             VARCHAR(320),
    contenido           TEXT NOT NULL,              -- Markdown (ver nota abajo)
    imagen_portada_key  TEXT,                        -- storage key en el bucket S3
    imagen_portada_url  TEXT,
    meta_titulo         VARCHAR(160),
    meta_descripcion    VARCHAR(320),
    estado              estado_articulo_blog NOT NULL DEFAULT 'borrador',
    autor_id            BIGINT REFERENCES usuarios(id),
    publicado_en        TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_articulos_blog_estado ON articulos_blog(estado);
CREATE UNIQUE INDEX idx_articulos_blog_slug ON articulos_blog(slug);
```

**⚠️ Recordatorio del footgun ya documentado en `CLAUDE.md`:** los enums nativos de
Postgres necesitan **dos** registros — `modelBuilder.HasPostgresEnum<EstadoArticuloBlog>()`
en `PortalDbContext.OnModelCreating` (emite el `CREATE TYPE`) **y**
`npgsql.MapEnum<EstadoArticuloBlog>("estado_articulo_blog")` en
`PortalDbContextFactory` (liga la propiedad al tipo). Si se omite el segundo, EF cae
en el mapeo CLR-enum por defecto y la columna sale como `integer`, rompiendo
cualquier SQL Dapper que compare contra el literal (`estado = 'publicado'`). Tras
generar la migración, confirmar que dice `type: "estado_articulo_blog"` y no
`type: "integer"`.

**Sobre `contenido` en Markdown, no HTML/rich-text:** no hay ningún editor WYSIWYG
instalado hoy en `FrontEndUrbanos` (sin TipTap/Quill/etc. en `package.json`).
Para v1, el admin escribe/pega Markdown en un `<textarea>` grande con una vista
previa renderizada al lado (o debajo) usando una librería de markdown-a-HTML ligera
del lado del cliente (ej. `marked` o `markdown-it` + sanitización con `dompurify`
antes de inyectar HTML — **no renderizar el HTML resultante sin sanitizar**, ya que
sí es contenido HTML derivado de texto de usuario). Subir a un editor WYSIWYG real
es una mejora futura, fuera de alcance aquí.

## Backend

**Crear (todo nuevo, ninguno de estos archivos existe hoy):**
- `Portal.Domain/Entities/ArticuloBlog.cs` — POCO con setter privado + `Create(...)`
  factory, mismo patrón que `Inmueble`/`Usuario`. Constructor privado para
  hidratación Dapper.
- `Portal.Domain/Enums/EstadoArticuloBlog.cs` — `Borrador | Publicado | Archivado`.
- `Portal.Infrastructure/Persistence/Configurations/ArticuloBlogConfiguration.cs`
  — DDL de referencia arriba, vía EF (para que `Add-Migration` la genere).
- `Portal.Application/Interfaces/IArticuloBlogRepository.cs` +
  `Portal.Infrastructure/Repositories/ArticuloBlogRepository.cs` — Dapper puro
  (igual que el resto del repo; EF no se usa en runtime, ver `CLAUDE.md`), con
  `CreateAsync`, `UpdateAsync`, `GetByIdAsync`, `GetBySlugAsync` (solo
  `estado = 'publicado'` para la versión pública), `GetPagedAdminAsync`,
  `GetPagedPublicoAsync`, `ExisteSlugAsync`.
- `Portal.Application/Features/Blog/DTOs/BlogDtos.cs` — `ArticuloBlogListItemDto`,
  `ArticuloBlogDetalleDto`, `ArticuloBlogAdminDto`.
- `Portal.Application/Features/Blog/Commands/{CrearArticulo,ActualizarArticulo,
  CambiarEstadoArticulo,EliminarArticulo}/*` — mismo patrón CQRS que
  `Features/Inmuebles/Commands/`.
- `Portal.Application/Features/Blog/Queries/{ListarArticulosPublico,
  ListarArticulosAdmin,GetArticuloPorSlug,GetArticuloAdminPorId}/*`.
- `Portal.Application/Features/Blog/Commands/GenerarUrlSubidaPortada/*` — reutiliza
  `IAlmacenamientoObjetos` (interfaz ya existente, ver
  `Portal.Application/Interfaces/IAlmacenamientoObjetos.cs`) con
  `storageKey = $"blog/{articuloId}/{Guid.NewGuid():N}.{ext}"`, exactamente el
  mismo flujo presign → PUT directo → confirmar que ya usa
  `Features/Imagenes/Commands/GenerarUrlSubida/` para fotos de inmueble — no se
  necesita ninguna interfaz ni implementación de storage nueva, solo un nuevo
  handler que la invoca con el prefijo `blog/` en vez de `inmuebles/`.
- `Portal.Api/Controllers/BlogController.cs` — público, `[AllowAnonymous]`, base
  `/api/blog`: `GET /` (listado paginado, solo publicados), `GET /{slug}` (detalle,
  404 si no está publicado).
- `Portal.Api/Controllers/AdminBlogController.cs` — `[Authorize(Policy =
  "AsesorOrAdmin")]` (mismo criterio que `AdminInmueblesController` — ajustar a
  `AdminOnly` si el cliente prefiere restringir el blog solo a administradores),
  base `/api/admin/blog`: `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`,
  `PUT /{id}/estado`, `DELETE /{id}` (borrado lógico o físico — a decidir; dado que
  un artículo de blog no tiene el peso legal/comercial de un inmueble, borrado
  físico es aceptable aquí, a diferencia de `inmuebles`), `POST /{id}/portada/presign`,
  `POST /{id}/portada` (confirmar).

## Frontend

**Crear (todo nuevo):**
- `features/admin/blog/api/blogAdminApi.ts`, `features/admin/blog/api/blogPortadaApi.ts`
  (mismo patrón de 3 pasos que `features/admin/properties/api/imagenesApi.ts`:
  `presignPortada` → `fetch(urlSubida, { method: 'PUT', ... })` directo, sin pasar
  por `apiClient` → `confirmarPortada`).
- `features/admin/blog/hooks/useBlogAdmin.ts`.
- `features/admin/blog/pages/BlogAdminListPage.tsx`, `BlogAdminFormPage.tsx`
  (crear/editar, con el `<textarea>` + preview de Markdown descrito arriba, subida
  de portada, selector de estado).
- `features/public/blog/api/blogPublicoApi.ts`, `features/public/blog/hooks/useBlogPublico.ts`.
- `features/public/blog/pages/BlogListPage.tsx` (grid de tarjetas, paginado),
  `BlogDetallePage.tsx` (artículo completo, portada, fecha, contenido renderizado
  con sanitización).

**Modificar (diffs aditivos):**
- `app/router/index.tsx` — rutas públicas `blog` y `blog/:slug`; rutas admin
  `admin/blog`, `admin/blog/nuevo`, `admin/blog/:id/editar`.
- `app/layouts/public/navItems.ts` — agregar `{ label: 'Blog', to: '/blog' }`. El
  comentario existente en ese archivo ("Blog no aparece: no hay contenido, y un
  item que lleva a una página vacía es peor que un item ausente") deja de aplicar
  una vez este módulo exista — quitar el comentario junto con agregar el item.

## Criterios de aceptación

- [ ] Un admin puede crear un artículo en borrador, subirle portada, y publicarlo.
- [ ] `/blog` público solo lista artículos con `estado = 'publicado'`.
- [ ] `/blog/{slug}` de un artículo en borrador devuelve 404 para un visitante no
      autenticado.
- [ ] El contenido Markdown se renderiza sanitizado (probar con un artículo que
      incluya intencionalmente `<script>alert(1)</script>` en el cuerpo — no debe
      ejecutarse).
- [ ] El menú público muestra "Blog" y enlaza correctamente.

## Fuera de alcance

- Comentarios de lectores.
- Tags/categorías de artículos.
- Editor WYSIWYG (Markdown + preview es suficiente para v1).
- Programación de publicación futura (`publicado_en` se setea al publicar, no es
  agendable a futuro en v1 aunque la columna ya lo permitiría más adelante).
