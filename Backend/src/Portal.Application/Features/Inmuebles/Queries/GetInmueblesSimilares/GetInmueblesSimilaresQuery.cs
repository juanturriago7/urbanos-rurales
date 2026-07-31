using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblesSimilares;

/// <summary>Inmuebles similares: mismo barrio + tipo + rango de precio (RF-046).</summary>
public sealed record GetInmueblesSimilaresQuery(long Id, int Max = 6)
    : IRequest<IReadOnlyList<InmueblePublicoListItemDto>>;
