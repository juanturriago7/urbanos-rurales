using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Enums;

namespace Portal.Application.Features.Inmuebles.Commands.CambiarEstadoInmueble;

/// <summary>
/// RF-077: no se puede publicar sin campos obligatorios, al menos una imagen
/// y al menos una operación activa (precio).
/// </summary>
public sealed class CambiarEstadoInmuebleCommandHandler
    : IRequestHandler<CambiarEstadoInmuebleCommand, Result>
{
    private readonly IInmuebleRepository _inmuebles;

    public CambiarEstadoInmuebleCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result> Handle(CambiarEstadoInmuebleCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.Id, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.Id} no encontrado.");
        }

        var nuevoEstado = ContratoEnums.ParseEstadoInmueble(request.Estado);

        if (nuevoEstado == EstadoInmueble.Publicado)
        {
            var faltantes = new List<string>();

            if (!inmueble.TieneCamposObligatoriosParaPublicar())
            {
                faltantes.Add("campos obligatorios incompletos (título, descripción, tipo, ubicación, dirección)");
            }

            if (await _inmuebles.ContarImagenesAsync(request.Id, ct) == 0)
            {
                faltantes.Add("al menos una imagen");
            }

            if (!await _inmuebles.TieneOperacionActivaAsync(request.Id, ct))
            {
                faltantes.Add("al menos una operación activa con precio (venta o arriendo)");
            }

            if (faltantes.Count > 0)
            {
                return Result.Failure(
                    $"No se puede publicar (RF-077). Falta: {string.Join("; ", faltantes)}.");
            }
        }

        inmueble.CambiarEstado(nuevoEstado);
        await _inmuebles.UpdateAsync(inmueble, ct: ct);

        return Result.Success();
    }
}
