using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblePorSlug;

/// <summary>Ficha pública del inmueble (GET /api/inmuebles/{slug}). RF-040..045.</summary>
public sealed record GetInmueblePorSlugQuery(string Slug) : IRequest<InmueblePublicoDetalleDto>;
