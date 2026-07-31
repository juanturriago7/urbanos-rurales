using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Features.Inmuebles.Queries.BuscarInmuebles;
using Portal.Application.Features.Inmuebles.Queries.GetInmueblePorSlug;
using Portal.Application.Features.Inmuebles.Queries.GetInmueblesSimilares;

namespace Portal.Api.Controllers;

/// <summary>
/// Endpoints públicos de inmuebles: búsqueda con filtros (RF-021..025),
/// ficha por slug (RF-040..045) y similares (RF-046).
/// Los query params usan snake_case según el contrato de API.
/// </summary>
[ApiController]
[Route("api/inmuebles")]
[AllowAnonymous]
public sealed class InmueblesController : ControllerBase
{
    private readonly IMediator _mediator;

    public InmueblesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Búsqueda pública con filtros combinables, orden y paginación.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<InmueblePublicoListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Buscar(
        [FromQuery] string? operacion,
        [FromQuery] string? tipo,
        [FromQuery(Name = "ubicacion_id")] long? ubicacionId,
        [FromQuery(Name = "precio_min")] decimal? precioMin,
        [FromQuery(Name = "precio_max")] decimal? precioMax,
        [FromQuery(Name = "area_min")] decimal? areaMin,
        [FromQuery(Name = "area_max")] decimal? areaMax,
        [FromQuery] short? habitaciones,
        [FromQuery] short? banos,
        [FromQuery] short? parqueaderos,
        [FromQuery] bool? mascotas,
        [FromQuery] short? estrato,
        [FromQuery(Name = "admin_incluida")] bool? adminIncluida,
        [FromQuery] string? q,
        [FromQuery] string? orden,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var filtro = new InmueblesFiltro(
            operacion, tipo, ubicacionId, precioMin, precioMax, areaMin, areaMax,
            habitaciones, banos, parqueaderos, mascotas, estrato, adminIncluida, q, orden);

        return Ok(await _mediator.Send(
            new BuscarInmueblesQuery(filtro, new PaginationParams(page, pageSize)), ct));
    }

    /// <summary>Ficha pública completa por slug. Nunca expone la dirección exacta (RF-044).</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(InmueblePublicoDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPorSlug(string slug, CancellationToken ct)
        => Ok(await _mediator.Send(new GetInmueblePorSlugQuery(slug), ct));

    /// <summary>Inmuebles similares: mismo barrio + tipo + rango de precio (RF-046).</summary>
    [HttpGet("{id:long}/similares")]
    [ProducesResponseType(typeof(IReadOnlyList<InmueblePublicoListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilares(long id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetInmueblesSimilaresQuery(id), ct));
}
