using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Roles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Roles.Queries.GetRoles;

/// <summary>
/// Handler para GetRolesQuery. 
/// Regla CQRS: un handler = un caso de uso. No lógica de negocio compleja aquí,
/// solo orquestación (validar → llamar repositorio → devolver resultado).
/// </summary>
public sealed class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, PagedResult<RoleDto>>
{
    private readonly IRoleRepository _roleRepository;

    public GetRolesQueryHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<PagedResult<RoleDto>> Handle(
        GetRolesQuery request, 
        CancellationToken cancellationToken)
    {
        var pagination = request.Pagination.WithClamp();
        return await _roleRepository.GetPagedAsync(pagination, cancellationToken);
    }
}
