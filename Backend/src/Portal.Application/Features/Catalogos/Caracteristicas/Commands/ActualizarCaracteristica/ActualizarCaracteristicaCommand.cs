using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Catalogos.Caracteristicas.Commands.ActualizarCaracteristica;

public sealed record ActualizarCaracteristicaCommand(
    int Id,
    string Nombre,
    string TipoValor = Caracteristica.TiposValor.Booleano,
    bool Filtrable = true,
    string? Icono = null,
    bool Activo = true)
    : IRequest<Result>;

public sealed class ActualizarCaracteristicaCommandValidator : AbstractValidator<ActualizarCaracteristicaCommand>
{
    public ActualizarCaracteristicaCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TipoValor)
            .Must(Caracteristica.TiposValor.EsValido)
            .WithMessage("Tipo de valor inválido (booleano | numero | texto).");
    }
}

public sealed class ActualizarCaracteristicaCommandHandler
    : IRequestHandler<ActualizarCaracteristicaCommand, Result>
{
    private readonly ICaracteristicaAdminRepository _repo;

    public ActualizarCaracteristicaCommandHandler(ICaracteristicaAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarCaracteristicaCommand request, CancellationToken ct)
    {
        var actual = await _repo.GetByIdAsync(request.Id, ct);
        if (actual is null)
        {
            return Result.Failure("La característica no existe.");
        }

        if (await _repo.ExisteNombreEnCategoriaAsync(request.Nombre, actual.CategoriaId, request.Id, ct))
        {
            return Result.Failure(
                $"Ya existe otra característica llamada '{request.Nombre}' en esta categoría.");
        }

        actual.Actualizar(request.Nombre, request.TipoValor, request.Filtrable, request.Icono);
        if (request.Activo) actual.Activar(); else actual.Desactivar();

        await _repo.UpdateAsync(actual, ct);
        return Result.Success();
    }
}
