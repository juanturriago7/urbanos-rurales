using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Escritura sobre <c>tipos_inmueble</c>. Separada de <see cref="ICatalogoRepository"/>
/// (solo lectura) por la misma razón que <see cref="IUbicacionAdminRepository"/>.
/// </summary>
public interface ITipoInmuebleAdminRepository
{
    Task<int> CreateAsync(TipoInmueble tipo, CancellationToken ct = default);

    Task<TipoInmueble?> GetByIdAsync(int id, CancellationToken ct = default);

    Task UpdateAsync(TipoInmueble tipo, CancellationToken ct = default);

    /// <summary>True si ya existe un tipo con ese slug (excluyendo <paramref name="excluirId"/> al editar).</summary>
    Task<bool> ExisteSlugAsync(string slug, int? excluirId, CancellationToken ct = default);
}
