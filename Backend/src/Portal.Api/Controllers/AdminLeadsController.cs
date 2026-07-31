using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Common;
using Portal.Application.Features.Leads.Commands.ActualizarLead;
using Portal.Application.Features.Leads.DTOs;
using Portal.Application.Features.Leads.Queries.GetLeads;

namespace Portal.Api.Controllers;

/// <summary>Gestión de leads del panel admin: listado, cambio de estado y asignación.</summary>
[ApiController]
[Route("api/admin/leads")]
[Authorize(Policy = "AsesorOrAdmin")]
public sealed class AdminLeadsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminLeadsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Listado paginado con filtros por estado e inmueble.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<LeadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeads(
        [FromQuery] string? estado,
        [FromQuery(Name = "inmueble_id")] long? inmuebleId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetLeadsQuery(estado, inmuebleId, new PaginationParams(page, pageSize)), ct));

    /// <summary>Cambia el estado y/o asigna el lead a un asesor.</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarLead(
        long id, [FromBody] ActualizarLeadCommand command, CancellationToken ct)
    {
        command.Id = id;
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ProblemDetails
            {
                Title = "Solicitud inválida",
                Detail = result.Error,
                Status = StatusCodes.Status400BadRequest
            });
    }
}
