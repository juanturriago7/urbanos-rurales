using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Blog.Commands.GenerarUrlSubidaPortada;

public sealed class GenerarUrlSubidaPortadaCommandHandler
    : IRequestHandler<GenerarUrlSubidaPortadaCommand, Result<UrlSubidaDto>>
{
    private static readonly TimeSpan Vigencia = TimeSpan.FromMinutes(5);

    private readonly IArticuloBlogRepository _articulos;
    private readonly IAlmacenamientoObjetos _almacenamiento;

    public GenerarUrlSubidaPortadaCommandHandler(
        IArticuloBlogRepository articulos,
        IAlmacenamientoObjetos almacenamiento)
    {
        _articulos = articulos;
        _almacenamiento = almacenamiento;
    }

    public async Task<Result<UrlSubidaDto>> Handle(
        GenerarUrlSubidaPortadaCommand request, CancellationToken ct)
    {
        var articulo = await _articulos.GetByIdAsync(request.ArticuloId, ct);

        if (articulo is null)
        {
            throw new KeyNotFoundException($"Artículo {request.ArticuloId} no encontrado.");
        }

        // Clave generada por el servidor, nunca el nombre original del archivo.
        // El prefijo por artículo permite purgar el objeto si se elimina el artículo.
        var extension = ExtensionDe(request.ContentType);
        var storageKey = $"blog/{request.ArticuloId}/portada-{Guid.NewGuid():N}.{extension}";

        var url = await _almacenamiento.GenerarUrlSubidaAsync(
            storageKey, request.ContentType.ToLowerInvariant(), Vigencia, ct);

        return Result<UrlSubidaDto>.Success(
            new UrlSubidaDto(url, storageKey, (int)Vigencia.TotalSeconds));
    }

    private static string ExtensionDe(string contentType) => contentType.ToLowerInvariant() switch
    {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        _ => throw new ArgumentOutOfRangeException(nameof(contentType), contentType, "Formato no soportado.")
    };
}
