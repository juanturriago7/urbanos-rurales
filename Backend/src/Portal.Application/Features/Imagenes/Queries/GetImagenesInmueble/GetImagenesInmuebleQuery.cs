using MediatR;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Imagenes.Queries.GetImagenesInmueble;

/// <summary>Galería completa de un inmueble, ordenada.</summary>
public sealed record GetImagenesInmuebleQuery(long InmuebleId)
    : IRequest<IReadOnlyList<ImagenDto>>;

public sealed class GetImagenesInmuebleQueryHandler
    : IRequestHandler<GetImagenesInmuebleQuery, IReadOnlyList<ImagenDto>>
{
    private readonly IImagenRepository _imagenes;

    public GetImagenesInmuebleQueryHandler(IImagenRepository imagenes) => _imagenes = imagenes;

    public Task<IReadOnlyList<ImagenDto>> Handle(
        GetImagenesInmuebleQuery request, CancellationToken ct)
        => _imagenes.GetPorInmuebleAsync(request.InmuebleId, ct);
}
