using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Puerto del repositorio de Usuarios (tabla <c>usuarios</c>).
/// Los Commands de escritura reciben/devuelven entidades de dominio.
/// Las Queries de lectura devuelven DTOs (ver IUsuarioQueryRepository si se separan).
/// </summary>
public interface IUsuarioRepository
{
    Task<Usuario?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<Usuario?> GetByCorreoAsync(string correo, CancellationToken ct = default);
    Task<Usuario?> GetByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken ct = default);
    Task<bool> ExisteCorreoAsync(string correo, CancellationToken ct = default);
    Task<long> CreateAsync(Usuario usuario, CancellationToken ct = default);
    Task UpdateAsync(Usuario usuario, CancellationToken ct = default);
}
