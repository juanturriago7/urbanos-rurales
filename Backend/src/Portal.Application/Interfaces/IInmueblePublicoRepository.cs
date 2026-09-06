using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Interfaces;

/// <summary>
/// Lecturas públicas de inmuebles: solo <c>estado = 'publicado'</c> y sin
/// borrado lógico. Nunca expone la dirección exacta (RF-044).
/// </summary>
public interface IInmueblePublicoRepository
{
    Task<PagedResult<InmueblePublicoListItemDto>> BuscarAsync(
        InmueblesFiltro filtro, PaginationParams pagination, CancellationToken ct = default);

    Task<InmueblePublicoDetalleDto?> GetDetallePorSlugAsync(
        string slug, CancellationToken ct = default);

    /// <summary>Detalle público por id (uso del chatbot). Mismas reglas que por slug.</summary>
    Task<InmueblePublicoDetalleDto?> GetDetallePorIdAsync(
        long id, CancellationToken ct = default);

    /// <summary>Similares: mismo barrio + mismo tipo + precio cercano (RF-046).</summary>
    Task<IReadOnlyList<InmueblePublicoListItemDto>> GetSimilaresAsync(
        long inmuebleId, int max, CancellationToken ct = default);

    /// <summary>Slugs publicados para el sitemap dinámico (RNF-051).</summary>
    Task<IReadOnlyList<SitemapEntradaDto>> GetEntradasSitemapAsync(CancellationToken ct = default);
}
