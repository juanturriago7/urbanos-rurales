using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>Hash de contraseñas con BCrypt (RNF-021). Work factor 11.</summary>
internal sealed class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    public string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);

    public bool Verify(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
