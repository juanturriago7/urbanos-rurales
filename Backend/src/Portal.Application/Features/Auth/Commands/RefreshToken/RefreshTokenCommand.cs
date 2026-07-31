using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Auth.DTOs;

namespace Portal.Application.Features.Auth.Commands.RefreshToken;

/// <summary>Rotación de tokens (POST /api/auth/refresh).</summary>
public sealed record RefreshTokenCommand(string RefreshToken)
    : IRequest<Result<AuthTokensDto>>;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
