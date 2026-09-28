using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portal.Application.Features.Visitas.Commands.AgendarVisita;
using Portal.Application.Features.Visitas.DTOs;
using Portal.Application.Features.Visitas.Queries.GetDisponibilidadVisitas;

namespace Portal.Api.Controllers;

/// <summary>
/// Solicitud pública de visita a un inmueble. Sin auth (formulario del sitio
/// público). Anti-spam: rate limit por IP (policy "visitas" en Program.cs) +
/// honeypot en el command. La visita se crea en la agenda corporativa
/// (Microsoft 365) y se notifica por correo; no hay tabla propia.
/// </summary>
[ApiController]
[Route("api/visitas")]
[AllowAnonymous]
public sealed class VisitasController : ControllerBase
{
    private readonly IMediator _mediator;

    public VisitasController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Agenda una visita: valida el slot, crea el evento y notifica.</summary>
    [HttpPost]
    [EnableRateLimiting("visitas")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Agendar(
        [FromBody] AgendarVisitaCommand command, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _mediator.Send(command with { IpOrigen = ip }, ct);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        var ocupada = result.Error == ReglasAgenda.MensajeFranjaOcupada;
        var estado = ocupada ? StatusCodes.Status409Conflict : StatusCodes.Status400BadRequest;

        return StatusCode(estado, new ProblemDetails
        {
            Title = ocupada ? "Franja no disponible" : "Solicitud inválida",
            Detail = result.Error,
            Status = estado,
        });
    }

    /// <summary>Franjas ya ocupadas de un día ("yyyy-MM-dd"), para ocultarlas del selector.</summary>
    [HttpGet("disponibilidad")]
    [EnableRateLimiting("visitas-disponibilidad")]
    [ProducesResponseType(typeof(DisponibilidadVisitasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Disponibilidad([FromQuery] string fecha, CancellationToken ct)
        => Ok(await _mediator.Send(new GetDisponibilidadVisitasQuery(fecha), ct));
}
