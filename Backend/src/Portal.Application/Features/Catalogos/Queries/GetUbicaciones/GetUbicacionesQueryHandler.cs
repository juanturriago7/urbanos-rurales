using MediatR;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Queries.GetUbicaciones;

/// <summary>Arma el árbol zona → localidad → upz → barrio a partir de las filas planas.</summary>
public sealed class GetUbicacionesQueryHandler
    : IRequestHandler<GetUbicacionesQuery, IReadOnlyList<UbicacionNodoDto>>
{
    private readonly ICatalogoRepository _catalogos;

    public GetUbicacionesQueryHandler(ICatalogoRepository catalogos)
    {
        _catalogos = catalogos;
    }

    public async Task<IReadOnlyList<UbicacionNodoDto>> Handle(
        GetUbicacionesQuery request, CancellationToken ct)
    {
        var filas = await _catalogos.GetUbicacionesAsync(ct);

        var nodos = filas.ToDictionary(
            f => f.Id,
            f => new UbicacionNodoDto { Id = f.Id, Tipo = f.Tipo, Nombre = f.Nombre, Slug = f.Slug });

        var raices = new List<UbicacionNodoDto>();

        foreach (var fila in filas)
        {
            if (fila.PadreId is not null && nodos.TryGetValue(fila.PadreId.Value, out var padre))
            {
                padre.Hijos.Add(nodos[fila.Id]);
            }
            else
            {
                raices.Add(nodos[fila.Id]);
            }
        }

        return raices;
    }
}
