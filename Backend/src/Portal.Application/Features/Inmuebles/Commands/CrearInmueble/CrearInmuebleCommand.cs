using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Commands.CrearInmueble;

/// <summary>Crea un inmueble en borrador (RF-070). Devuelve el id creado.</summary>
public sealed record CrearInmuebleCommand : InmuebleDatosCommandBase, IRequest<Result<long>>
{
    public List<OperacionInput>? Operaciones { get; init; }

    /// <summary>Lo asigna el controller desde el JWT; no viene en el body.</summary>
    public long? CreadoPor { get; set; }
}

public sealed class CrearInmuebleCommandValidator
    : InmuebleDatosValidatorBase<CrearInmuebleCommand>
{
    private static readonly string[] TiposOperacionValidos = ["venta", "arriendo"];

    public CrearInmuebleCommandValidator()
    {
        RuleForEach(x => x.Operaciones)
            .ChildRules(o =>
            {
                o.RuleFor(x => x.TipoOperacion)
                    .Must(t => TiposOperacionValidos.Contains(t))
                    .WithMessage("Tipo de operación inválido (venta | arriendo).");
                o.RuleFor(x => x.Precio).GreaterThan(0);
                o.RuleFor(x => x.CuotaAdministracion)
                    .GreaterThanOrEqualTo(0)
                    .When(x => x.CuotaAdministracion is not null);
            })
            .When(x => x.Operaciones is not null);

        RuleFor(x => x.Operaciones)
            .Must(ops => ops!.Select(o => o.TipoOperacion).Distinct().Count() == ops!.Count)
            .When(x => x.Operaciones is not null && x.Operaciones.Count > 0)
            .WithMessage("No puede haber dos operaciones del mismo tipo (RF-076: una venta y/o un arriendo).");
    }
}
