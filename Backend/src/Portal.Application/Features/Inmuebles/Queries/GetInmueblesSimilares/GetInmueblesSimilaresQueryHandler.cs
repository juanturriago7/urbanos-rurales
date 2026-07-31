using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblesSimilares;

public sealed class GetInmueblesSimilaresQueryHandler
    : IRequestHandler<GetInmueblesSimilaresQuery, IReadOnlyList<InmueblePublicoListItemDto>>
{
    private readonly IInmueblePublicoRepository _inmuebles;

    public GetInmueblesSimilaresQueryHandler(IInmueblePublicoRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public Task<IReadOnlyList<InmueblePublicoListItemDto>> Handle(
        GetInmueblesSimilaresQuery request, CancellationToken ct)
        => _inmuebles.GetSimilaresAsync(request.Id, Math.Clamp(request.Max, 1, 12), ct);
}
