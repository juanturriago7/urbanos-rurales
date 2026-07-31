using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Auth.Commands.RestablecerPassword;

/// <summary>
/// Valida el token de un solo uso, cambia la contraseña (BCrypt) y revoca la
/// sesión activa (refresh token) para forzar un nuevo login.
/// </summary>
public sealed class RestablecerPasswordCommandHandler
    : IRequestHandler<RestablecerPasswordCommand, Result>
{
    private const string TokenInvalido = "Token inválido o expirado.";

    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordResetTokenRepository _resetTokens;
    private readonly IPasswordHasher _passwordHasher;

    public RestablecerPasswordCommandHandler(
        IUsuarioRepository usuarios,
        IPasswordResetTokenRepository resetTokens,
        IPasswordHasher passwordHasher)
    {
        _usuarios = usuarios;
        _resetTokens = resetTokens;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result> Handle(RestablecerPasswordCommand request, CancellationToken ct)
    {
        var tokenHash = TokenHasher.Sha256(request.Token);
        var usuarioId = await _resetTokens.GetUsuarioIdPorTokenValidoAsync(tokenHash, ct);

        if (usuarioId is null)
        {
            return Result.Failure(TokenInvalido);
        }

        var usuario = await _usuarios.GetByIdAsync(usuarioId.Value, ct);

        if (usuario is null || !usuario.Activo)
        {
            return Result.Failure(TokenInvalido);
        }

        usuario.CambiarPassword(_passwordHasher.Hash(request.NuevaPassword));
        usuario.RevocarRefreshToken();

        await _usuarios.UpdateAsync(usuario, ct);
        await _resetTokens.MarcarUsadoAsync(tokenHash, ct);

        return Result.Success();
    }
}
