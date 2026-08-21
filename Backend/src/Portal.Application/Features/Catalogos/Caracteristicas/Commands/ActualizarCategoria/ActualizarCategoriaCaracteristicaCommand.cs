using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Caracteristicas.Commands.ActualizarCategoria;

public sealed record ActualizarCategoriaCaracteristicaCommand(
    int Id, string Nombre, short Orden, bool Activo)
    : IRequest<Result>;

public sealed class ActualizarCategoriaCaracteristicaCommandValidator : AbstractValidator<ActualizarCategoriaCaracteristicaCommand>
{
    public ActualizarCategoriaCaracteristicaCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo((short)0);
    }
}

public sealed class ActualizarCategoriaCaracteristicaCommandHandler
    : IRequestHandler<ActualizarCategoriaCaracteristicaCommand, Result>
{
    private readonly ICaracteristicaAdminRepository _repo;

    public ActualizarCategoriaCaracteristicaCommandHandler(ICaracteristicaAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarCategoriaCaracteristicaCommand request, CancellationToken ct)
    {
        if (await _repo.ExisteCategoriaNombreAsync(request.Nombre, request.Id, ct))
        {
            return Result.Failure($"Ya existe otra categoría de características llamada '{request.Nombre}'.");
        }
        await _repo.UpdateCategoriaAsync(request.Id, request.Nombre.Trim(), request.Orden, request.Activo, ct);
        return Result.Success();
    }
}
