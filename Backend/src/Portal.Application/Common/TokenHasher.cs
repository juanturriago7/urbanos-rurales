using System.Security.Cryptography;
using System.Text;

namespace Portal.Application.Common;

/// <summary>
/// SHA-256 en hex para tokens opacos (refresh y reset de contraseña).
/// No usar para contraseñas: esas van con BCrypt (<see cref="Interfaces.IPasswordHasher"/>).
/// </summary>
public static class TokenHasher
{
    public static string Sha256(string token)
        => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
