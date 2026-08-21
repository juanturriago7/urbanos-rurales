using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Caracteristicas.Commands.CrearCategoria;

public sealed record CrearCategoriaCaracteristicaCommand(string Nombre, short Orden = 0)
    : IRequest<Result<int>>;

public sealed class CrearCategoriaCaracteristicaCommandValidator : AbstractValidator<CrearCategoriaCaracteristicaCommand>
{
    public CrearCategoriaCaracteristicaCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo((short)0);
    }
}

public sealed class CrearCategoriaCaracteristicaCommandHandler
    : IRequestHandler<CrearCategoriaCaracteristicaCommand, Result<int>>
{
    private readonly ICaracteristicaAdminRepository _repo;

    public CrearCategoriaCaracteristicaCommandHandler(ICaracteristicaAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<int>> Handle(CrearCategoriaCaracteristicaCommand request, CancellationToken ct)
    {
        if (await _repo.ExisteCategoriaNombreAsync(request.Nombre, excluirId: null, ct))
        {
            return Result.Failure<int>($"Ya existe una categoría de características llamada '{request.Nombre}'.");
        }
        var id = await _repo.CreateCategoriaAsync(request.Nombre.Trim(), request.Orden, ct);
        return Result.Success(id);
    }
}
