using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class UbicacionAdminRepository : IUbicacionAdminRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public UbicacionAdminRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<long> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO ubicaciones (tipo, nombre, slug, padre_id, activo, creado_en)
            VALUES (@Tipo, @Nombre, @Slug, @PadreId, @Activo, @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            Tipo = ubicacion.Tipo.ToString().ToLowerInvariant(),
            ubicacion.Nombre,
            ubicacion.Slug,
            ubicacion.PadreId,
            ubicacion.Activo,
            ubicacion.CreadoEn,
        });
    }

    public async Task<Ubicacion?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, tipo AS Tipo, nombre AS Nombre, slug AS Slug,
                   padre_id AS PadreId, activo AS Activo, creado_en AS CreadoEn
            FROM ubicaciones
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Ubicacion>(sql, new { Id = id });
    }

    public async Task UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE ubicaciones
            SET nombre = @Nombre, slug = @Slug, padre_id = @PadreId, activo = @Activo
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            ubicacion.Id,
            ubicacion.Nombre,
            ubicacion.Slug,
            ubicacion.PadreId,
            ubicacion.Activo,
        });
    }

    public async Task<bool> ExisteHermanoAsync(
        TipoUbicacion tipo, string slug, long? padreId, long? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM ubicaciones
                WHERE tipo = @Tipo::tipo_ubicacion
                  AND slug = @Slug
                  AND padre_id IS NOT DISTINCT FROM @PadreId
                  AND (@ExcluirId::bigint IS NULL OR id <> @ExcluirId)
            )
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new
        {
            Tipo = tipo.ToString().ToLowerInvariant(),
            Slug = slug,
            PadreId = padreId,
            ExcluirId = excluirId,
        });
    }

    public async Task<bool> EsDescendienteAsync(long posibleAncestroId, long nodoId, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE descendientes AS (
                SELECT id FROM ubicaciones WHERE padre_id = @NodoId
                UNION ALL
                SELECT u.id FROM ubicaciones u
                JOIN descendientes d ON u.padre_id = d.id
            )
            SELECT EXISTS (SELECT 1 FROM descendientes WHERE id = @PosibleAncestroId)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { NodoId = nodoId, PosibleAncestroId = posibleAncestroId });
    }

    public async Task<IReadOnlyList<long>> GetIdsHijosActivosAsync(long id, CancellationToken ct = default)
    {
        const string sql = "SELECT id FROM ubicaciones WHERE padre_id = @Id AND activo = TRUE";

        using var conn = await _connectionFactory.OpenAsync(ct);
        var ids = await conn.QueryAsync<long>(sql, new { Id = id });
        return ids.AsList();
    }

    public async Task DesactivarConHijosAsync(long id, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE arbol AS (
                SELECT id FROM ubicaciones WHERE id = @Id
                UNION ALL
                SELECT u.id FROM ubicaciones u JOIN arbol a ON u.padre_id = a.id
            )
            UPDATE ubicaciones SET activo = FALSE WHERE id IN (SELECT id FROM arbol)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { Id = id });
    }
}
