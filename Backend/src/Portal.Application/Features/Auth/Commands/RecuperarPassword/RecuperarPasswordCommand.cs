using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Auth.Commands.RecuperarPassword;

/// <summary>Solicita un token de recuperación de contraseña (RF-062).</summary>
public sealed record RecuperarPasswordCommand(string Email) : IRequest<Result>;

public sealed class RecuperarPasswordCommandValidator : AbstractValidator<RecuperarPasswordCommand>
{
    public RecuperarPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
    }
}
