using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Leads.Commands.CrearLead;

/// <summary>
/// Captura pública de lead (POST /api/leads), general o por inmueble (RF-003).
/// <see cref="Sitio"/> es un honeypot: los humanos no lo ven, los bots lo llenan.
/// </summary>
public sealed record CrearLeadCommand(
    long? InmuebleId,
    string Nombre,
    string? Correo,
    string? Telefono,
    string? Mensaje,
    string Origen,                  // 'formulario_inmueble' | 'formulario_general' | 'whatsapp'
    string? UtmSource,
    string? UtmCampaign,
    bool AceptoTratamientoDatos,
    string? Sitio) : IRequest<Result<long>>
{
    /// <summary>La asigna el controller desde la conexión; no viene en el body.</summary>
    public string? IpOrigen { get; set; }
}

public sealed class CrearLeadCommandValidator : AbstractValidator<CrearLeadCommand>
{
    private static readonly string[] OrigenesValidos =
        ["formulario_inmueble", "formulario_general", "whatsapp"];

    public CrearLeadCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Correo).EmailAddress().MaximumLength(150)
            .When(x => !string.IsNullOrWhiteSpace(x.Correo));
        RuleFor(x => x.Telefono).MaximumLength(30);
        RuleFor(x => x.Mensaje).MaximumLength(4_000);
        RuleFor(x => x.Origen)
            .Must(o => OrigenesValidos.Contains(o))
            .WithMessage("Origen inválido (formulario_inmueble | formulario_general | whatsapp).");
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Correo) || !string.IsNullOrWhiteSpace(x.Telefono))
            .WithMessage("Debe indicar al menos correo o teléfono.");
        RuleFor(x => x.AceptoTratamientoDatos)
            .Equal(true)
            .WithMessage("Debe aceptar el tratamiento de datos personales (RNF-061).");
    }
}
