using MediatR;
using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Features.Catalogos.Queries.GetCaracteristicas;

/// <summary>Características activas agrupadas por categoría (GET /api/catalogos/caracteristicas).</summary>
public sealed record GetCaracteristicasQuery : IRequest<IReadOnlyList<CategoriaCaracteristicasDto>>;
