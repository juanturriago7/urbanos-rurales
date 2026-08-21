using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Enums;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;

public sealed class ActualizarUbicacionCommandHandler : IRequestHandler<ActualizarUbicacionCommand, Result>
{
    private readonly IUbicacionAdminRepository _repo;

    public ActualizarUbicacionCommandHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarUbicacionCommand request, CancellationToken ct)
    {
        var ubicacion = await _repo.GetByIdAsync(request.Id, ct);
        if (ubicacion is null)
        {
            return Result.Failure("La ubicación no existe.");
        }

        // Toda ubicación que no sea de tipo 'zona' requiere un padre. El Tipo
        // es inmutable post-creación (no viaja en el Command), así que se lee
        // del propio agregado ya cargado, no del request.
        if (ubicacion.Tipo != TipoUbicacion.Zona && request.PadreId is null)
        {
            return Result.Failure("Toda ubicación que no sea de tipo 'zona' requiere un padre.");
        }

        // Anti-ciclo: si se está reubicando, el nuevo padre no puede ser
        // descendiente del propio nodo (ni el propio nodo).
        if (request.PadreId is not null)
        {
            if (request.PadreId == request.Id)
            {
                return Result.Failure("Una ubicación no puede ser padre de sí misma.");
            }

            if (await _repo.EsDescendienteAsync(request.PadreId.Value, request.Id, ct))
            {
                return Result.Failure("No se puede mover una ubicación dentro de su propio subárbol.");
            }
        }

        var slug = Common.SlugGenerator.Generar(request.Nombre);
        if (slug.Length > 140) slug = slug[..140].TrimEnd('-');

        if (await _repo.ExisteHermanoAsync(ubicacion.Tipo, slug, request.PadreId, excluirId: request.Id, ct))
        {
            return Result.Failure("Ya existe otra ubicación con ese nombre bajo el mismo padre.");
        }

        ubicacion.Renombrar(request.Nombre, slug);
        ubicacion.Reubicar(request.PadreId);

        if (!request.Activo && ubicacion.Activo)
        {
            var hijosActivos = await _repo.GetIdsHijosActivosAsync(request.Id, ct);
            if (hijosActivos.Count > 0 && !request.DesactivarHijos)
            {
                return Result.Failure(
                    "Esta ubicación tiene hijos activos. Vuelve a intentarlo confirmando " +
                    "'desactivarHijos' si quieres desactivarlos en cascada.");
            }

            if (request.DesactivarHijos)
            {
                await _repo.DesactivarConHijosAsync(request.Id, ct);
                return Result.Success();
            }

            ubicacion.Desactivar();
        }
        else if (request.Activo)
        {
            ubicacion.Activar();
        }

        await _repo.UpdateAsync(ubicacion, ct);
        return Result.Success();
    }
}
