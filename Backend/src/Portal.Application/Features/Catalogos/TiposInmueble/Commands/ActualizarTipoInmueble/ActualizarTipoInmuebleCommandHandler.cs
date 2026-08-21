using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.TiposInmueble.Commands.ActualizarTipoInmueble;

public sealed class ActualizarTipoInmuebleCommandHandler
    : IRequestHandler<ActualizarTipoInmuebleCommand, Result>
{
    private readonly ITipoInmuebleAdminRepository _repo;

    public ActualizarTipoInmuebleCommandHandler(ITipoInmuebleAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarTipoInmuebleCommand request, CancellationToken ct)
    {
        var tipo = await _repo.GetByIdAsync(request.Id, ct);
        if (tipo is null)
        {
            return Result.Failure("El tipo de inmueble no existe.");
        }

        // Si cambia el nombre, regenerar slug y validar unicidad contra otros tipos.
        if (!string.Equals(tipo.Nombre, request.Nombre, StringComparison.Ordinal))
        {
            var nuevoSlug = SlugGenerator.Generar(request.Nombre);
            if (nuevoSlug.Length > 70) nuevoSlug = nuevoSlug[..70].TrimEnd('-');
            if (await _repo.ExisteSlugAsync(nuevoSlug, request.Id, ct))
            {
                return Result.Failure($"Ya existe otro tipo de inmueble con un nombre equivalente a '{request.Nombre}'.");
            }
        }

        tipo.Actualizar(request.Nombre, request.Orden, request.EsPropiedadHorizontal);
        if (request.Activo) tipo.Activar(); else tipo.Desactivar();

        await _repo.UpdateAsync(tipo, ct);
        return Result.Success();
    }
}
