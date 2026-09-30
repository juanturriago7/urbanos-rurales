using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Inmuebles.Commands.MarcarDestacado;

/// <summary>
/// RF-078: marca o desmarca un destacado. Como máximo hay
/// <see cref="Inmueble.MaximoDestacados"/> a la vez, y solo pueden destacarse
/// inmuebles publicados.
/// </summary>
public sealed class MarcarDestacadoCommandHandler
    : IRequestHandler<MarcarDestacadoCommand, Result>
{
    public static readonly string MensajeSinCupo =
        $"Máximo {Inmueble.MaximoDestacados} inmuebles destacados. Quita uno para destacar otro.";

    public const string MensajeNoPublicado = "Solo los inmuebles publicados pueden destacarse.";

    private readonly IInmuebleRepository _inmuebles;

    public MarcarDestacadoCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result> Handle(MarcarDestacadoCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.Id, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.Id} no encontrado.");
        }

        // Quitar el destacado siempre se permite: es la forma de liberar cupo.
        // Se usa un UPDATE dirigido (QuitarDestacadoAsync), no el UpdateAsync de
        // fila completa con la entidad leída al inicio del request: ese UPDATE
        // general podría resucitar un eliminado_en/estado que un
        // EliminarInmueble/CambiarEstado concurrente ya haya escrito.
        if (!request.Destacado)
        {
            if (inmueble.Destacado)
            {
                await _inmuebles.QuitarDestacadoAsync(request.Id, ct);
            }

            return Result.Success();
        }

        if (!inmueble.PuedeDestacarse)
        {
            return Result.Failure(MensajeNoPublicado);
        }

        if (inmueble.Destacado)
        {
            return Result.Success(); // Idempotente: ya ocupa su cupo
        }

        var resultado = await _inmuebles.DestacarConCupoAsync(
            request.Id, Inmueble.MaximoDestacados, ct);

        return resultado switch
        {
            ResultadoDestacar.Destacado => Result.Success(),
            ResultadoDestacar.SinCupo => Result.Failure(MensajeSinCupo),
            _ => Result.Failure(MensajeNoPublicado),
        };
    }
}
