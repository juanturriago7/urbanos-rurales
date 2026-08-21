namespace Portal.Application.Interfaces;

using Portal.Application.Features.Catalogos.DTOs;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

/// <summary>
/// Escritura sobre <c>ubicaciones</c>. Separada de <see cref="ICatalogoRepository"/>
/// (solo lectura) a propósito — evita que el CRUD admin y el árbol público de
/// filtros compartan una misma interfaz con responsabilidades mezcladas.
/// </summary>
public interface IUbicacionAdminRepository
{
    Task<long> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default);

    Task<Ubicacion?> GetByIdAsync(long id, CancellationToken ct = default);

    /// <summary>Persiste nombre/slug/padre_id/activo del estado actual de la entidad.</summary>
    Task UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default);

    /// <summary>Unicidad de hermano: mismo (tipo, slug, padre_id). Excluye <paramref name="excluirId"/> al editar.</summary>
    Task<bool> ExisteHermanoAsync(
        TipoUbicacion tipo, string slug, long? padreId, long? excluirId, CancellationToken ct = default);

    /// <summary>True si <paramref name="posibleAncestroId"/> es descendiente de <paramref name="nodoId"/> — usarlo para bloquear ciclos antes de reubicar.</summary>
    Task<bool> EsDescendienteAsync(long posibleAncestroId, long nodoId, CancellationToken ct = default);

    Task<IReadOnlyList<long>> GetIdsHijosActivosAsync(long id, CancellationToken ct = default);

    /// <summary>Desactiva el nodo y todo su subárbol en una sola sentencia.</summary>
    Task DesactivarConHijosAsync(long id, CancellationToken ct = default);

    /// <summary>
    /// Lista plana de ubicaciones no-barrio (zona/localidad/upz), activas e inactivas.
    /// La construye el handler en árbol; este método no aplica filtro de <c>activo</c>
    /// porque el panel admin debe poder ver y reactivar nodos desactivados.
    /// </summary>
    Task<IReadOnlyList<UbicacionPlanaDto>> GetAllNoBarrioAsync(CancellationToken ct = default);
}
