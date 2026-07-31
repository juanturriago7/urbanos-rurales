using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Portal.Api.Contracts;

/// <summary>Lectura tipada de claims del JWT emitido por JwtTokenService.</summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>Id del usuario autenticado (claim <c>sub</c>), o null si no es parseable.</summary>
    public static long? GetUsuarioId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return long.TryParse(sub, out var id) ? id : null;
    }
}
