using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Blog.Queries.GetArticuloPorSlug;
using Portal.Application.Features.Blog.Queries.ListarArticulosPublico;

namespace Portal.Api.Controllers;

/// <summary>Endpoints públicos del blog (RF-blog): listado y detalle por slug.
/// Solo artículos en estado 'publicado'.</summary>
[ApiController]
[Route("api/blog")]
[AllowAnonymous]
public sealed class BlogController : ControllerBase
{
    private readonly IMediator _mediator;

    public BlogController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 9,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(new ListarArticulosPublicoQuery(page, pageSize), ct));

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetPorSlug(string slug, CancellationToken ct)
    {
        var articulo = await _mediator.Send(new GetArticuloPorSlugQuery(slug), ct);
        return articulo is null
            ? NotFound(new { error = "Artículo no encontrado." })
            : Ok(articulo);
    }
}
