using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.DesactivarUbicacion;

public sealed record DesactivarUbicacionCommand(long Id) : IRequest<Result>;

public sealed class DesactivarUbicacionCommandValidator : AbstractValidator<DesactivarUbicacionCommand>
{
    public DesactivarUbicacionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
    }
}
