using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Roles.DTOs;

namespace Portal.Application.Features.Roles.Queries.GetRoles;

/// <summary>
/// Query para obtener el listado paginado de roles.
/// Una clase = un caso de uso de lectura. No mezclar con Commands.
/// Patrón: Query → Handler → IRepository (interfaz) → respuesta DTO.
/// </summary>
public sealed record GetRolesQuery(PaginationParams Pagination) 
    : IRequest<PagedResult<RoleDto>>;
