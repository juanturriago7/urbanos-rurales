using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portal.Application.Features.Postulaciones.Commands.CrearPostulacion;
using Portal.Application.Features.Postulaciones.Commands.PresignCv;

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

    /// <summary>Paso 1: URL prefirmada para subir la hoja de vida (PDF) directo al bucket.</summary>
    [HttpPost("presign")]
    [EnableRateLimiting("postulaciones")]
    public async Task<IActionResult> Presign([FromBody] PresignRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(new PresignCvCommand(body.NombreArchivo, body.ContentType), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(Problema(result.Error));
    }

    /// <summary>Paso 2: crea la postulación una vez el CV ya está en el bucket.</summary>
    [HttpPost]
    [EnableRateLimiting("postulaciones")]
    public async Task<IActionResult> Crear([FromBody] CrearPostulacionCommand command, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _mediator.Send(command with { IpOrigen = ip }, ct);
        return result.IsSuccess
            ? Ok(new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    public sealed record PresignRequest(string NombreArchivo, string ContentType);

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
