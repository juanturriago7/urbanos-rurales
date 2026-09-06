using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblePorId;

/// <summary>Ficha pública del inmueble por id (uso del chatbot). RF-040..045.</summary>
public sealed record GetInmueblePorIdQuery(long Id) : IRequest<InmueblePublicoDetalleDto>;
