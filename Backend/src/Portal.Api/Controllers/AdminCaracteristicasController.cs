using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Catalogos.Caracteristicas.Commands.ActualizarCaracteristica;
using Portal.Application.Features.Catalogos.Caracteristicas.Commands.ActualizarCategoria;
using Portal.Application.Features.Catalogos.Caracteristicas.Commands.CrearCaracteristica;
using Portal.Application.Features.Catalogos.Caracteristicas.Commands.CrearCategoria;

namespace Portal.Api.Controllers;

/// <summary>CRUD admin de características y sus categorías. Solo Admin.</summary>
[ApiController]
[Route("api/admin/catalogos/caracteristicas")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminCaracteristicasController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminCaracteristicasController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("categorias")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CrearCategoria(
        [FromBody] CrearCategoriaCaracteristicaCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(CrearCategoria), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    [HttpPut("categorias/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActualizarCategoria(
        int id, [FromBody] ActualizarCategoriaCaracteristicaCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(Problema("El id de la ruta no coincide con el del cuerpo."));
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear(
        [FromBody] CrearCaracteristicaCommand command, CancellationToken ct)
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
        int id, [FromBody] ActualizarCaracteristicaCommand command, CancellationToken ct)
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
