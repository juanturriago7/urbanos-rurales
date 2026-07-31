namespace Portal.Application.Interfaces;

/// <summary>
/// Hash de contraseñas (RNF-021). Implementación con BCrypt en Infrastructure.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string hash);
}
