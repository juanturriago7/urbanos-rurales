using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Emisión de tokens JWT + refresh tokens opacos.
/// La validación del access token la hace el middleware JwtBearer en Portal.Api.
/// </summary>
public interface IJwtTokenService
{
    AccessTokenGenerado GenerarAccessToken(Usuario usuario);

    /// <summary>Refresh token opaco (aleatorio criptográfico); se persiste solo su hash.</summary>
    RefreshTokenGenerado GenerarRefreshToken();
}

public sealed record AccessTokenGenerado(string Token, int ExpiraEnSegundos);

public sealed record RefreshTokenGenerado(string Token, DateTime ExpiraEnUtc);
