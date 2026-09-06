using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblePorId;

public sealed class GetInmueblePorIdQueryHandler
    : IRequestHandler<GetInmueblePorIdQuery, InmueblePublicoDetalleDto>
{
    private readonly IInmueblePublicoRepository _inmuebles;

    public GetInmueblePorIdQueryHandler(IInmueblePublicoRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<InmueblePublicoDetalleDto> Handle(
        GetInmueblePorIdQuery request, CancellationToken ct)
    {
        var detalle = await _inmuebles.GetDetallePorIdAsync(request.Id, ct);

        return detalle
            ?? throw new KeyNotFoundException($"Inmueble '{request.Id}' no encontrado.");
    }
}
