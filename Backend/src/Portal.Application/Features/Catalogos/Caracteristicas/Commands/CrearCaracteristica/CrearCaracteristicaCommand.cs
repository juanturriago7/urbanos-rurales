using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Catalogos.Caracteristicas.Commands.CrearCaracteristica;

public sealed record CrearCaracteristicaCommand(
    int CategoriaId,
    string Nombre,
    string TipoValor = Caracteristica.TiposValor.Booleano,
    bool Filtrable = true,
    string? Icono = null)
    : IRequest<Result<int>>;

public sealed class CrearCaracteristicaCommandValidator : AbstractValidator<CrearCaracteristicaCommand>
{
    public CrearCaracteristicaCommandValidator()
    {
        RuleFor(x => x.CategoriaId).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TipoValor)
            .Must(Caracteristica.TiposValor.EsValido)
            .WithMessage("Tipo de valor inválido (booleano | numero | texto).");
    }
}

public sealed class CrearCaracteristicaCommandHandler
    : IRequestHandler<CrearCaracteristicaCommand, Result<int>>
{
    private readonly ICaracteristicaAdminRepository _repo;

    public CrearCaracteristicaCommandHandler(ICaracteristicaAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<int>> Handle(CrearCaracteristicaCommand request, CancellationToken ct)
    {
        if (await _repo.ExisteNombreEnCategoriaAsync(request.Nombre, request.CategoriaId, excluirId: null, ct))
        {
            return Result.Failure<int>(
                $"Ya existe una característica llamada '{request.Nombre}' en esa categoría.");
        }

        var caract = Caracteristica.Create(
            request.CategoriaId,
            request.Nombre,
            request.TipoValor,
            request.Filtrable,
            request.Icono);

        var id = await _repo.CreateAsync(caract, ct);
        return Result.Success(id);
    }
}
