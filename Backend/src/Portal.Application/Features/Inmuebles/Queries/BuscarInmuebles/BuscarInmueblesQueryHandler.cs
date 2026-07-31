using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.BuscarInmuebles;

public sealed class BuscarInmueblesQueryHandler
    : IRequestHandler<BuscarInmueblesQuery, PagedResult<InmueblePublicoListItemDto>>
{
    private readonly IInmueblePublicoRepository _inmuebles;

    public BuscarInmueblesQueryHandler(IInmueblePublicoRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public Task<PagedResult<InmueblePublicoListItemDto>> Handle(
        BuscarInmueblesQuery request, CancellationToken ct)
        => _inmuebles.BuscarAsync(request.Filtro, request.Pagination.WithClamp(), ct);
}
