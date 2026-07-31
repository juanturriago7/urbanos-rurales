using MediatR;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Queries.GetCaracteristicas;

public sealed class GetCaracteristicasQueryHandler
    : IRequestHandler<GetCaracteristicasQuery, IReadOnlyList<CategoriaCaracteristicasDto>>
{
    private readonly ICatalogoRepository _catalogos;

    public GetCaracteristicasQueryHandler(ICatalogoRepository catalogos)
    {
        _catalogos = catalogos;
    }

    public async Task<IReadOnlyList<CategoriaCaracteristicasDto>> Handle(
        GetCaracteristicasQuery request, CancellationToken ct)
    {
        var filas = await _catalogos.GetCaracteristicasAsync(ct);

        return filas
            .GroupBy(f => (f.CategoriaId, f.CategoriaNombre))
            .Select(g => new CategoriaCaracteristicasDto(
                g.Key.CategoriaId,
                g.Key.CategoriaNombre,
                g.Select(f => new CaracteristicaDto(f.Id, f.Nombre, f.Icono, f.TipoValor, f.Filtrable))
                 .ToList()))
            .ToList();
    }
}
