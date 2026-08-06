using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Imagenes.Commands.GenerarUrlSubida;

public sealed class GenerarUrlSubidaCommandHandler
    : IRequestHandler<GenerarUrlSubidaCommand, Result<UrlSubidaDto>>
{
    /// <summary>Máximo de imágenes por inmueble (RF-090).</summary>
    private const int MaxImagenesPorInmueble = 10;

    private static readonly TimeSpan Vigencia = TimeSpan.FromMinutes(5);

    private readonly IInmuebleRepository _inmuebles;
    private readonly IImagenRepository _imagenes;
    private readonly IAlmacenamientoObjetos _almacenamiento;

    public GenerarUrlSubidaCommandHandler(
        IInmuebleRepository inmuebles,
        IImagenRepository imagenes,
        IAlmacenamientoObjetos almacenamiento)
    {
        _inmuebles = inmuebles;
        _imagenes = imagenes;
        _almacenamiento = almacenamiento;
    }

    public async Task<Result<UrlSubidaDto>> Handle(
        GenerarUrlSubidaCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.InmuebleId, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.InmuebleId} no encontrado.");
        }

        if (await _imagenes.ContarAsync(request.InmuebleId, ct) >= MaxImagenesPorInmueble)
        {
            return Result<UrlSubidaDto>.Failure(
                $"El inmueble ya tiene el máximo de {MaxImagenesPorInmueble} imágenes (RF-090).");
        }

        // La clave la genera el servidor. Nunca se usa el nombre original del
        // archivo: trae colisiones, caracteres problemáticos y a veces datos
        // personales. El prefijo por inmueble permite borrar la galería completa
        // por prefijo cuando se purga un inmueble.
        var extension = ExtensionDe(request.ContentType);
        var storageKey = $"inmuebles/{request.InmuebleId}/{Guid.NewGuid():N}.{extension}";

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
