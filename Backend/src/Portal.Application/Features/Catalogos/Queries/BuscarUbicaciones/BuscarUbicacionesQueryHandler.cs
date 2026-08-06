using MediatR;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Queries.BuscarUbicaciones;

public sealed class BuscarUbicacionesQueryHandler
    : IRequestHandler<BuscarUbicacionesQuery, IReadOnlyList<UbicacionBusquedaDto>>
{
    private const int Limite = 10;

    private readonly ICatalogoRepository _catalogos;

    public BuscarUbicacionesQueryHandler(ICatalogoRepository catalogos)
    {
        _catalogos = catalogos;
    }

    public Task<IReadOnlyList<UbicacionBusquedaDto>> Handle(
        BuscarUbicacionesQuery request, CancellationToken ct)
        => _catalogos.BuscarUbicacionesAsync(request.Termino, Limite, ct);
}
