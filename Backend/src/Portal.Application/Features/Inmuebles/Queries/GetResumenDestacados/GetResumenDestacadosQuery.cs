using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetResumenDestacados;

/// <summary>GET /api/admin/inmuebles/destacados/resumen — cuántos destacados hay y el máximo (RF-078).</summary>
public sealed record GetResumenDestacadosQuery : IRequest<DestacadosResumenDto>;
