using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Features.Catalogos.Queries.GetUbicacionesAdmin;
using Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;
using Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;
using Portal.Application.Features.Catalogos.Ubicaciones.Commands.DesactivarUbicacion;

namespace Portal.Api.Controllers;

/// <summary>CRUD admin de <c>ubicaciones</c> (zona/localidad/upz/barrio). Solo Admin.</summary>
[ApiController]
[Route("api/admin/catalogos/ubicaciones")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminUbicacionesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminUbicacionesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Árbol completo (zona/localidad/upz, activos e inactivos) para el panel admin.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UbicacionNodoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken ct)
        => Ok(await _mediator.Send(new GetUbicacionesAdminQuery(), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearUbicacionCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Crear), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Actualizar(
        long id, [FromBody] ActualizarUbicacionCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(Problema("El id de la ruta no coincide con el del cuerpo."));

        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Desactivar(long id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DesactivarUbicacionCommand(id), ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
