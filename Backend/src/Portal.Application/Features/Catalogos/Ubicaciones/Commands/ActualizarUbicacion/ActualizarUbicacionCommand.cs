using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;

public sealed record ActualizarUbicacionCommand(
    long Id, string Nombre, long? PadreId, bool Activo, bool DesactivarHijos = false)
    : IRequest<Result>;

public sealed class ActualizarUbicacionCommandValidator : AbstractValidator<ActualizarUbicacionCommand>
{
    public ActualizarUbicacionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PadreId).GreaterThan(0).When(x => x.PadreId is not null);
    }
}
