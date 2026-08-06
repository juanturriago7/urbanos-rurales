using Dapper;
using Portal.Application.Common;
using Portal.Application.Features.Roles.DTOs;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>
/// Implementación del repositorio de Roles usando Dapper puro.
/// Convenciones:
///   - snake_case en SQL (columnas PostgreSQL)
///   - PascalCase en C# (DTOs)
///   - Mapeo explícito mediante alias en SELECT (sin ORMs mágicos)
/// </summary>
internal sealed class RoleRepository : IRoleRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public RoleRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<PagedResult<RoleDto>> GetPagedAsync(
        PaginationParams pagination,
        CancellationToken ct = default)
    {
        // Mapeo explícito: alias SQL → propiedad C# del DTO
        const string dataSql = """
            SELECT
                r.id          AS Id,
                r.name        AS Name,
                r.description AS Description,
                -- ::int es obligatorio: COUNT devuelve bigint y RoleDto.UserCount
                -- es int; Dapper materializa el record por constructor y falla si
                -- el tipo no calza exactamente.
                COUNT(u.id)::int AS UserCount
            FROM roles r
            LEFT JOIN usuarios u ON u.rol::text = LOWER(r.name) AND u.activo = TRUE
            GROUP BY r.id, r.name, r.description
            ORDER BY r.name
            LIMIT @Limit OFFSET @Offset
            """;

        const string countSql = "SELECT COUNT(*) FROM roles";

        using var conn = await _connectionFactory.OpenAsync(ct);

        var items = await conn.QueryAsync<RoleDto>(
            dataSql,
            new { Limit = pagination.PageSize, Offset = pagination.Skip });

        var total = await conn.ExecuteScalarAsync<int>(countSql);

        return PagedResult<RoleDto>.Create(items.AsList(), pagination.Page, pagination.PageSize, total);
    }
}
