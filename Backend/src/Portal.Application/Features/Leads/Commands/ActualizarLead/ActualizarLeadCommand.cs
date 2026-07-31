using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Leads.Commands.ActualizarLead;

/// <summary>Gestión admin del lead: cambio de estado y/o asignación a un asesor.</summary>
public sealed record ActualizarLeadCommand(
    string? Estado,                 // 'nuevo' | 'contactado' | 'descartado' | 'cerrado'
    long? AsignadoA) : IRequest<Result>
{
    /// <summary>Lo asigna el controller desde la ruta; no viene en el body.</summary>
    public long Id { get; set; }
}

public sealed class ActualizarLeadCommandValidator : AbstractValidator<ActualizarLeadCommand>
{
    private static readonly string[] EstadosValidos =
        ["nuevo", "contactado", "descartado", "cerrado"];

    public ActualizarLeadCommandValidator()
    {
        RuleFor(x => x.Estado)
            .Must(e => e is null || EstadosValidos.Contains(e))
            .WithMessage("Estado inválido (nuevo | contactado | descartado | cerrado).");
        RuleFor(x => x)
            .Must(x => x.Estado is not null || x.AsignadoA is not null)
            .WithMessage("Debe indicar estado y/o asignación.");
    }
}
