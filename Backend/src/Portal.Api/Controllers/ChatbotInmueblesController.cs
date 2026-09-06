using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Features.Inmuebles.Queries.BuscarInmuebles;
using Portal.Application.Features.Inmuebles.Queries.GetInmueblePorId;

namespace Portal.Api.Controllers;

/// <summary>
/// Endpoints de inmuebles para el chatbot: mismos datos y reglas que el
/// buscador público (solo inmuebles con estado='publicado', nunca expone
/// dirección exacta, RF-044), pero requieren sesión (Asesor/Admin) y
/// reciben los filtros de búsqueda en el body en vez de query params.
/// </summary>
[ApiController]
[Route("api/chatbot/inmuebles")]
[Authorize(Policy = "AsesorOrAdmin")]
public sealed class ChatbotInmueblesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatbotInmueblesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Búsqueda con filtros combinables (área, ubicación/localidad, tipo, etc.) vía body.</summary>
    [HttpPost("buscar")]
    [ProducesResponseType(typeof(Application.Common.PagedResult<InmueblePublicoListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Buscar([FromBody] BuscarInmueblesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    /// <summary>Detalle completo del inmueble por id.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(InmueblePublicoDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPorId(long id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetInmueblePorIdQuery(id), ct));
}
