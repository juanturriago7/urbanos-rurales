using Dapper;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>Tokens de recuperación de contraseña (tabla <c>password_reset_tokens</c>, RF-062).</summary>
internal sealed class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public PasswordResetTokenRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task CreateAsync(
        long usuarioId, string tokenHash, DateTime expiraEn, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO password_reset_tokens (usuario_id, token_hash, expira_en)
            VALUES (@UsuarioId, @TokenHash, @ExpiraEn)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { UsuarioId = usuarioId, TokenHash = tokenHash, ExpiraEn = expiraEn });
    }

    public async Task<long?> GetUsuarioIdPorTokenValidoAsync(
        string tokenHash, CancellationToken ct = default)
    {
        const string sql = """
            SELECT usuario_id
            FROM password_reset_tokens
            WHERE token_hash = @TokenHash
              AND usado_en IS NULL
              AND expira_en > now()
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long?>(sql, new { TokenHash = tokenHash });
    }

    public async Task MarcarUsadoAsync(string tokenHash, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE password_reset_tokens
            SET usado_en = now()
            WHERE token_hash = @TokenHash AND usado_en IS NULL
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { TokenHash = tokenHash });
    }

    public async Task InvalidarPendientesAsync(long usuarioId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE password_reset_tokens
            SET usado_en = now()
            WHERE usuario_id = @UsuarioId AND usado_en IS NULL
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { UsuarioId = usuarioId });
    }
}
