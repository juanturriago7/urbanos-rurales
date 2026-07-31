using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Features.Catalogos.Queries.GetCaracteristicas;
using Portal.Application.Features.Catalogos.Queries.GetTiposInmueble;
using Portal.Application.Features.Catalogos.Queries.GetUbicaciones;

namespace Portal.Api.Controllers;

/// <summary>
/// Catálogos públicos para poblar los filtros del frontend dinámicamente
/// (ubicaciones jerárquicas, tipos de inmueble, características agrupadas).
/// </summary>
[ApiController]
[Route("api/catalogos")]
[AllowAnonymous]
public sealed class CatalogosController : ControllerBase
{
    private readonly IMediator _mediator;

    public CatalogosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Árbol zona → localidad → upz → barrio.</summary>
    [HttpGet("ubicaciones")]
    [ProducesResponseType(typeof(IReadOnlyList<UbicacionNodoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUbicaciones(CancellationToken ct)
        => Ok(await _mediator.Send(new GetUbicacionesQuery(), ct));

    /// <summary>Tipos de inmueble activos.</summary>
    [HttpGet("tipos-inmueble")]
    [ProducesResponseType(typeof(IReadOnlyList<TipoInmuebleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTiposInmueble(CancellationToken ct)
        => Ok(await _mediator.Send(new GetTiposInmuebleQuery(), ct));

    /// <summary>Características activas agrupadas por categoría.</summary>
    [HttpGet("caracteristicas")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoriaCaracteristicasDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCaracteristicas(CancellationToken ct)
        => Ok(await _mediator.Send(new GetCaracteristicasQuery(), ct));
}
