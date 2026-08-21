using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class TipoInmuebleAdminRepository : ITipoInmuebleAdminRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public TipoInmuebleAdminRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<int> CreateAsync(TipoInmueble tipo, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO tipos_inmueble (nombre, slug, activo, orden, es_propiedad_horizontal)
            VALUES (@Nombre, @Slug, @Activo, @Orden, @EsPropiedadHorizontal)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            tipo.Nombre,
            tipo.Slug,
            tipo.Activo,
            tipo.Orden,
            tipo.EsPropiedadHorizontal,
        });
    }

    public async Task<TipoInmueble?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, nombre AS Nombre, slug AS Slug, activo AS Activo,
                   orden AS Orden, es_propiedad_horizontal AS EsPropiedadHorizontal
            FROM tipos_inmueble
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<TipoInmueble>(sql, new { Id = id });
    }

    public async Task UpdateAsync(TipoInmueble tipo, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE tipos_inmueble
            SET nombre = @Nombre, activo = @Activo, orden = @Orden,
                es_propiedad_horizontal = @EsPropiedadHorizontal
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            tipo.Id,
            tipo.Nombre,
            tipo.Activo,
            tipo.Orden,
            tipo.EsPropiedadHorizontal,
        });
    }

    public async Task<bool> ExisteSlugAsync(string slug, int? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM tipos_inmueble
                WHERE slug = @Slug
                  AND (@ExcluirId::int IS NULL OR id <> @ExcluirId)
            )
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Slug = slug, ExcluirId = excluirId });
    }
}
