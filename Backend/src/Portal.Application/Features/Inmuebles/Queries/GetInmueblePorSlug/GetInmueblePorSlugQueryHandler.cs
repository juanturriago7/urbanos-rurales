using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblePorSlug;

public sealed class GetInmueblePorSlugQueryHandler
    : IRequestHandler<GetInmueblePorSlugQuery, InmueblePublicoDetalleDto>
{
    private readonly IInmueblePublicoRepository _inmuebles;

    public GetInmueblePorSlugQueryHandler(IInmueblePublicoRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<InmueblePublicoDetalleDto> Handle(
        GetInmueblePorSlugQuery request, CancellationToken ct)
    {
        var detalle = await _inmuebles.GetDetallePorSlugAsync(request.Slug, ct);

        return detalle
            ?? throw new KeyNotFoundException($"Inmueble '{request.Slug}' no encontrado.");
    }
}
