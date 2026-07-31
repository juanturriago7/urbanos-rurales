using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblesAdmin;

public sealed class GetInmueblesAdminQueryHandler
    : IRequestHandler<GetInmueblesAdminQuery, PagedResult<InmuebleAdminListItemDto>>
{
    private readonly IInmuebleRepository _inmuebles;

    public GetInmueblesAdminQueryHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public Task<PagedResult<InmuebleAdminListItemDto>> Handle(
        GetInmueblesAdminQuery request, CancellationToken ct)
        => _inmuebles.GetPagedAdminAsync(
            request.Estado, request.Q, request.Pagination.WithClamp(), ct);
}
