using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Imagenes.Commands.RegistrarImagen;

public sealed class RegistrarImagenCommandHandler
    : IRequestHandler<RegistrarImagenCommand, Result<ImagenDto>>
{
    private const int MaxBytes = 10 * 1024 * 1024;

    private readonly IInmuebleRepository _inmuebles;
    private readonly IImagenRepository _imagenes;
    private readonly IAlmacenamientoObjetos _almacenamiento;

    public RegistrarImagenCommandHandler(
        IInmuebleRepository inmuebles,
        IImagenRepository imagenes,
        IAlmacenamientoObjetos almacenamiento)
    {
        _inmuebles = inmuebles;
        _imagenes = imagenes;
        _almacenamiento = almacenamiento;
    }

    public async Task<Result<ImagenDto>> Handle(RegistrarImagenCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.InmuebleId, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.InmuebleId} no encontrado.");
        }

        // La clave la genera el servidor con este prefijo. Comprobarlo impide que
        // un cliente registre un objeto ajeno como imagen de su inmueble.
        var prefijoEsperado = $"inmuebles/{request.InmuebleId}/";

        if (!request.StorageKey.StartsWith(prefijoEsperado, StringComparison.Ordinal))
        {
            return Result<ImagenDto>.Failure("La clave del objeto no corresponde a este inmueble.");
        }

        // Sin esta verificación se podrían registrar filas apuntando a objetos
        // que nunca se subieron. De paso da el peso real, no el que declare el cliente.
        var objeto = await _almacenamiento.ObtenerInfoAsync(request.StorageKey, ct);

        if (!objeto.Existe)
        {
            return Result<ImagenDto>.Failure(
                "La imagen no llegó al almacenamiento. Vuelve a intentar la subida.");
        }

        if (objeto.PesoBytes > MaxBytes)
        {
            await _almacenamiento.EliminarObjetoAsync(request.StorageKey, ct);
            return Result<ImagenDto>.Failure(
                $"La imagen supera el máximo de {MaxBytes / (1024 * 1024)} MB.");
        }

        var formato = Path.GetExtension(request.StorageKey).TrimStart('.').ToLowerInvariant();

        var imagen = Imagen.Create(
            inmuebleId: request.InmuebleId,
            storageKey: request.StorageKey,
            urlCdn: _almacenamiento.ConstruirUrlPublica(request.StorageKey),
            formato: formato,
            pesoBytes: (int)objeto.PesoBytes,
            orden: await _imagenes.SiguienteOrdenAsync(request.InmuebleId, ct),
            textoAlt: request.TextoAlt);

        var id = await _imagenes.CreateAsync(imagen, ct);

        // Se relee para devolver es_portada tal como quedó: la primera imagen del
        // inmueble se marca como portada dentro del INSERT.
        var guardadas = await _imagenes.GetPorInmuebleAsync(request.InmuebleId, ct);
        var creada = guardadas.First(i => i.Id == id);

        return Result<ImagenDto>.Success(creada);
    }
}
