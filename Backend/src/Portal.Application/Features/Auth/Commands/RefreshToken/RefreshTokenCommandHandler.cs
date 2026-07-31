using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Auth.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Auth.Commands.RefreshToken;

/// <summary>
/// Valida el refresh token contra su hash persistido y lo rota:
/// cada refresh invalida el token anterior (sesión única por usuario).
/// </summary>
public sealed class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, Result<AuthTokensDto>>
{
    private const string TokenInvalido = "Refresh token inválido o expirado.";

    private readonly IUsuarioRepository _usuarios;
    private readonly IJwtTokenService _jwtTokenService;

    public RefreshTokenCommandHandler(IUsuarioRepository usuarios, IJwtTokenService jwtTokenService)
    {
        _usuarios = usuarios;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Result<AuthTokensDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var hash = TokenHasher.Sha256(request.RefreshToken);
        var usuario = await _usuarios.GetByRefreshTokenHashAsync(hash, ct);

        if (usuario is null || !usuario.RefreshTokenEsValido(hash) || !usuario.PuedeAutenticarse())
        {
            return Result.Failure<AuthTokensDto>(TokenInvalido);
        }

        var access = _jwtTokenService.GenerarAccessToken(usuario);
        var refresh = _jwtTokenService.GenerarRefreshToken();
        usuario.AsignarRefreshToken(TokenHasher.Sha256(refresh.Token), refresh.ExpiraEnUtc);

        await _usuarios.UpdateAsync(usuario, ct);

        return Result.Success(new AuthTokensDto(access.Token, refresh.Token, access.ExpiraEnSegundos));
    }
}
