using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Emite access tokens JWT firmados con la misma clave simétrica que valida
/// el middleware JwtBearer de Portal.Api (sección <c>Jwt</c> de appsettings).
/// </summary>
internal sealed class JwtTokenService : IJwtTokenService
{
    private readonly string _key;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiresInMinutes;
    private readonly int _refreshExpiresInDays;

    public JwtTokenService(IConfiguration configuration)
    {
        var jwt = configuration.GetSection("Jwt");

        _key = jwt["Key"] ?? throw new InvalidOperationException("JWT Key no configurada.");
        _issuer = jwt["Issuer"] ?? throw new InvalidOperationException("JWT Issuer no configurado.");
        _audience = jwt["Audience"] ?? throw new InvalidOperationException("JWT Audience no configurada.");
        _expiresInMinutes = int.TryParse(jwt["ExpiresInMinutes"], out var min) ? min : 60;
        _refreshExpiresInDays = int.TryParse(jwt["RefreshExpiresInDays"], out var dias) ? dias : 7;
    }

    public AccessTokenGenerado GenerarAccessToken(Usuario usuario)
    {
        var ahora = DateTime.UtcNow;
        var expira = ahora.AddMinutes(_expiresInMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim(JwtRegisteredClaimNames.Name, usuario.Nombre),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            // ClaimTypes.Role para que funcionen las policies RequireRole("Admin"/"Asesor")
            new Claim(ClaimTypes.Role, usuario.Rol.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            notBefore: ahora,
            expires: expira,
            signingCredentials: credentials);

        return new AccessTokenGenerado(
            new JwtSecurityTokenHandler().WriteToken(token),
            (int)TimeSpan.FromMinutes(_expiresInMinutes).TotalSeconds);
    }

    public RefreshTokenGenerado GenerarRefreshToken()
        => new(
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            DateTime.UtcNow.AddDays(_refreshExpiresInDays));
}
