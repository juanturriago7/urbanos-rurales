using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Catalogos.TiposInmueble.Commands.ActualizarTipoInmueble;
using Portal.Application.Features.Catalogos.TiposInmueble.Commands.CrearTipoInmueble;

namespace Portal.Api.Controllers;

/// <summary>CRUD admin de <c>tipos_inmueble</c>. Solo Admin.</summary>
[ApiController]
[Route("api/admin/catalogos/tipos-inmueble")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminTiposInmuebleController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminTiposInmuebleController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearTipoInmuebleCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Crear), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Actualizar(
        int id, [FromBody] ActualizarTipoInmuebleCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(Problema("El id de la ruta no coincide con el del cuerpo."));

        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
