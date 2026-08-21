using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Application.Interfaces;

/// <summary>
/// Lectura/escritura sobre <c>articulos_blog</c>. Dapper puro (EF solo diseña
/// la migración — ver <c>CLAUDE.md</c>).
/// </summary>
public interface IArticuloBlogRepository
{
    Task<long> CreateAsync(ArticuloBlog articulo, CancellationToken ct = default);
    Task UpdateAsync(ArticuloBlog articulo, CancellationToken ct = default);
    Task<ArticuloBlog?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<ArticuloBlog?> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<IReadOnlyList<ArticuloBlog>> GetPagedAdminAsync(int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<ArticuloBlog>> GetPagedPublicoAsync(int page, int pageSize, CancellationToken ct = default);
    Task<int> CountPublicoAsync(CancellationToken ct = default);
    Task<int> CountAdminAsync(CancellationToken ct = default);

    Task<bool> ExisteSlugAsync(string slug, long? excluirId, CancellationToken ct = default);
    Task DeleteAsync(long id, CancellationToken ct = default);
}
