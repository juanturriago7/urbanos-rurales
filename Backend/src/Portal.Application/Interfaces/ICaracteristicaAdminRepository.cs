using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Escritura sobre <c>caracteristicas</c> y <c>categorias_caracteristica</c>.
/// Separada de <see cref="ICatalogoRepository"/> por la misma razón que las demás
/// interfaces de admin.
/// </summary>
public interface ICaracteristicaAdminRepository
{
    // Categorías
    Task<int> CreateCategoriaAsync(string nombre, short orden, CancellationToken ct = default);
    Task<bool> ExisteCategoriaNombreAsync(string nombre, int? excluirId, CancellationToken ct = default);
    Task UpdateCategoriaAsync(int id, string nombre, short orden, bool activo, CancellationToken ct = default);

    // Características
    Task<int> CreateAsync(Caracteristica caracteristica, CancellationToken ct = default);
    Task<Caracteristica?> GetByIdAsync(int id, CancellationToken ct = default);
    Task UpdateAsync(Caracteristica caracteristica, CancellationToken ct = default);

    /// <summary>True si ya existe una característica con ese nombre bajo la misma categoría.</summary>
    Task<bool> ExisteNombreEnCategoriaAsync(string nombre, int categoriaId, int? excluirId, CancellationToken ct = default);
}
