using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Catalogos.TiposInmueble.Commands.CrearTipoInmueble;

public sealed class CrearTipoInmuebleCommandHandler
    : IRequestHandler<CrearTipoInmuebleCommand, Result<int>>
{
    private readonly ITipoInmuebleAdminRepository _repo;

    public CrearTipoInmuebleCommandHandler(ITipoInmuebleAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<int>> Handle(CrearTipoInmuebleCommand request, CancellationToken ct)
    {
        var slug = SlugGenerator.Generar(request.Nombre);
        if (slug.Length > 70) slug = slug[..70].TrimEnd('-');

        if (await _repo.ExisteSlugAsync(slug, excluirId: null, ct))
        {
            return Result.Failure<int>($"Ya existe un tipo de inmueble con un nombre equivalente a '{request.Nombre}'.");
        }

        var tipo = TipoInmueble.Create(request.Nombre, slug, request.EsPropiedadHorizontal, request.Orden);
        var id = await _repo.CreateAsync(tipo, ct);
        return Result.Success(id);
    }
}
