using MediatR;
using Portal.Application.Features.Blog.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Blog.Queries.GetArticuloPorSlug;

public sealed record GetArticuloPorSlugQuery(string Slug) : IRequest<ArticuloBlogDetalleDto?>;

public sealed class GetArticuloPorSlugQueryHandler
    : IRequestHandler<GetArticuloPorSlugQuery, ArticuloBlogDetalleDto?>
{
    private readonly IArticuloBlogRepository _repo;

    public GetArticuloPorSlugQueryHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<ArticuloBlogDetalleDto?> Handle(
        GetArticuloPorSlugQuery request, CancellationToken ct)
    {
        var a = await _repo.GetBySlugAsync(request.Slug, ct);
        if (a is null || a.Estado != Domain.Enums.EstadoArticuloBlog.Publicado)
        {
            return null;
        }
        return Map(a);
    }

    private static ArticuloBlogDetalleDto Map(ArticuloBlog a) => new(
        a.Id, a.Titulo, a.Slug, a.Resumen, a.Contenido,
        a.ImagenPortadaUrl, a.MetaTitulo, a.MetaDescripcion,
        null, a.PublicadoEn, a.CreadoEn);
}
