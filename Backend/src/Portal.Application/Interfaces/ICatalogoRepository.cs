using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Interfaces;

/// <summary>
/// Lecturas de catálogos públicos (ubicaciones, tipos de inmueble, características).
/// Devuelve filas planas; la composición (árbol/agrupado) se hace en los handlers.
/// </summary>
public interface ICatalogoRepository
{
    Task<IReadOnlyList<UbicacionPlanaDto>> GetUbicacionesAsync(CancellationToken ct = default);

    Task<IReadOnlyList<TipoInmuebleDto>> GetTiposInmuebleAsync(CancellationToken ct = default);

    Task<IReadOnlyList<CaracteristicaPlanaDto>> GetCaracteristicasAsync(CancellationToken ct = default);
}
