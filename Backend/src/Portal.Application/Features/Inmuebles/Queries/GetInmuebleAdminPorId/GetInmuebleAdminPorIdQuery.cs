using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmuebleAdminPorId;

/// <summary>Detalle completo para edición en el panel admin (GET /api/admin/inmuebles/{id}).</summary>
public sealed record GetInmuebleAdminPorIdQuery(long Id) : IRequest<InmuebleAdminDetalleDto>;
