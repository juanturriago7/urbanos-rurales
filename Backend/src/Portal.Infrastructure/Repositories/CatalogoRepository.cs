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
        // Los barrios (miles una vez cargado el dato real de Bogotá) no viajan en el
        // árbol: se resuelven por nombre vía BuscarUbicacionesAsync. Esto deja el árbol
        // completo (zona → localidad → upz) siempre pequeño y rápido de construir.
        const string sql = """
            SELECT
                id         AS Id,
                tipo::text AS Tipo,
                nombre     AS Nombre,
                slug       AS Slug,
                padre_id   AS PadreId
            FROM ubicaciones
            WHERE activo = TRUE AND tipo <> 'barrio'
            ORDER BY tipo, nombre
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<UbicacionPlanaDto>(sql);
        return filas.ToList();
    }

    public async Task<IReadOnlyList<UbicacionBusquedaDto>> BuscarUbicacionesAsync(
        string termino, int limite, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE ruta AS (
                SELECT id, padre_id, nombre::text AS ruta_completa
                FROM ubicaciones
                WHERE padre_id IS NULL

                UNION ALL

                SELECT u.id, u.padre_id, ruta.ruta_completa || ', ' || u.nombre
                FROM ubicaciones u
                INNER JOIN ruta ON ruta.id = u.padre_id
            )
            SELECT
                u.id               AS Id,
                u.tipo::text       AS Tipo,
                u.nombre           AS Nombre,
                u.slug             AS Slug,
                ruta.ruta_completa AS RutaCompleta
            FROM ubicaciones u
            INNER JOIN ruta ON ruta.id = u.id
            WHERE u.activo = TRUE
              AND unaccent(u.nombre) ILIKE unaccent(@Patron)
            ORDER BY u.tipo, u.nombre
            LIMIT @Limite
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<UbicacionBusquedaDto>(
            sql, new { Patron = $"%{termino}%", Limite = limite });
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
