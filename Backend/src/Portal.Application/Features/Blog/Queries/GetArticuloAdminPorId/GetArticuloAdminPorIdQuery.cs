using MediatR;
using Portal.Application.Features.Blog.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Blog.Queries.GetArticuloAdminPorId;

public sealed record GetArticuloAdminPorIdQuery(long Id) : IRequest<ArticuloBlogAdminDto?>;

public sealed class GetArticuloAdminPorIdQueryHandler
    : IRequestHandler<GetArticuloAdminPorIdQuery, ArticuloBlogAdminDto?>
{
    private readonly IArticuloBlogRepository _repo;

    public GetArticuloAdminPorIdQueryHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<ArticuloBlogAdminDto?> Handle(
        GetArticuloAdminPorIdQuery request, CancellationToken ct)
    {
        var a = await _repo.GetByIdAsync(request.Id, ct);
        return a is null ? null : new ArticuloBlogAdminDto(
            a.Id, a.Titulo, a.Slug, a.Resumen, a.Contenido,
            a.ImagenPortadaKey, a.ImagenPortadaUrl,
            a.MetaTitulo, a.MetaDescripcion,
            a.Estado.ToString().ToLowerInvariant(),
            a.AutorId, a.PublicadoEn, a.CreadoEn, a.ActualizadoEn);
    }
}
