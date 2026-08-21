using MediatR;
using Portal.Application.Features.Catalogos.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Queries.GetUbicacionesAdmin;

public sealed class GetUbicacionesAdminQueryHandler
    : IRequestHandler<GetUbicacionesAdminQuery, IReadOnlyList<UbicacionNodoDto>>
{
    private readonly IUbicacionAdminRepository _repo;

    public GetUbicacionesAdminQueryHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<IReadOnlyList<UbicacionNodoDto>> Handle(
        GetUbicacionesAdminQuery request, CancellationToken ct)
    {
        var filas = await _repo.GetAllNoBarrioAsync(ct);

        var nodos = filas.ToDictionary(
            f => f.Id,
            f => new UbicacionNodoDto
            {
                Id = f.Id,
                Tipo = f.Tipo,
                Nombre = f.Nombre,
                Slug = f.Slug,
                PadreId = f.PadreId,
                Activo = f.Activo,
            });

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
