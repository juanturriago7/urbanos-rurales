using MediatR;
using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Features.Catalogos.Queries.GetUbicaciones;

/// <summary>Árbol completo de ubicaciones activas (GET /api/catalogos/ubicaciones).</summary>
public sealed record GetUbicacionesQuery : IRequest<IReadOnlyList<UbicacionNodoDto>>;
