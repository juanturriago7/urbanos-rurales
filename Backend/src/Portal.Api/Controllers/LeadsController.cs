using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portal.Application.Features.Leads.Commands.CrearLead;

namespace Portal.Api.Controllers;

/// <summary>
/// Captura pública de leads (RF-003). Anti-spam (RNF-023): rate limit por IP
/// (policy "leads" en Program.cs) + honeypot en el command.
/// </summary>
[ApiController]
[Route("api/leads")]
[AllowAnonymous]
public sealed class LeadsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LeadsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Crea un lead general o asociado a un inmueble.</summary>
    [HttpPost]
    [EnableRateLimiting("leads")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> CrearLead(
        [FromBody] CrearLeadCommand command, CancellationToken ct)
    {
        command.IpOrigen = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, new { id = result.Value })
            : BadRequest(new ProblemDetails
            {
                Title = "Solicitud inválida",
                Detail = result.Error,
                Status = StatusCodes.Status400BadRequest
            });
    }
}
