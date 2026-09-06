using Dapper;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>
/// Lecturas públicas de inmuebles con Dapper. Siempre restringe a
/// <c>estado = 'publicado'</c> y <c>eliminado_en IS NULL</c>, y nunca
/// selecciona <c>direccion_exacta</c> ni las coordenadas exactas (RF-044).
/// </summary>
internal sealed class InmueblePublicoRepository : IInmueblePublicoRepository
{
    /// <summary>Proyección del ítem público de listado (usa los índices de filtros).</summary>
    private const string SelectListItem = """
        SELECT
            i.id                  AS Id,
            i.slug                AS Slug,
            i.codigo_referencia   AS CodigoReferencia,
            i.titulo              AS Titulo,
            ti.nombre             AS TipoInmueble,
            u.nombre              AS Ubicacion,
            i.habitaciones        AS Habitaciones,
            i.banos               AS Banos,
            i.parqueaderos        AS Parqueaderos,
            i.area_terreno_m2     AS AreaTerrenoM2,
            i.area_construida_m2  AS AreaConstruidaM2,
            i.estrato             AS Estrato,
            i.destacado           AS Destacado,
            (SELECT o.precio FROM inmueble_operaciones o
             WHERE o.inmueble_id = i.id AND o.tipo_operacion = 'venta'
               AND o.activo = TRUE AND o.estado <> 'cerrado')
                                  AS PrecioVenta,
            (SELECT o.precio FROM inmueble_operaciones o
             WHERE o.inmueble_id = i.id AND o.tipo_operacion = 'arriendo'
               AND o.activo = TRUE AND o.estado <> 'cerrado')
                                  AS PrecioArriendo,
            (SELECT im.url_cdn FROM imagenes im
             WHERE im.inmueble_id = i.id AND im.es_portada = TRUE LIMIT 1)
                                  AS ImagenPortada
        FROM inmuebles i
        INNER JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
        INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
        """;

    private readonly DbConnectionFactory _connectionFactory;

    public InmueblePublicoRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<PagedResult<InmueblePublicoListItemDto>> BuscarAsync(
        InmueblesFiltro filtro, PaginationParams pagination, CancellationToken ct = default)
    {
        var condiciones = new List<string>
        {
            "i.eliminado_en IS NULL",
            "i.estado = 'publicado'"
        };

            // Ubicación jerárquica: cualquier nivel filtra su subárbol completo (zona → barrio)
            var conUbicacion = filtro.UbicacionId is not null;
            var prefijoCte = conUbicacion
                ? """
              WITH RECURSIVE ubicacion_sub AS (
                  SELECT id FROM ubicaciones WHERE id = @UbicacionId
                  UNION ALL
                  SELECT u2.id FROM ubicaciones u2
                  INNER JOIN ubicacion_sub s ON u2.padre_id = s.id
              )
              """
                : string.Empty;

            if (conUbicacion)
            {
                condiciones.Add("i.ubicacion_id IN (SELECT id FROM ubicacion_sub)");
            }

            if (filtro.Tipo is not null)
            {
                condiciones.Add("ti.slug = @Tipo");
            }

            // Operación / precio / admin incluida: sobre inmueble_operaciones (índice idx_operaciones_filtro)
            if (filtro.Operacion is not null || filtro.PrecioMin is not null
                || filtro.PrecioMax is not null || filtro.AdminIncluida is not null)
            {
                var subCondiciones = new List<string>
            {
                "o.inmueble_id = i.id",
                "o.activo = TRUE",
                "o.estado <> 'cerrado'"
            };

                if (filtro.Operacion is not null)
                    subCondiciones.Add("o.tipo_operacion = CAST(@Operacion AS tipo_operacion)");
                if (filtro.PrecioMin is not null)
                    subCondiciones.Add("o.precio >= @PrecioMin");
                if (filtro.PrecioMax is not null)
                    subCondiciones.Add("o.precio <= @PrecioMax");
                if (filtro.AdminIncluida is not null)
                    subCondiciones.Add("o.admin_incluida = @AdminIncluida");

                condiciones.Add(
                    $"EXISTS (SELECT 1 FROM inmueble_operaciones o WHERE {string.Join(" AND ", subCondiciones)})");
            }

            if (filtro.AreaMin is not null) condiciones.Add("i.area_construida_m2 >= @AreaMin");
            if (filtro.AreaMax is not null) condiciones.Add("i.area_construida_m2 <= @AreaMax");
            if (filtro.Habitaciones is not null) condiciones.Add("i.habitaciones >= @Habitaciones");
            if (filtro.Banos is not null) condiciones.Add("i.banos >= @Banos");
            if (filtro.Parqueaderos is not null) condiciones.Add("i.parqueaderos >= @Parqueaderos");
            if (filtro.Estrato is not null) condiciones.Add("i.estrato = @Estrato");

            if (filtro.Mascotas == true)
            {
                condiciones.Add("i.politica_mascotas <> 'no_permitidas'");
            }

            if (!string.IsNullOrWhiteSpace(filtro.Q))
            {
                condiciones.Add("""
                (i.busqueda_tsv @@ plainto_tsquery('spanish', unaccent(@Q))
                 OR i.codigo_referencia ILIKE @QLike)
                """);
            }

            // Características: AND — el inmueble debe tener TODAS las seleccionadas.
            // Semántica explícita con doble NOT EXISTS sobre `unnest()` para no depender
            // del orden ni de cardinalidad de la tabla puente.
            if (filtro.CaracteristicaIds is { Count: > 0 })
            {
                condiciones.Add("""
                NOT EXISTS (
                    SELECT 1 FROM unnest(@CaracteristicaIds) AS req(id)
                    WHERE NOT EXISTS (
                        SELECT 1 FROM inmueble_caracteristicas ic
                        WHERE ic.inmueble_id = i.id AND ic.caracteristica_id = req.id
                    )
                )
                """);
            }

            var where = string.Join(" AND ", condiciones);
            var orderBy = OrdenSql(filtro.Orden);

            var sql = $"""
            {prefijoCte}
            {SelectListItem}
            WHERE {where}
            {orderBy}
            LIMIT @PageSize OFFSET @Skip;

            {prefijoCte}
            SELECT COUNT(*)
            FROM inmuebles i
            INNER JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
            WHERE {where};
            """;

            var parametros = new
            {
                filtro.UbicacionId,
                filtro.Tipo,
                filtro.Operacion,
                filtro.PrecioMin,
                filtro.PrecioMax,
                filtro.AdminIncluida,
                filtro.AreaMin,
                filtro.AreaMax,
                filtro.Habitaciones,
                filtro.Banos,
                filtro.Parqueaderos,
                filtro.Estrato,
                CaracteristicaIds = filtro.CaracteristicaIds?.ToArray(),
                filtro.Q,
                QLike = $"%{filtro.Q}%",
                pagination.PageSize,
                pagination.Skip
            };

            using var conn = await _connectionFactory.OpenAsync(ct);
            using var multi = await conn.QueryMultipleAsync(sql, parametros);

            var items = (await multi.ReadAsync<InmueblePublicoListItemDto>()).ToList();
            var total = await multi.ReadSingleAsync<int>();

            return PagedResult<InmueblePublicoListItemDto>.Create(
                items, pagination.Page, pagination.PageSize, total);
    }

    public async Task<InmueblePublicoDetalleDto?> GetDetallePorSlugAsync(
        string slug, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                i.id                     AS Id,
                i.slug                   AS Slug,
                i.codigo_referencia      AS CodigoReferencia,
                i.titulo                 AS Titulo,
                i.descripcion            AS Descripcion,
                ti.nombre                AS TipoInmueble,
                i.tipo_inmueble_id       AS TipoInmuebleId,
                ti.es_propiedad_horizontal AS EsPropiedadHorizontal,
                i.ubicacion_id           AS UbicacionId,
                i.area_terreno_m2        AS AreaTerrenoM2,
                i.area_construida_m2     AS AreaConstruidaM2,
                i.area_privada_m2        AS AreaPrivadaM2,
                i.youtube_url            AS YoutubeUrl,
                i.mapa_embed_url         AS MapaEmbedUrl,
                i.habitaciones           AS Habitaciones,
                i.banos                  AS Banos,
                i.parqueaderos           AS Parqueaderos,
                i.piso                   AS Piso,
                i.pisos_edificio         AS PisosEdificio,
                i.estrato                AS Estrato,
                i.antiguedad             AS Antiguedad,
                i.orientacion            AS Orientacion,
                i.politica_mascotas::text AS PoliticaMascotas,
                i.amoblado               AS Amoblado,
                i.destacado              AS Destacado,
                i.meta_titulo            AS MetaTitulo,
                i.meta_descripcion       AS MetaDescripcion,
                i.creado_en              AS CreadoEn
            FROM inmuebles i
            INNER JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
            WHERE i.slug = @Slug AND i.estado = 'publicado' AND i.eliminado_en IS NULL;

            WITH RECURSIVE cadena AS (
                SELECT u.id, u.tipo::text AS tipo, u.nombre, u.slug, u.padre_id, 0 AS nivel
                FROM ubicaciones u
                WHERE u.id = (SELECT ubicacion_id FROM inmuebles
                              WHERE slug = @Slug AND estado = 'publicado' AND eliminado_en IS NULL)
                UNION ALL
                SELECT p.id, p.tipo::text, p.nombre, p.slug, p.padre_id, c.nivel + 1
                FROM ubicaciones p
                INNER JOIN cadena c ON p.id = c.padre_id
            )
            SELECT id AS Id, tipo AS Tipo, nombre AS Nombre, slug AS Slug
            FROM cadena
            ORDER BY nivel DESC;

            SELECT
                o.id                   AS Id,
                o.tipo_operacion::text AS TipoOperacion,
                o.precio               AS Precio,
                o.cuota_administracion AS CuotaAdministracion,
                o.admin_incluida       AS AdminIncluida,
                o.estado::text         AS Estado,
                o.activo               AS Activo
            FROM inmueble_operaciones o
            WHERE o.inmueble_id = (SELECT id FROM inmuebles
                                   WHERE slug = @Slug AND estado = 'publicado' AND eliminado_en IS NULL)
              AND o.activo = TRUE
            ORDER BY o.tipo_operacion;

            SELECT
                ic.caracteristica_id AS CaracteristicaId,
                c.nombre             AS Nombre,
                cc.nombre            AS Categoria,
                ic.valor             AS Valor
            FROM inmueble_caracteristicas ic
            INNER JOIN caracteristicas c ON c.id = ic.caracteristica_id
            INNER JOIN categorias_caracteristica cc ON cc.id = c.categoria_id
            WHERE ic.inmueble_id = (SELECT id FROM inmuebles
                                    WHERE slug = @Slug AND estado = 'publicado' AND eliminado_en IS NULL)
            ORDER BY cc.orden, c.nombre;

            SELECT
                im.id            AS Id,
                im.url_cdn       AS UrlCdn,
                im.url_thumbnail AS UrlThumbnail,
                im.formato       AS Formato,
                im.orden         AS Orden,
                im.es_portada    AS EsPortada,
                im.texto_alt     AS TextoAlt
            FROM imagenes im
            WHERE im.inmueble_id = (SELECT id FROM inmuebles
                                    WHERE slug = @Slug AND estado = 'publicado' AND eliminado_en IS NULL)
            ORDER BY im.orden;
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var multi = await conn.QueryMultipleAsync(sql, new { Slug = slug });

        var detalle = await multi.ReadSingleOrDefaultAsync<InmueblePublicoDetalleDto>();

        if (detalle is null)
        {
            return null;
        }

        detalle.Ubicacion = (await multi.ReadAsync<UbicacionRefDto>()).ToList();
        detalle.Operaciones = (await multi.ReadAsync<OperacionDto>()).ToList();
        detalle.Caracteristicas = (await multi.ReadAsync<CaracteristicaValorDto>()).ToList();
        detalle.Imagenes = (await multi.ReadAsync<ImagenDto>()).ToList();

        return detalle;
    }

    public async Task<InmueblePublicoDetalleDto?> GetDetallePorIdAsync(
        long id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                i.id                     AS Id,
                i.slug                   AS Slug,
                i.codigo_referencia      AS CodigoReferencia,
                i.titulo                 AS Titulo,
                i.descripcion            AS Descripcion,
                ti.nombre                AS TipoInmueble,
                i.tipo_inmueble_id       AS TipoInmuebleId,
                ti.es_propiedad_horizontal AS EsPropiedadHorizontal,
                i.ubicacion_id           AS UbicacionId,
                i.area_terreno_m2        AS AreaTerrenoM2,
                i.area_construida_m2     AS AreaConstruidaM2,
                i.area_privada_m2        AS AreaPrivadaM2,
                i.youtube_url            AS YoutubeUrl,
                i.mapa_embed_url         AS MapaEmbedUrl,
                i.habitaciones           AS Habitaciones,
                i.banos                  AS Banos,
                i.parqueaderos           AS Parqueaderos,
                i.piso                   AS Piso,
                i.pisos_edificio         AS PisosEdificio,
                i.estrato                AS Estrato,
                i.antiguedad             AS Antiguedad,
                i.orientacion            AS Orientacion,
                i.politica_mascotas::text AS PoliticaMascotas,
                i.amoblado               AS Amoblado,
                i.destacado              AS Destacado,
                i.meta_titulo            AS MetaTitulo,
                i.meta_descripcion       AS MetaDescripcion,
                i.creado_en              AS CreadoEn
            FROM inmuebles i
            INNER JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
            WHERE i.id = @Id AND i.estado = 'publicado' AND i.eliminado_en IS NULL;

            WITH RECURSIVE cadena AS (
                SELECT u.id, u.tipo::text AS tipo, u.nombre, u.slug, u.padre_id, 0 AS nivel
                FROM ubicaciones u
                WHERE u.id = (SELECT ubicacion_id FROM inmuebles
                              WHERE id = @Id AND estado = 'publicado' AND eliminado_en IS NULL)
                UNION ALL
                SELECT p.id, p.tipo::text, p.nombre, p.slug, p.padre_id, c.nivel + 1
                FROM ubicaciones p
                INNER JOIN cadena c ON p.id = c.padre_id
            )
            SELECT id AS Id, tipo AS Tipo, nombre AS Nombre, slug AS Slug
            FROM cadena
            ORDER BY nivel DESC;

            SELECT
                o.id                   AS Id,
                o.tipo_operacion::text AS TipoOperacion,
                o.precio               AS Precio,
                o.cuota_administracion AS CuotaAdministracion,
                o.admin_incluida       AS AdminIncluida,
                o.estado::text         AS Estado,
                o.activo               AS Activo
            FROM inmueble_operaciones o
            WHERE o.inmueble_id = (SELECT id FROM inmuebles
                                   WHERE id = @Id AND estado = 'publicado' AND eliminado_en IS NULL)
              AND o.activo = TRUE
            ORDER BY o.tipo_operacion;

            SELECT
                ic.caracteristica_id AS CaracteristicaId,
                c.nombre             AS Nombre,
                cc.nombre            AS Categoria,
                ic.valor             AS Valor
            FROM inmueble_caracteristicas ic
            INNER JOIN caracteristicas c ON c.id = ic.caracteristica_id
            INNER JOIN categorias_caracteristica cc ON cc.id = c.categoria_id
            WHERE ic.inmueble_id = (SELECT id FROM inmuebles
                                    WHERE id = @Id AND estado = 'publicado' AND eliminado_en IS NULL)
            ORDER BY cc.orden, c.nombre;

            SELECT
                im.id            AS Id,
                im.url_cdn       AS UrlCdn,
                im.url_thumbnail AS UrlThumbnail,
                im.formato       AS Formato,
                im.orden         AS Orden,
                im.es_portada    AS EsPortada,
                im.texto_alt     AS TextoAlt
            FROM imagenes im
            WHERE im.inmueble_id = (SELECT id FROM inmuebles
                                    WHERE id = @Id AND estado = 'publicado' AND eliminado_en IS NULL)
            ORDER BY im.orden;
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var multi = await conn.QueryMultipleAsync(sql, new { Id = id });

        var detalle = await multi.ReadSingleOrDefaultAsync<InmueblePublicoDetalleDto>();

        if (detalle is null)
        {
            return null;
        }

        detalle.Ubicacion = (await multi.ReadAsync<UbicacionRefDto>()).ToList();
        detalle.Operaciones = (await multi.ReadAsync<OperacionDto>()).ToList();
        detalle.Caracteristicas = (await multi.ReadAsync<CaracteristicaValorDto>()).ToList();
        detalle.Imagenes = (await multi.ReadAsync<ImagenDto>()).ToList();

        return detalle;
    }

    public async Task<IReadOnlyList<InmueblePublicoListItemDto>> GetSimilaresAsync(
        long inmuebleId, int max, CancellationToken ct = default)
    {
        // RF-046: mismo barrio + mismo tipo + precio cercano (±30% si hay precio base;
        // si no, ordena por cercanía de precio).
        var sql = $"""
            WITH base AS (
                SELECT
                    b.ubicacion_id,
                    b.tipo_inmueble_id,
                    (SELECT o.precio FROM inmueble_operaciones o
                     WHERE o.inmueble_id = b.id AND o.activo = TRUE
                     ORDER BY o.tipo_operacion LIMIT 1) AS precio
                FROM inmuebles b
                WHERE b.id = @Id
            )
            {SelectListItem}
            CROSS JOIN base
            WHERE i.id <> @Id
              AND i.eliminado_en IS NULL
              AND i.estado = 'publicado'
              AND i.ubicacion_id = base.ubicacion_id
              AND i.tipo_inmueble_id = base.tipo_inmueble_id
              AND (
                  base.precio IS NULL
                  OR EXISTS (
                      SELECT 1 FROM inmueble_operaciones o
                      WHERE o.inmueble_id = i.id AND o.activo = TRUE
                        AND o.precio BETWEEN base.precio * 0.7 AND base.precio * 1.3)
              )
            ORDER BY i.destacado DESC, i.creado_en DESC
            LIMIT @Max
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var items = await conn.QueryAsync<InmueblePublicoListItemDto>(
            sql, new { Id = inmuebleId, Max = max });

        return items.ToList();
    }

    public async Task<IReadOnlyList<SitemapEntradaDto>> GetEntradasSitemapAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT slug AS Slug, actualizado_en AS ActualizadoEn
            FROM inmuebles
            WHERE estado = 'publicado' AND eliminado_en IS NULL
            ORDER BY actualizado_en DESC
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<SitemapEntradaDto>(sql);
        return filas.ToList();
    }

    private static string OrdenSql(string? orden) => orden switch
    {
        "precio_asc" => """
            ORDER BY (SELECT MIN(o.precio) FROM inmueble_operaciones o
                      WHERE o.inmueble_id = i.id AND o.activo = TRUE) ASC NULLS LAST
            """,
        "precio_desc" => """
            ORDER BY (SELECT MAX(o.precio) FROM inmueble_operaciones o
                      WHERE o.inmueble_id = i.id AND o.activo = TRUE) DESC NULLS LAST
            """,
        "area_asc" => "ORDER BY i.area_construida_m2 ASC NULLS LAST",
        "area_desc" => "ORDER BY i.area_construida_m2 DESC NULLS LAST",
        _ => "ORDER BY i.destacado DESC, i.creado_en DESC"   // 'reciente' (default)
    };
}
