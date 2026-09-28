using FluentValidation;
using MediatR;
using Portal.Application.Features.Visitas.DTOs;

namespace Portal.Application.Features.Visitas.Queries.GetDisponibilidadVisitas;

/// <summary>
/// Franjas ya ocupadas en la agenda para un día (GET /api/visitas/disponibilidad).
/// El frontend las oculta del selector para que nadie pida una hora ya tomada.
/// </summary>
/// <param name="Fecha">"yyyy-MM-dd" en hora de Colombia.</param>
public sealed record GetDisponibilidadVisitasQuery(string Fecha)
    : IRequest<DisponibilidadVisitasResponse>;

public sealed class GetDisponibilidadVisitasQueryValidator : AbstractValidator<GetDisponibilidadVisitasQuery>
{
    public GetDisponibilidadVisitasQueryValidator()
    {
        RuleFor(x => x.Fecha)
            .Must(f => DateOnly.TryParseExact(f, "yyyy-MM-dd", out _))
            .WithMessage("La fecha no tiene el formato yyyy-MM-dd.");
    }
}
