using MediatR;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Queries.GetTiposInmueble;

public sealed class GetTiposInmuebleQueryHandler
    : IRequestHandler<GetTiposInmuebleQuery, IReadOnlyList<TipoInmuebleDto>>
{
    private readonly ICatalogoRepository _catalogos;

    public GetTiposInmuebleQueryHandler(ICatalogoRepository catalogos)
    {
        _catalogos = catalogos;
    }

    public Task<IReadOnlyList<TipoInmuebleDto>> Handle(
        GetTiposInmuebleQuery request, CancellationToken ct)
        => _catalogos.GetTiposInmuebleAsync(ct);
}
