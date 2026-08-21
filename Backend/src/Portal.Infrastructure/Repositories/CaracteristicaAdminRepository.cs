using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class CaracteristicaAdminRepository : ICaracteristicaAdminRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public CaracteristicaAdminRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<int> CreateCategoriaAsync(string nombre, short orden, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO categorias_caracteristica (nombre, orden, activo)
            VALUES (@Nombre, @Orden, TRUE)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql, new { Nombre = nombre, Orden = orden });
    }

    public async Task<bool> ExisteCategoriaNombreAsync(string nombre, int? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM categorias_caracteristica
                WHERE lower(nombre) = lower(@Nombre)
                  AND (@ExcluirId::int IS NULL OR id <> @ExcluirId)
            )
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Nombre = nombre, ExcluirId = excluirId });
    }

    public async Task UpdateCategoriaAsync(int id, string nombre, short orden, bool activo, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE categorias_caracteristica
            SET nombre = @Nombre, orden = @Orden, activo = @Activo
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { Id = id, Nombre = nombre, Orden = orden, Activo = activo });
    }

    public async Task<int> CreateAsync(Caracteristica caracteristica, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO caracteristicas (categoria_id, nombre, icono, tipo_valor, filtrable, activo)
            VALUES (@CategoriaId, @Nombre, @Icono, @TipoValor, @Filtrable, @Activo)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            caracteristica.CategoriaId,
            caracteristica.Nombre,
            caracteristica.Icono,
            caracteristica.TipoValor,
            caracteristica.Filtrable,
            caracteristica.Activo,
        });
    }

    public async Task<Caracteristica?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, categoria_id AS CategoriaId, nombre AS Nombre,
                   icono AS Icono, tipo_valor AS TipoValor, filtrable AS Filtrable,
                   activo AS Activo
            FROM caracteristicas
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Caracteristica>(sql, new { Id = id });
    }

    public async Task UpdateAsync(Caracteristica caracteristica, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE caracteristicas
            SET nombre = @Nombre, icono = @Icono, tipo_valor = @TipoValor,
                filtrable = @Filtrable, activo = @Activo
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            caracteristica.Id,
            caracteristica.Nombre,
            caracteristica.Icono,
            caracteristica.TipoValor,
            caracteristica.Filtrable,
            caracteristica.Activo,
        });
    }

    public async Task<bool> ExisteNombreEnCategoriaAsync(string nombre, int categoriaId, int? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM caracteristicas
                WHERE lower(nombre) = lower(@Nombre)
                  AND categoria_id = @CategoriaId
                  AND (@ExcluirId::int IS NULL OR id <> @ExcluirId)
            )
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Nombre = nombre, CategoriaId = categoriaId, ExcluirId = excluirId });
    }
}
