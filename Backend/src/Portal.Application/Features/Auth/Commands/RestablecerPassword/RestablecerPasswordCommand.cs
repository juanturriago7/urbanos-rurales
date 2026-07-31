using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Auth.Commands.RestablecerPassword;

/// <summary>Consume el token de recuperación y fija la nueva contraseña (RF-062).</summary>
public sealed record RestablecerPasswordCommand(string Token, string NuevaPassword) : IRequest<Result>;

public sealed class RestablecerPasswordCommandValidator
    : AbstractValidator<RestablecerPasswordCommand>
{
    public RestablecerPasswordCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NuevaPassword)
            .NotEmpty()
            .MinimumLength(8).WithMessage("La contraseña debe tener al menos 8 caracteres.")
            .MaximumLength(200)
            .Matches("[A-Z]").WithMessage("La contraseña debe incluir al menos una mayúscula.")
            .Matches("[0-9]").WithMessage("La contraseña debe incluir al menos un número.");
    }
}
