using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Api.Contracts;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.Commands.ActualizarInmueble;
using Portal.Application.Features.Inmuebles.Commands.CambiarEstadoInmueble;
using Portal.Application.Features.Inmuebles.Commands.CrearInmueble;
using Portal.Application.Features.Inmuebles.Commands.EliminarInmueble;
using Portal.Application.Features.Inmuebles.Commands.MarcarDestacado;
using Portal.Application.Features.Inmuebles.Commands.UpsertOperacion;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Features.Inmuebles.Queries.GetInmuebleAdminPorId;
using Portal.Application.Features.Inmuebles.Queries.GetInmueblesAdmin;

namespace Portal.Api.Controllers;

/// <summary>
/// CRUD de inmuebles del panel admin (RF-070..078). Controller delgado:
/// HTTP → MediatR → respuesta. Requiere rol asesor o admin (RNF-025).
/// </summary>
[ApiController]
[Route("api/admin/inmuebles")]
[Authorize(Policy = "AsesorOrAdmin")]
public sealed class AdminInmueblesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminInmueblesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Listado paginado con filtro por estado y búsqueda (RF-071).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<InmuebleAdminListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInmuebles(
        [FromQuery] string? estado,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new GetInmueblesAdminQuery(estado, q, new PaginationParams(page, pageSize)), ct));

    /// <summary>Detalle completo para edición (incluye dirección exacta, RF-044).</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(InmuebleAdminDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInmueble(long id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetInmuebleAdminPorIdQuery(id), ct));

    /// <summary>Crea un inmueble en borrador (RF-070). Genera código y slug únicos (RF-074).</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CrearInmueble(
        [FromBody] CrearInmuebleCommand command, CancellationToken ct)
    {
        command.CreadoPor = User.GetUsuarioId();
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetInmueble), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    /// <summary>Edita los datos del inmueble (RF-072). Slug y código no cambian.</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarInmueble(
        long id, [FromBody] ActualizarInmuebleCommand command, CancellationToken ct)
    {
        command.Id = id;
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Borrado lógico (RF-073).</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarInmueble(long id, CancellationToken ct)
    {
        await _mediator.Send(new EliminarInmuebleCommand(id), ct);
        return NoContent();
    }

    /// <summary>Cambio de estado editorial (RF-075). Publicar valida RF-077.</summary>
    [HttpPut("{id:long}/estado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarEstado(
        long id, [FromBody] CambiarEstadoRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(new CambiarEstadoInmuebleCommand(id, body.Estado), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Marca o desmarca como destacado (RF-078).</summary>
    [HttpPut("{id:long}/destacado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarcarDestacado(
        long id, [FromBody] MarcarDestacadoRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(new MarcarDestacadoCommand(id, body.Destacado), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Crea o actualiza la operación de venta/arriendo (RF-076).</summary>
    [HttpPost("{id:long}/operaciones")]
    [HttpPut("{id:long}/operaciones")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpsertOperacion(
        long id, [FromBody] UpsertOperacionCommand command, CancellationToken ct)
    {
        command.InmuebleId = id;
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest
    };

    public sealed record CambiarEstadoRequest(string Estado);

    public sealed record MarcarDestacadoRequest(bool Destacado);
}
