using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Auth.DTOs;

namespace Portal.Application.Features.Auth.Commands.Login;

/// <summary>Login del panel admin (POST /api/auth/login).</summary>
public sealed record LoginCommand(string Email, string Password)
    : IRequest<Result<LoginResponseDto>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(200);
    }
}
