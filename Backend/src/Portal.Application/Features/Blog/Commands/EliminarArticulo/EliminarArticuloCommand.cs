using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Blog.Commands.EliminarArticulo;

/// <summary>Borrado físico — un artículo de blog no tiene el peso legal de un inmueble.</summary>
public sealed record EliminarArticuloCommand(long Id) : IRequest<Result>;

public sealed class EliminarArticuloCommandHandler
    : IRequestHandler<EliminarArticuloCommand, Result>
{
    private readonly IArticuloBlogRepository _repo;

    public EliminarArticuloCommandHandler(IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(EliminarArticuloCommand request, CancellationToken ct)
    {
        var a = await _repo.GetByIdAsync(request.Id, ct);
        if (a is null) return Result.Failure("El artículo no existe.");
        await _repo.DeleteAsync(request.Id, ct);
        return Result.Success();
    }
}
