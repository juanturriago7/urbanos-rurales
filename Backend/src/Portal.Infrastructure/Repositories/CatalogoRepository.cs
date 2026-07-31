using Dapper;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>Lecturas de catálogos públicos con Dapper (alias PascalCase → DTOs).</summary>
internal sealed class CatalogoRepository : ICatalogoRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public CatalogoRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<UbicacionPlanaDto>> GetUbicacionesAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id         AS Id,
                tipo::text AS Tipo,
                nombre     AS Nombre,
                slug       AS Slug,
                padre_id   AS PadreId
            FROM ubicaciones
            WHERE activo = TRUE
            ORDER BY tipo, nombre
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<UbicacionPlanaDto>(sql);
        return filas.ToList();
    }

    public async Task<IReadOnlyList<TipoInmuebleDto>> GetTiposInmuebleAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id     AS Id,
                nombre AS Nombre,
                slug   AS Slug
            FROM tipos_inmueble
            WHERE activo = TRUE
            ORDER BY orden, nombre
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<TipoInmuebleDto>(sql);
        return filas.ToList();
    }

    public async Task<IReadOnlyList<CaracteristicaPlanaDto>> GetCaracteristicasAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                c.id         AS Id,
                c.nombre     AS Nombre,
                c.icono      AS Icono,
                c.tipo_valor AS TipoValor,
                c.filtrable  AS Filtrable,
                cc.id        AS CategoriaId,
                cc.nombre    AS CategoriaNombre
            FROM caracteristicas c
            INNER JOIN categorias_caracteristica cc ON cc.id = c.categoria_id
            WHERE c.activo = TRUE
            ORDER BY cc.orden, cc.nombre, c.nombre
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<CaracteristicaPlanaDto>(sql);
        return filas.ToList();
    }
}
