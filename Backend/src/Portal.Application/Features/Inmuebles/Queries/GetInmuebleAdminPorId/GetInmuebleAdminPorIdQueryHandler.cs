using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmuebleAdminPorId;

public sealed class GetInmuebleAdminPorIdQueryHandler
    : IRequestHandler<GetInmuebleAdminPorIdQuery, InmuebleAdminDetalleDto>
{
    private readonly IInmuebleRepository _inmuebles;

    public GetInmuebleAdminPorIdQueryHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<InmuebleAdminDetalleDto> Handle(
        GetInmuebleAdminPorIdQuery request, CancellationToken ct)
    {
        var detalle = await _inmuebles.GetDetalleAdminAsync(request.Id, ct);

        return detalle
            ?? throw new KeyNotFoundException($"Inmueble {request.Id} no encontrado.");
    }
}
