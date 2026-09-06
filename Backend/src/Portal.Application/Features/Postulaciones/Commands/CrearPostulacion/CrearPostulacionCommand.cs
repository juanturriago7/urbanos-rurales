using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Postulaciones.Commands.CrearPostulacion;

public sealed record CrearPostulacionCommand(
    string Nombre, string Correo, string? Telefono, string? CargoInteres,
    string? Mensaje, string CvStorageKey, string? IpOrigen)
    : IRequest<Result<long>>;

public sealed class CrearPostulacionCommandValidator : AbstractValidator<CrearPostulacionCommand>
{
    public CrearPostulacionCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Correo).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Telefono).MaximumLength(30);
        RuleFor(x => x.CargoInteres).MaximumLength(120);
        RuleFor(x => x.CvStorageKey).NotEmpty();
    }
}
