using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Commands.EliminarInmueble;

public sealed class EliminarInmuebleCommandHandler
    : IRequestHandler<EliminarInmuebleCommand, Result>
{
    private readonly IInmuebleRepository _inmuebles;

    public EliminarInmuebleCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result> Handle(EliminarInmuebleCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.Id, ct);

        if (inmueble is null)
        {
            throw new KeyNotFoundException($"Inmueble {request.Id} no encontrado.");
        }

        if (inmueble.EstaEliminado)
        {
            return Result.Success(); // Idempotente
        }

        inmueble.EliminarLogico();
        await _inmuebles.UpdateAsync(inmueble, ct: ct);

        return Result.Success();
    }
}
