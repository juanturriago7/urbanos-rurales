using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Blog.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Blog.Queries.ListarArticulosPublico;

public sealed record ListarArticulosPublicoQuery(int Page = 1, int PageSize = 9)
    : IRequest<PagedResult<ArticuloBlogListItemDto>>;

public sealed class ListarArticulosPublicoQueryHandler
    : IRequestHandler<ListarArticulosPublicoQuery, PagedResult<ArticuloBlogListItemDto>>
{
    private readonly IArticuloBlogRepository _repo;

    public ListarArticulosPublicoQueryHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<PagedResult<ArticuloBlogListItemDto>> Handle(
        ListarArticulosPublicoQuery request, CancellationToken ct)
    {
        var pagination = new PaginationParams(request.Page, request.PageSize).WithClamp();
        var items = await _repo.GetPagedPublicoAsync(pagination.Page, pagination.PageSize, ct);
        var total = await _repo.CountPublicoAsync(ct);
        return PagedResult<ArticuloBlogListItemDto>.Create(
            items.Select(MapListItem).ToList(), pagination.Page, pagination.PageSize, total);
    }

    private static ArticuloBlogListItemDto MapListItem(ArticuloBlog a) => new(
        a.Id, a.Titulo, a.Slug, a.Resumen, a.ImagenPortadaUrl,
        null, // nombre del autor — se puede resolver via join si el cliente lo pide
        a.PublicadoEn);
}
