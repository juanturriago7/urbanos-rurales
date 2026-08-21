using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;

public sealed class CrearUbicacionCommandHandler : IRequestHandler<CrearUbicacionCommand, Result<long>>
{
    private readonly IUbicacionAdminRepository _repo;

    public CrearUbicacionCommandHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<long>> Handle(CrearUbicacionCommand request, CancellationToken ct)
    {
        var tipo = Enum.Parse<TipoUbicacion>(request.Tipo, ignoreCase: true);
        var slug = SlugGenerator.Generar(request.Nombre);
        if (slug.Length > 140) slug = slug[..140].TrimEnd('-'); // límite de la columna (VARCHAR(140))

        if (await _repo.ExisteHermanoAsync(tipo, slug, request.PadreId, excluirId: null, ct))
        {
            return Result.Failure<long>(
                $"Ya existe una ubicación de tipo '{request.Tipo}' con ese nombre bajo el mismo padre.");
        }

        var ubicacion = Ubicacion.Create(tipo, request.Nombre, slug, request.PadreId);
        var id = await _repo.CreateAsync(ubicacion, ct);
        return Result.Success(id);
    }
}
