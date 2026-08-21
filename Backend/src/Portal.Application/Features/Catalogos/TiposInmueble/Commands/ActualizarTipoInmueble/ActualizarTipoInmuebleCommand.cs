using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.TiposInmueble.Commands.ActualizarTipoInmueble;

public sealed record ActualizarTipoInmuebleCommand(
    int Id, string Nombre, bool EsPropiedadHorizontal, bool Activo, short Orden = 0)
    : IRequest<Result>;

public sealed class ActualizarTipoInmuebleCommandValidator : AbstractValidator<ActualizarTipoInmuebleCommand>
{
    public ActualizarTipoInmuebleCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo((short)0);
    }
}
