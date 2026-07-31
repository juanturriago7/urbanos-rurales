using MediatR;
using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Features.Catalogos.Queries.GetTiposInmueble;

/// <summary>Tipos de inmueble activos, ordenados (GET /api/catalogos/tipos-inmueble).</summary>
public sealed record GetTiposInmuebleQuery : IRequest<IReadOnlyList<TipoInmuebleDto>>;
