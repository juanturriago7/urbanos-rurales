using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Inmuebles.Commands.UpsertOperacion;

/// <summary>
/// Crea o actualiza la operación de venta o arriendo de un inmueble
/// (RF-076: precios y estados independientes por tipo).
/// </summary>
public sealed record UpsertOperacionCommand(
    string TipoOperacion,           // 'venta' | 'arriendo'
    decimal Precio,
    decimal? CuotaAdministracion,
    bool AdminIncluida,
    string? Estado,                 // 'disponible' | 'reservado' | 'cerrado' (default al crear: disponible)
    bool? Activo) : IRequest<Result<long>>
{
    /// <summary>Lo asigna el controller desde la ruta; no viene en el body.</summary>
    public long InmuebleId { get; set; }
}

public sealed class UpsertOperacionCommandValidator : AbstractValidator<UpsertOperacionCommand>
{
    private static readonly string[] TiposValidos = ["venta", "arriendo"];
    private static readonly string[] EstadosValidos = ["disponible", "reservado", "cerrado"];

    public UpsertOperacionCommandValidator()
    {
        RuleFor(x => x.TipoOperacion)
            .Must(t => TiposValidos.Contains(t))
            .WithMessage("Tipo de operación inválido (venta | arriendo).");
        RuleFor(x => x.Precio).GreaterThan(0);
        RuleFor(x => x.CuotaAdministracion)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CuotaAdministracion is not null);
        RuleFor(x => x.Estado)
            .Must(e => e is null || EstadosValidos.Contains(e))
            .WithMessage("Estado inválido (disponible | reservado | cerrado).");
    }
}
