using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Interfaces;

/// <summary>
/// Lecturas de catálogos públicos (ubicaciones, tipos de inmueble, características).
/// Devuelve filas planas; la composición (árbol/agrupado) se hace en los handlers.
/// </summary>
public interface ICatalogoRepository
{
    Task<IReadOnlyList<UbicacionPlanaDto>> GetUbicacionesAsync(CancellationToken ct = default);

    /// <summary>Busca ubicaciones por nombre (cualquier nivel, incluidos barrios), máx. <paramref name="limite"/> filas.</summary>
    Task<IReadOnlyList<UbicacionBusquedaDto>> BuscarUbicacionesAsync(
        string termino, int limite, CancellationToken ct = default);

    Task<IReadOnlyList<TipoInmuebleDto>> GetTiposInmuebleAsync(CancellationToken ct = default);

    Task<IReadOnlyList<CaracteristicaPlanaDto>> GetCaracteristicasAsync(CancellationToken ct = default);
}
