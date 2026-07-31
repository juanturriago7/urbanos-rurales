using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Common;
using Portal.Application.Features.Roles.DTOs;
using Portal.Application.Features.Roles.Queries.GetRoles;

namespace Portal.Api.Controllers;

/// <summary>
/// Controller delgado — solo delega a MediatR. Sin lógica de negocio aquí.
/// Patrón: recibir request → mapear a Query/Command → enviar a mediator → devolver respuesta.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class RolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Obtiene el listado paginado de roles del sistema.</summary>
    /// <param name="page">Página (default: 1)</param>
    /// <param name="pageSize">Tamaño de página (default: 20, max: 100)</param>
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(PagedResult<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetRolesQuery(new PaginationParams(page, pageSize)),
            ct);

        return Ok(result);
    }
}
