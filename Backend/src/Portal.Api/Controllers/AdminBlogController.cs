using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Blog.Commands.ActualizarArticulo;
using Portal.Application.Features.Blog.Commands.CambiarEstadoArticulo;
using Portal.Application.Features.Blog.Commands.CrearArticulo;
using Portal.Application.Features.Blog.Commands.EliminarArticulo;
using Portal.Application.Features.Blog.Queries.GetArticuloAdminPorId;
using Portal.Application.Features.Blog.Queries.ListarArticulosAdmin;

namespace Portal.Api.Controllers;

/// <summary>CRUD admin de <c>articulos_blog</c>. Solo Admin.</summary>
[ApiController]
[Route("api/admin/blog")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminBlogController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminBlogController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(new ListarArticulosAdminQuery(page, pageSize), ct));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetPorId(long id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetArticuloAdminPorIdQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Crear(
        [FromBody] CrearArticuloCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetPorId), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Actualizar(
        long id, [FromBody] ActualizarArticuloCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(Problema("El id de la ruta no coincide con el del cuerpo."));
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    [HttpPut("{id:long}/estado")]
    public async Task<IActionResult> CambiarEstado(
        long id, [FromBody] CambiarEstadoRequest body, CancellationToken ct)
    {
        if (!Enum.TryParse<Domain.Enums.EstadoArticuloBlog>(body.Estado, ignoreCase: true, out var nuevo))
        {
            return BadRequest(Problema("Estado inválido (borrador | publicado | archivado)."));
        }
        var result = await _mediator.Send(new CambiarEstadoArticuloCommand(id, nuevo), ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Eliminar(long id, CancellationToken ct)
    {
        var result = await _mediator.Send(new EliminarArticuloCommand(id), ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    public sealed record CambiarEstadoRequest(string Estado);

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
