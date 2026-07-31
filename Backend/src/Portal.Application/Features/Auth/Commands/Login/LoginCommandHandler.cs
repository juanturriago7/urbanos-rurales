using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Auth.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Auth.Commands.Login;

/// <summary>
/// Valida credenciales con BCrypt, aplica bloqueo por intentos fallidos (RF-063)
/// y emite access + refresh token. Los mensajes de fallo son genéricos para no
/// revelar si el correo existe.
/// </summary>
public sealed class LoginCommandHandler
    : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    private const string CredencialesInvalidas = "Credenciales inválidas.";

    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginCommandHandler(
        IUsuarioRepository usuarios,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _usuarios = usuarios;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Result<LoginResponseDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var usuario = await _usuarios.GetByCorreoAsync(request.Email, ct);

        if (usuario is null)
        {
            return Result.Failure<LoginResponseDto>(CredencialesInvalidas);
        }

        if (usuario.EstaBloqueado())
        {
            return Result.Failure<LoginResponseDto>(
                "Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo más tarde.");
        }

        if (!usuario.Activo)
        {
            return Result.Failure<LoginResponseDto>(CredencialesInvalidas);
        }

        if (!_passwordHasher.Verify(request.Password, usuario.PasswordHash))
        {
            usuario.RegistrarIntentoFallido();
            await _usuarios.UpdateAsync(usuario, ct);
            return Result.Failure<LoginResponseDto>(CredencialesInvalidas);
        }

        usuario.RegistrarAccesoExitoso();

        var access = _jwtTokenService.GenerarAccessToken(usuario);
        var refresh = _jwtTokenService.GenerarRefreshToken();
        usuario.AsignarRefreshToken(TokenHasher.Sha256(refresh.Token), refresh.ExpiraEnUtc);

        await _usuarios.UpdateAsync(usuario, ct);

        return Result.Success(new LoginResponseDto(
            new AuthUserDto(usuario.Id, usuario.Correo, usuario.Nombre, usuario.Rol.ToString()),
            new AuthTokensDto(access.Token, refresh.Token, access.ExpiraEnSegundos)));
    }
}
