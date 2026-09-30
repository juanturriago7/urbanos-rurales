using Dapper;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>
/// Repositorio del agregado Inmueble con Dapper.
/// ENUMs nativos: se leen con <c>::text</c> (y <c>REPLACE('_','')</c> cuando la
/// etiqueta tiene guion bajo, para que Dapper los parsee al enum C#) y se
/// escriben con CAST explícito usando las etiquetas de <see cref="ContratoEnums"/>.
/// </summary>
internal sealed class InmuebleRepository : IInmuebleRepository
{
    private const string SelectInmueble = """
        SELECT
            id                      AS Id,
            codigo_referencia       AS CodigoReferencia,
            slug                    AS Slug,
            titulo                  AS Titulo,
            descripcion             AS Descripcion,
            tipo_inmueble_id        AS TipoInmuebleId,
            ubicacion_id            AS UbicacionId,
            direccion_exacta        AS DireccionExacta,
            area_terreno_m2         AS AreaTerrenoM2,
            area_construida_m2      AS AreaConstruidaM2,
            area_privada_m2         AS AreaPrivadaM2,
            youtube_url             AS YoutubeUrl,
            mapa_embed_url          AS MapaEmbedUrl,
            habitaciones            AS Habitaciones,
            banos                   AS Banos,
            parqueaderos            AS Parqueaderos,
            tipos_parqueadero       AS TiposParqueadero,
            piso                    AS Piso,
            pisos_edificio          AS PisosEdificio,
            estrato                 AS Estrato,
            antiguedad              AS Antiguedad,
            orientacion             AS Orientacion,
            REPLACE(politica_mascotas::text, '_', '') AS PoliticaMascotas,
            amoblado                AS Amoblado,
            matricula_inmobiliaria  AS MatriculaInmobiliaria,
            estado::text            AS Estado,
            destacado               AS Destacado,
            meta_titulo             AS MetaTitulo,
            meta_descripcion        AS MetaDescripcion,
            asesor_id               AS AsesorId,
            creado_por              AS CreadoPor,
            creado_en               AS CreadoEn,
            actualizado_en          AS ActualizadoEn,
            eliminado_en            AS EliminadoEn
        FROM inmuebles
        """;

    private const string SelectOperacion = """
        SELECT
            id                   AS Id,
            inmueble_id          AS InmuebleId,
            tipo_operacion::text AS TipoOperacion,
            precio               AS Precio,
            cuota_administracion AS CuotaAdministracion,
            admin_incluida       AS AdminIncluida,
            estado::text         AS Estado,
            activo               AS Activo,
            creado_en            AS CreadoEn
        FROM inmueble_operaciones
        """;

    private readonly DbConnectionFactory _connectionFactory;

    public InmuebleRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Inmueble?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        const string sql = $"{SelectInmueble} WHERE id = @Id";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Inmueble>(sql, new { Id = id });
    }

    public async Task<bool> ExisteCodigoAsync(string codigoReferencia, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS (SELECT 1 FROM inmuebles WHERE codigo_referencia = @Codigo)";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Codigo = codigoReferencia });
    }

    public async Task<bool> ExisteSlugAsync(string slug, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS (SELECT 1 FROM inmuebles WHERE slug = @Slug)";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Slug = slug });
    }

    public async Task<long> CreateAsync(
        Inmueble inmueble,
        IReadOnlyCollection<OperacionInput> operaciones,
        IReadOnlyCollection<CaracteristicaValorInput> caracteristicas,
        CancellationToken ct = default)
    {
        const string insertInmueble = """
            INSERT INTO inmuebles (
                codigo_referencia, slug, titulo, descripcion,
                tipo_inmueble_id, ubicacion_id,
                direccion_exacta,
                area_terreno_m2, area_construida_m2, area_privada_m2,
                youtube_url, mapa_embed_url,
                habitaciones, banos, parqueaderos, tipos_parqueadero, piso, pisos_edificio, estrato,
                antiguedad, orientacion, politica_mascotas, amoblado,
                matricula_inmobiliaria, estado, destacado,
                meta_titulo, meta_descripcion, asesor_id, creado_por,
                creado_en, actualizado_en)
            VALUES (
                @CodigoReferencia, @Slug, @Titulo, @Descripcion,
                @TipoInmuebleId, @UbicacionId,
                @DireccionExacta,
                @AreaTerrenoM2, @AreaConstruidaM2, @AreaPrivadaM2,
                @YoutubeUrl, @MapaEmbedUrl,
                @Habitaciones, @Banos, @Parqueaderos, @TiposParqueadero, @Piso, @PisosEdificio, @Estrato,
                @Antiguedad, @Orientacion, CAST(@PoliticaMascotas AS politica_mascotas), @Amoblado,
                @MatriculaInmobiliaria, CAST(@Estado AS estado_inmueble), @Destacado,
                @MetaTitulo, @MetaDescripcion, @AsesorId, @CreadoPor,
                @CreadoEn, @ActualizadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        var id = await conn.ExecuteScalarAsync<long>(
            insertInmueble, ParametrosDeInmueble(inmueble), tx);

        if (operaciones.Count > 0)
        {
            const string insertOperacion = """
                INSERT INTO inmueble_operaciones (
                    inmueble_id, tipo_operacion, precio, cuota_administracion, admin_incluida)
                VALUES (
                    @InmuebleId, CAST(@TipoOperacion AS tipo_operacion), @Precio,
                    @CuotaAdministracion, @AdminIncluida)
                """;

            await conn.ExecuteAsync(insertOperacion, operaciones.Select(o => new
            {
                InmuebleId = id,
                o.TipoOperacion,
                o.Precio,
                CuotaAdministracion = o.CuotaAdministracion ?? 0,
                o.AdminIncluida
            }), tx);
        }

        if (caracteristicas.Count > 0)
        {
            await InsertarCaracteristicasAsync(conn, tx, id, caracteristicas);
        }

        tx.Commit();
        return id;
    }

    public async Task UpdateAsync(
        Inmueble inmueble,
        IReadOnlyCollection<CaracteristicaValorInput>? caracteristicas = null,
        CancellationToken ct = default)
    {
        const string updateInmueble = """
            UPDATE inmuebles SET
                titulo                 = @Titulo,
                descripcion            = @Descripcion,
                tipo_inmueble_id       = @TipoInmuebleId,
                ubicacion_id           = @UbicacionId,
                direccion_exacta       = @DireccionExacta,
                area_terreno_m2        = @AreaTerrenoM2,
                area_construida_m2     = @AreaConstruidaM2,
                area_privada_m2        = @AreaPrivadaM2,
                youtube_url            = @YoutubeUrl,
                mapa_embed_url         = @MapaEmbedUrl,
                habitaciones           = @Habitaciones,
                banos                  = @Banos,
                parqueaderos           = @Parqueaderos,
                tipos_parqueadero      = @TiposParqueadero,
                piso                   = @Piso,
                pisos_edificio         = @PisosEdificio,
                estrato                = @Estrato,
                antiguedad             = @Antiguedad,
                orientacion            = @Orientacion,
                politica_mascotas      = CAST(@PoliticaMascotas AS politica_mascotas),
                amoblado               = @Amoblado,
                matricula_inmobiliaria = @MatriculaInmobiliaria,
                estado                 = CAST(@Estado AS estado_inmueble),
                -- Este UPDATE general viaja con la entidad leída al inicio del request,
                -- que puede quedar desactualizada frente a un DestacarConCupoAsync
                -- concurrente. Por eso solo puede APAGAR destacado (AND), nunca
                -- encenderlo: el único que puede poner destacado = TRUE es
                -- DestacarConCupoAsync, bajo el advisory lock (RF-078).
                destacado              = destacado AND @Destacado,
                meta_titulo            = @MetaTitulo,
                meta_descripcion       = @MetaDescripcion,
                asesor_id              = @AsesorId,
                actualizado_en         = @ActualizadoEn,
                eliminado_en           = @EliminadoEn
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        await conn.ExecuteAsync(updateInmueble, ParametrosDeInmueble(inmueble), tx);

        if (caracteristicas is not null)
        {
            await conn.ExecuteAsync(
                "DELETE FROM inmueble_caracteristicas WHERE inmueble_id = @Id",
                new { inmueble.Id }, tx);

            if (caracteristicas.Count > 0)
            {
                await InsertarCaracteristicasAsync(conn, tx, inmueble.Id, caracteristicas);
            }
        }

        tx.Commit();
    }

    public async Task<InmuebleOperacion?> GetOperacionAsync(
        long inmuebleId, TipoOperacion tipo, CancellationToken ct = default)
    {
        const string sql = $"""
            {SelectOperacion}
            WHERE inmueble_id = @InmuebleId
              AND tipo_operacion = CAST(@Tipo AS tipo_operacion)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<InmuebleOperacion>(
            sql, new { InmuebleId = inmuebleId, Tipo = ContratoEnums.ToApi(tipo) });
    }

    public async Task<long> CreateOperacionAsync(
        InmuebleOperacion operacion, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO inmueble_operaciones (
                inmueble_id, tipo_operacion, precio, cuota_administracion,
                admin_incluida, estado, activo, creado_en)
            VALUES (
                @InmuebleId, CAST(@TipoOperacion AS tipo_operacion), @Precio,
                @CuotaAdministracion, @AdminIncluida,
                CAST(@Estado AS estado_operacion), @Activo, @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            operacion.InmuebleId,
            TipoOperacion = ContratoEnums.ToApi(operacion.TipoOperacion),
            operacion.Precio,
            operacion.CuotaAdministracion,
            operacion.AdminIncluida,
            Estado = ContratoEnums.ToApi(operacion.Estado),
            operacion.Activo,
            operacion.CreadoEn
        });
    }

    public async Task UpdateOperacionAsync(
        InmuebleOperacion operacion, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE inmueble_operaciones SET
                precio               = @Precio,
                cuota_administracion = @CuotaAdministracion,
                admin_incluida       = @AdminIncluida,
                estado               = CAST(@Estado AS estado_operacion),
                activo               = @Activo
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            operacion.Id,
            operacion.Precio,
            operacion.CuotaAdministracion,
            operacion.AdminIncluida,
            Estado = ContratoEnums.ToApi(operacion.Estado),
            operacion.Activo
        });
    }

    public async Task<int> ContarImagenesAsync(long inmuebleId, CancellationToken ct = default)
    {
        const string sql = "SELECT COUNT(*) FROM imagenes WHERE inmueble_id = @InmuebleId";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql, new { InmuebleId = inmuebleId });
    }

    public async Task<bool> TieneOperacionActivaAsync(long inmuebleId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM inmueble_operaciones
                WHERE inmueble_id = @InmuebleId AND activo = TRUE)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { InmuebleId = inmuebleId });
    }

    public async Task<ResultadoDestacar> DestacarConCupoAsync(
        long id, int maximo, CancellationToken ct = default)
    {
        // Un UPDATE condicional con COUNT en subconsulta NO basta en READ COMMITTED:
        // dos peticiones simultáneas ven cada una el mismo conteo, actualizan filas
        // distintas (no se bloquean entre sí) y superan el máximo. El advisory lock
        // de transacción serializa solo esta operación y se libera con el
        // COMMIT/ROLLBACK.
        const string bloquear = "SELECT pg_advisory_xact_lock(hashtext('inmuebles_destacados'))";

        const string contarOtros = """
            SELECT COUNT(*) FROM inmuebles
            WHERE destacado = TRUE
              AND estado = 'publicado'
              AND eliminado_en IS NULL
              AND id <> @Id
            """;

        const string destacar = """
            UPDATE inmuebles SET
                destacado      = TRUE,
                actualizado_en = @Ahora
            WHERE id = @Id
              AND estado = 'publicado'
              AND eliminado_en IS NULL
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        await conn.ExecuteAsync(bloquear, transaction: tx);

        var ocupados = await conn.ExecuteScalarAsync<int>(contarOtros, new { Id = id }, tx);
        if (ocupados >= maximo)
        {
            return ResultadoDestacar.SinCupo; // el Dispose de tx hace rollback y suelta el lock
        }

        var filas = await conn.ExecuteAsync(destacar, new { Id = id, Ahora = DateTime.UtcNow }, tx);
        if (filas == 0)
        {
            return ResultadoDestacar.NoDisponible;
        }

        tx.Commit();
        return ResultadoDestacar.Destacado;
    }

    public async Task<int> ContarDestacadosAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(*) FROM inmuebles
            WHERE destacado = TRUE
              AND estado = 'publicado'
              AND eliminado_en IS NULL
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql);
    }

    public async Task QuitarDestacadoAsync(long id, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE inmuebles SET
                destacado      = FALSE,
                actualizado_en = @Ahora
            WHERE id = @Id AND destacado = TRUE
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { Id = id, Ahora = DateTime.UtcNow });
    }

    public async Task<PagedResult<InmuebleAdminListItemDto>> GetPagedAdminAsync(
        string? estado, string? q, PaginationParams pagination, CancellationToken ct = default)
    {
        var condiciones = new List<string> { "i.eliminado_en IS NULL" };

        if (estado is not null)
        {
            condiciones.Add("i.estado = CAST(@Estado AS estado_inmueble)");
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            condiciones.Add("""
                (i.busqueda_tsv @@ plainto_tsquery('spanish', unaccent(@Q))
                 OR i.codigo_referencia ILIKE @QLike
                 OR i.titulo ILIKE @QLike)
                """);
        }

        var where = string.Join(" AND ", condiciones);

        var sql = $"""
            SELECT
                i.id                 AS Id,
                i.codigo_referencia  AS CodigoReferencia,
                i.slug               AS Slug,
                i.titulo             AS Titulo,
                ti.nombre            AS TipoInmueble,
                u.nombre             AS Ubicacion,
                i.estado::text       AS Estado,
                i.destacado          AS Destacado,
                (SELECT o.precio FROM inmueble_operaciones o
                 WHERE o.inmueble_id = i.id AND o.tipo_operacion = 'venta' AND o.activo = TRUE)
                                     AS PrecioVenta,
                (SELECT o.precio FROM inmueble_operaciones o
                 WHERE o.inmueble_id = i.id AND o.tipo_operacion = 'arriendo' AND o.activo = TRUE)
                                     AS PrecioArriendo,
                (SELECT im.url_cdn FROM imagenes im
                 WHERE im.inmueble_id = i.id AND im.es_portada = TRUE LIMIT 1)
                                     AS ImagenPortada,
                i.actualizado_en     AS ActualizadoEn
            FROM inmuebles i
            INNER JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
            INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
            WHERE {where}
            ORDER BY i.actualizado_en DESC
            LIMIT @PageSize OFFSET @Skip;

            SELECT COUNT(*) FROM inmuebles i WHERE {where};
            """;

        var parametros = new
        {
            Estado = estado,
            Q = q,
            QLike = $"%{q}%",
            pagination.PageSize,
            pagination.Skip
        };

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var multi = await conn.QueryMultipleAsync(sql, parametros);

        var items = (await multi.ReadAsync<InmuebleAdminListItemDto>()).ToList();
        var total = await multi.ReadSingleAsync<int>();

        return PagedResult<InmuebleAdminListItemDto>.Create(
            items, pagination.Page, pagination.PageSize, total);
    }

    public async Task<InmuebleAdminDetalleDto?> GetDetalleAdminAsync(
        long id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                i.id                     AS Id,
                i.codigo_referencia      AS CodigoReferencia,
                i.slug                   AS Slug,
                i.titulo                 AS Titulo,
                i.descripcion            AS Descripcion,
                i.tipo_inmueble_id       AS TipoInmuebleId,
                i.ubicacion_id           AS UbicacionId,
                i.direccion_exacta       AS DireccionExacta,
                i.area_terreno_m2       AS AreaTerrenoM2,
                i.area_construida_m2     AS AreaConstruidaM2,
                i.area_privada_m2        AS AreaPrivadaM2,
                i.youtube_url            AS YoutubeUrl,
                i.mapa_embed_url         AS MapaEmbedUrl,
                i.habitaciones           AS Habitaciones,
                i.banos                  AS Banos,
                i.parqueaderos           AS Parqueaderos,
                i.tipos_parqueadero      AS TiposParqueadero,
                i.piso                   AS Piso,
                i.pisos_edificio         AS PisosEdificio,
                i.estrato                AS Estrato,
                i.antiguedad             AS Antiguedad,
                i.orientacion            AS Orientacion,
                i.politica_mascotas::text AS PoliticaMascotas,
                i.amoblado               AS Amoblado,
                i.matricula_inmobiliaria AS MatriculaInmobiliaria,
                i.estado::text           AS Estado,
                i.destacado              AS Destacado,
                i.meta_titulo            AS MetaTitulo,
                i.meta_descripcion       AS MetaDescripcion,
                i.asesor_id              AS AsesorId,
                i.creado_en              AS CreadoEn,
                i.actualizado_en         AS ActualizadoEn
            FROM inmuebles i
            WHERE i.id = @Id AND i.eliminado_en IS NULL;

            SELECT
                o.id                   AS Id,
                o.tipo_operacion::text AS TipoOperacion,
                o.precio               AS Precio,
                o.cuota_administracion AS CuotaAdministracion,
                o.admin_incluida       AS AdminIncluida,
                o.estado::text         AS Estado,
                o.activo               AS Activo
            FROM inmueble_operaciones o
            WHERE o.inmueble_id = @Id
            ORDER BY o.tipo_operacion;

            SELECT
                ic.caracteristica_id AS CaracteristicaId,
                c.nombre             AS Nombre,
                cc.nombre            AS Categoria,
                ic.valor             AS Valor
            FROM inmueble_caracteristicas ic
            INNER JOIN caracteristicas c ON c.id = ic.caracteristica_id
            INNER JOIN categorias_caracteristica cc ON cc.id = c.categoria_id
            WHERE ic.inmueble_id = @Id
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
            WHERE im.inmueble_id = @Id
            ORDER BY im.orden;
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var multi = await conn.QueryMultipleAsync(sql, new { Id = id });

        var detalle = await multi.ReadSingleOrDefaultAsync<InmuebleAdminDetalleDto>();

        if (detalle is null)
        {
            return null;
        }

        detalle.Operaciones = (await multi.ReadAsync<OperacionDto>()).ToList();
        detalle.Caracteristicas = (await multi.ReadAsync<CaracteristicaValorDto>()).ToList();
        detalle.Imagenes = (await multi.ReadAsync<ImagenDto>()).ToList();

        return detalle;
    }

    private static async Task InsertarCaracteristicasAsync(
        System.Data.IDbConnection conn,
        System.Data.IDbTransaction tx,
        long inmuebleId,
        IReadOnlyCollection<CaracteristicaValorInput> caracteristicas)
    {
        const string sql = """
            INSERT INTO inmueble_caracteristicas (inmueble_id, caracteristica_id, valor)
            VALUES (@InmuebleId, @CaracteristicaId, @Valor)
            ON CONFLICT (inmueble_id, caracteristica_id) DO UPDATE SET valor = EXCLUDED.valor
            """;

        await conn.ExecuteAsync(sql, caracteristicas.Select(c => new
        {
            InmuebleId = inmuebleId,
            c.CaracteristicaId,
            c.Valor
        }), tx);
    }

    /// <summary>Parámetros compartidos por INSERT/UPDATE del inmueble (enums ya como etiqueta de BD).</summary>
    private static object ParametrosDeInmueble(Inmueble i) => new
    {
        i.Id,
        i.CodigoReferencia,
        i.Slug,
        i.Titulo,
        i.Descripcion,
        i.TipoInmuebleId,
        i.UbicacionId,
        i.DireccionExacta,
        i.AreaTerrenoM2,
        i.AreaConstruidaM2,
        i.AreaPrivadaM2,
        i.YoutubeUrl,
        i.MapaEmbedUrl,
        i.Habitaciones,
        i.Banos,
        i.Parqueaderos,
        // string[]: con NpgsqlConnection, Dapper lo manda como UN parámetro text[]
        // (no lo expande a una lista), igual que @CaracteristicaIds en el buscador.
        i.TiposParqueadero,
        i.Piso,
        i.PisosEdificio,
        i.Estrato,
        i.Antiguedad,
        i.Orientacion,
        PoliticaMascotas = ContratoEnums.ToApi(i.PoliticaMascotas),
        i.Amoblado,
        i.MatriculaInmobiliaria,
        Estado = ContratoEnums.ToApi(i.Estado),
        i.Destacado,
        i.MetaTitulo,
        i.MetaDescripcion,
        i.AsesorId,
        i.CreadoPor,
        i.CreadoEn,
        i.ActualizadoEn,
        i.EliminadoEn
    };
}
