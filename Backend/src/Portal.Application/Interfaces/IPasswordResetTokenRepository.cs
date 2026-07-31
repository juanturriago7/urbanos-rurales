namespace Portal.Application.Interfaces;

/// <summary>
/// Tokens de recuperación de contraseña de un solo uso (RF-062,
/// tabla <c>password_reset_tokens</c>). Siempre se persiste el hash, nunca el token plano.
/// </summary>
public interface IPasswordResetTokenRepository
{
    Task CreateAsync(long usuarioId, string tokenHash, DateTime expiraEn, CancellationToken ct = default);

    /// <summary>Devuelve el usuario dueño del token si está vigente y sin usar; si no, null.</summary>
    Task<long?> GetUsuarioIdPorTokenValidoAsync(string tokenHash, CancellationToken ct = default);

    /// <summary>Marca el token como usado (un solo uso).</summary>
    Task MarcarUsadoAsync(string tokenHash, CancellationToken ct = default);

    /// <summary>Invalida los tokens pendientes de un usuario (al emitir uno nuevo).</summary>
    Task InvalidarPendientesAsync(long usuarioId, CancellationToken ct = default);
}
