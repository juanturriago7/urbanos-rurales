using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Commands.MarcarDestacado;

public sealed class MarcarDestacadoCommandHandler
    : IRequestHandler<MarcarDestacadoCommand, Result>
{
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

        inmueble.MarcarDestacado(request.Destacado);
        await _inmuebles.UpdateAsync(inmueble, ct: ct);

        return Result.Success();
    }
}
