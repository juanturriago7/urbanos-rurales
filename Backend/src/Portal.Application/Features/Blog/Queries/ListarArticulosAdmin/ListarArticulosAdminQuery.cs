using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Blog.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Blog.Queries.ListarArticulosAdmin;

public sealed record ListarArticulosAdminQuery(int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<ArticuloBlogAdminDto>>;

public sealed class ListarArticulosAdminQueryHandler
    : IRequestHandler<ListarArticulosAdminQuery, PagedResult<ArticuloBlogAdminDto>>
{
    private readonly IArticuloBlogRepository _repo;

    public ListarArticulosAdminQueryHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<PagedResult<ArticuloBlogAdminDto>> Handle(
        ListarArticulosAdminQuery request, CancellationToken ct)
    {
        var pagination = new PaginationParams(request.Page, request.PageSize).WithClamp();
        var items = await _repo.GetPagedAdminAsync(pagination.Page, pagination.PageSize, ct);
        var total = await _repo.CountAdminAsync(ct);
        return PagedResult<ArticuloBlogAdminDto>.Create(
            items.Select(MapAdmin).ToList(), pagination.Page, pagination.PageSize, total);
    }

    private static ArticuloBlogAdminDto MapAdmin(ArticuloBlog a) => new(
        a.Id, a.Titulo, a.Slug, a.Resumen, a.Contenido,
        a.ImagenPortadaKey, a.ImagenPortadaUrl,
        a.MetaTitulo, a.MetaDescripcion,
        a.Estado.ToString().ToLowerInvariant(),
        a.AutorId, a.PublicadoEn, a.CreadoEn, a.ActualizadoEn);
}
