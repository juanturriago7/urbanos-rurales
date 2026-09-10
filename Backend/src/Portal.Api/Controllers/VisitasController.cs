using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portal.Application.Features.Visitas.Commands.AgendarVisita;

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
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Agendar(
        [FromBody] AgendarVisitaCommand command, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _mediator.Send(command with { IpOrigen = ip }, ct);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new ProblemDetails
            {
                Title = "Solicitud inválida",
                Detail = result.Error,
                Status = StatusCodes.Status400BadRequest,
            });
    }
}
