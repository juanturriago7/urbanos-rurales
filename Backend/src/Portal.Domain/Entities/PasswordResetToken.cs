namespace Portal.Domain.Entities;

/// <summary>
/// Token de recuperación de contraseña de un solo uso (RF-062),
/// tabla <c>password_reset_tokens</c>.
/// Solo se persiste el hash; el token en claro únicamente viaja por correo.
/// </summary>
public sealed class PasswordResetToken
{
    public long Id { get; private set; }
    public long UsuarioId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTime ExpiraEn { get; private set; }
    public DateTime? UsadoEn { get; private set; }
    public DateTime CreadoEn { get; private set; }

    public bool EstaUsado => UsadoEn is not null;

    // Constructor privado para hidratación desde repositorio (Dapper)
    private PasswordResetToken() { }

    public static PasswordResetToken Create(long usuarioId, string tokenHash, DateTime expiraEn)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(usuarioId, 0);
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenHash);

        return new PasswordResetToken
        {
            UsuarioId = usuarioId,
            TokenHash = tokenHash,
            ExpiraEn = expiraEn,
            CreadoEn = DateTime.UtcNow
        };
    }

    /// <summary>Un solo uso: válido únicamente si no se consumió y no expiró.</summary>
    public bool EsUtilizable(DateTime? ahora = null)
        => !EstaUsado && ExpiraEn > (ahora ?? DateTime.UtcNow);

    public void MarcarUsado(DateTime? ahora = null)
    {
        if (EstaUsado)
        {
            throw new InvalidOperationException("El token de recuperación ya fue utilizado.");
        }

        UsadoEn = ahora ?? DateTime.UtcNow;
    }
}
