using MediatR;
using Microsoft.Extensions.Logging;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Blog.Commands.EstablecerImagenPortada;

public sealed class EstablecerImagenPortadaCommandHandler
    : IRequestHandler<EstablecerImagenPortadaCommand, Result<string>>
{
    private const int MaxBytes = 10 * 1024 * 1024;

    private readonly IArticuloBlogRepository _articulos;
    private readonly IAlmacenamientoObjetos _almacenamiento;
    private readonly ILogger<EstablecerImagenPortadaCommandHandler> _logger;

    public EstablecerImagenPortadaCommandHandler(
        IArticuloBlogRepository articulos,
        IAlmacenamientoObjetos almacenamiento,
        ILogger<EstablecerImagenPortadaCommandHandler> logger)
    {
        _articulos = articulos;
        _almacenamiento = almacenamiento;
        _logger = logger;
    }

    public async Task<Result<string>> Handle(EstablecerImagenPortadaCommand request, CancellationToken ct)
    {
        var articulo = await _articulos.GetByIdAsync(request.ArticuloId, ct);

        if (articulo is null)
        {
            throw new KeyNotFoundException($"Artículo {request.ArticuloId} no encontrado.");
        }

        // La clave la genera el servidor con este prefijo. Comprobarlo impide que
        // un cliente registre como portada un objeto que no le pertenece.
        var prefijoEsperado = $"blog/{request.ArticuloId}/";

        if (!request.StorageKey.StartsWith(prefijoEsperado, StringComparison.Ordinal))
        {
            return Result<string>.Failure("La clave del objeto no corresponde a este artículo.");
        }

        // Sin esta verificación se podría fijar como portada un objeto que nunca
        // se subió. De paso valida el peso real, no el que declare el cliente.
        var objeto = await _almacenamiento.ObtenerInfoAsync(request.StorageKey, ct);

        if (!objeto.Existe)
        {
            return Result<string>.Failure("La imagen no llegó al almacenamiento. Vuelve a intentar la subida.");
        }

        if (objeto.PesoBytes > MaxBytes)
        {
            await _almacenamiento.EliminarObjetoAsync(request.StorageKey, ct);
            return Result<string>.Failure($"La imagen supera el máximo de {MaxBytes / (1024 * 1024)} MB.");
        }

        var keyAnterior = articulo.ImagenPortadaKey;
        var url = _almacenamiento.ConstruirUrlPublica(request.StorageKey);

        articulo.EstablecerImagenPortada(request.StorageKey, url);

        await _articulos.UpdateAsync(articulo, ct);

        // Limpieza best-effort de la portada anterior — si falla, no tumba la
        // operación: el artículo ya quedó con la portada nueva correctamente.
        if (!string.IsNullOrWhiteSpace(keyAnterior) && keyAnterior != request.StorageKey)
        {
            try
            {
                await _almacenamiento.EliminarObjetoAsync(keyAnterior, ct);
            }
            catch (Exception ex)
            {
                // best-effort: un huérfano en el bucket no es tan grave como
                // fallarle al usuario después de guardar bien la portada nueva.
                _logger.LogWarning(
                    ex, "No se pudo borrar la portada anterior {StorageKey} del artículo {ArticuloId}",
                    keyAnterior, request.ArticuloId);
            }
        }

        return Result<string>.Success(url);
    }
}
