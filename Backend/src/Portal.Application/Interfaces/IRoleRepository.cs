using Portal.Application.Common;
using Portal.Application.Features.Roles.DTOs;

namespace Portal.Application.Interfaces;

/// <summary>
/// Puerto (interfaz) del repositorio de Roles.
/// Definido en Application, implementado en Infrastructure.
/// Las queries de lectura devuelven DTOs paginados directamente (no entidades).
/// </summary>
public interface IRoleRepository
{
    /// <summary>Listado paginado para queries de lectura.</summary>
    Task<PagedResult<RoleDto>> GetPagedAsync(PaginationParams pagination, CancellationToken ct = default);
}
