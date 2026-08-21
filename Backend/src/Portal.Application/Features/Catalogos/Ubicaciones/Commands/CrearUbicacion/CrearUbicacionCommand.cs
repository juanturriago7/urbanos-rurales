using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;

public sealed record CrearUbicacionCommand(string Tipo, string Nombre, long? PadreId)
    : IRequest<Result<long>>;

public sealed class CrearUbicacionCommandValidator : AbstractValidator<CrearUbicacionCommand>
{
    private static readonly string[] TiposValidos = ["zona", "localidad", "upz", "barrio"];

    public CrearUbicacionCommandValidator()
    {
        RuleFor(x => x.Tipo)
            .Must(t => TiposValidos.Contains(t))
            .WithMessage("Tipo inválido (zona | localidad | upz | barrio).");
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PadreId).GreaterThan(0).When(x => x.PadreId is not null);
        // Regla de negocio "zona no lleva padre / el resto sí" vive en el dominio
        // (Ubicacion.Create la valida), pero se repite aquí para devolver 400 en
        // vez de dejar que el ArgumentException del dominio escale a 500 —
        // ErrorHandlingMiddleware no mapea ArgumentException.
        RuleFor(x => x.PadreId)
            .NotNull()
            .When(x => x.Tipo != "zona")
            .WithMessage("Toda ubicación que no sea de tipo 'zona' requiere un padre.");
    }
}
