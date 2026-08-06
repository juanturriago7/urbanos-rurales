using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Imagenes.Commands;
using Portal.Application.Features.Imagenes.Commands.GenerarUrlSubida;
using Portal.Application.Features.Imagenes.Commands.RegistrarImagen;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Features.Imagenes.Queries.GetImagenesInmueble;

namespace Portal.Api.Controllers;

/// <summary>
/// Galería de imágenes del inmueble (RF-090 a RF-094).
/// </summary>
/// <remarks>
/// La subida es en dos pasos y el binario nunca pasa por aquí (RNF-013):
/// <list type="number">
///   <item><c>POST .../imagenes/presign</c> devuelve una URL prefirmada</item>
///   <item>el navegador hace <c>PUT</c> de la imagen directo al bucket</item>
///   <item><c>POST .../imagenes</c> confirma y guarda los metadatos</item>
/// </list>
/// </remarks>
[ApiController]
[Route("api/admin/inmuebles/{inmuebleId:long}/imagenes")]
[Authorize(Policy = "AsesorOrAdmin")]
public sealed class AdminImagenesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminImagenesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Galería completa, ordenada.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ImagenDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetImagenes(long inmuebleId, CancellationToken ct)
        => Ok(await _mediator.Send(new GetImagenesInmuebleQuery(inmuebleId), ct));

    /// <summary>Paso 1: URL prefirmada para subir directo al bucket.</summary>
    [HttpPost("presign")]
    [ProducesResponseType(typeof(UrlSubidaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Presign(
        long inmuebleId, [FromBody] PresignRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GenerarUrlSubidaCommand(inmuebleId, body.NombreArchivo, body.ContentType), ct);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(Problema(result.Error));
    }

    /// <summary>Paso 3: confirma que el objeto llegó y registra los metadatos.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ImagenDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarImagen(
        long inmuebleId, [FromBody] RegistrarImagenRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegistrarImagenCommand(inmuebleId, body.StorageKey, body.TextoAlt), ct);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : BadRequest(Problema(result.Error));
    }

    /// <summary>Reordena la galería (RF-091).</summary>
    [HttpPut("orden")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reordenar(
        long inmuebleId, [FromBody] ReordenarImagenesInput body, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ReordenarImagenesCommand(inmuebleId, body.ImagenIds), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Marca la imagen como portada (RF-091).</summary>
    [HttpPut("{imagenId:long}/portada")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarcarPortada(
        long inmuebleId, long imagenId, CancellationToken ct)
    {
        var result = await _mediator.Send(new MarcarPortadaCommand(inmuebleId, imagenId), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Edita el texto alternativo (RF-094).</summary>
    [HttpPut("{imagenId:long}/texto-alt")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EditarTextoAlt(
        long inmuebleId, long imagenId, [FromBody] TextoAltRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new EditarTextoAltCommand(inmuebleId, imagenId, body.TextoAlt), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    /// <summary>Elimina la imagen del bucket y de la base.</summary>
    [HttpDelete("{imagenId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarImagen(
        long inmuebleId, long imagenId, CancellationToken ct)
    {
        var result = await _mediator.Send(new EliminarImagenCommand(inmuebleId, imagenId), ct);

        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "Solicitud inválida",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest
    };

    public sealed record PresignRequest(string NombreArchivo, string ContentType);

    public sealed record RegistrarImagenRequest(string StorageKey, string? TextoAlt);

    public sealed record TextoAltRequest(string? TextoAlt);
}
