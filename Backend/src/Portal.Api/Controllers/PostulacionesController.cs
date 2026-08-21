using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Postulaciones.Commands.CrearPostulacion;

namespace Portal.Api.Controllers;

/// <summary>
/// Endpoints públicos del formulario "Trabaja con nosotros" en /quienes-somos.
/// Spec 07. Sin auth (es un formulario de postulación, no requiere sesión).
/// </summary>
[ApiController]
[Route("api/postulaciones")]
[AllowAnonymous]
public sealed class PostulacionesController : ControllerBase
{
    private readonly IMediator _mediator;

    public PostulacionesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearPostulacionCommand command, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _mediator.Send(command with { IpOrigen = ip }, ct);
        return result.IsSuccess
            ? Ok(new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
