using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Commands.ActualizarInmueble;

public sealed class ActualizarInmuebleCommandHandler
    : IRequestHandler<ActualizarInmuebleCommand, Result>
{
    private readonly IInmuebleRepository _inmuebles;

    public ActualizarInmuebleCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result> Handle(ActualizarInmuebleCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.Id, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.Id} no encontrado.");
        }

        inmueble.ActualizarDatos(
            request.Titulo,
            request.Descripcion,
            request.TipoInmuebleId,
            request.UbicacionId,
            request.DireccionExacta,
            request.LatitudAproximada,
            request.LongitudAproximada,
            request.LatitudExacta,
            request.LongitudExacta,
            request.AreaConstruidaM2,
            request.AreaPrivadaM2,
            request.Habitaciones,
            request.Banos,
            request.Parqueaderos,
            request.Piso,
            request.PisosEdificio,
            request.Estrato,
            request.Antiguedad,
            request.Orientacion,
            ContratoEnums.ParsePoliticaMascotas(request.PoliticaMascotas),
            request.Amoblado,
            request.MatriculaInmobiliaria,
            request.MetaTitulo,
            request.MetaDescripcion,
            request.AsesorId);

        await _inmuebles.UpdateAsync(inmueble, request.Caracteristicas, ct);

        return Result.Success();
    }
}
