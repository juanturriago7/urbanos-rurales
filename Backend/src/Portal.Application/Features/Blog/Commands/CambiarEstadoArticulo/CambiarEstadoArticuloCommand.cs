using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Enums;

namespace Portal.Application.Features.Blog.Commands.CambiarEstadoArticulo;

public sealed record CambiarEstadoArticuloCommand(long Id, EstadoArticuloBlog NuevoEstado)
    : IRequest<Result>;

public sealed class CambiarEstadoArticuloCommandHandler
    : IRequestHandler<CambiarEstadoArticuloCommand, Result>
{
    private readonly IArticuloBlogRepository _repo;

    public CambiarEstadoArticuloCommandHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(CambiarEstadoArticuloCommand request, CancellationToken ct)
    {
        var articulo = await _repo.GetByIdAsync(request.Id, ct);
        if (articulo is null) return Result.Failure("El artículo no existe.");

        articulo.CambiarEstado(request.NuevoEstado);
        await _repo.UpdateAsync(articulo, ct);
        return Result.Success();
    }
}
