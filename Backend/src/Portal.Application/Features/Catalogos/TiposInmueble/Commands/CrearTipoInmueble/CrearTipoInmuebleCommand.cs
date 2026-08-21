using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.TiposInmueble.Commands.CrearTipoInmueble;

public sealed record CrearTipoInmuebleCommand(
    string Nombre, bool EsPropiedadHorizontal, short Orden = 0)
    : IRequest<Result<int>>;

public sealed class CrearTipoInmuebleCommandValidator : AbstractValidator<CrearTipoInmuebleCommand>
{
    public CrearTipoInmuebleCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo((short)0);
    }
}
