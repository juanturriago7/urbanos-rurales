using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetSitemapEntradas;

public sealed class GetSitemapEntradasQueryHandler
    : IRequestHandler<GetSitemapEntradasQuery, IReadOnlyList<SitemapEntradaDto>>
{
    private readonly IInmueblePublicoRepository _inmuebles;

    public GetSitemapEntradasQueryHandler(IInmueblePublicoRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public Task<IReadOnlyList<SitemapEntradaDto>> Handle(
        GetSitemapEntradasQuery request, CancellationToken ct)
        => _inmuebles.GetEntradasSitemapAsync(ct);
}
