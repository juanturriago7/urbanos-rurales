using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.DesactivarUbicacion;

public sealed class DesactivarUbicacionCommandHandler : IRequestHandler<DesactivarUbicacionCommand, Result>
{
    private readonly IUbicacionAdminRepository _repo;

    public DesactivarUbicacionCommandHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(DesactivarUbicacionCommand request, CancellationToken ct)
    {
        var ubicacion = await _repo.GetByIdAsync(request.Id, ct);
        if (ubicacion is null)
        {
            return Result.Failure("La ubicación no existe.");
        }

        // Soft-delete en cascada (nodo + todo el subárbol) en una sola
        // sentencia recursiva dentro de una transacción. Nunca DELETE físico:
        // inmuebles.ubicacion_id referencia esta tabla con OnDelete(Restrict).
        await _repo.DesactivarConHijosAsync(request.Id, ct);

        return Result.Success();
    }
}
