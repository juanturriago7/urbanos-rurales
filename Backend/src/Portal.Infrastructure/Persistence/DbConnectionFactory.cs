using Npgsql;
using System.Data;

namespace Portal.Infrastructure.Persistence;

/// <summary>
/// Factory de conexiones Npgsql. Dapper trabaja con IDbConnection directamente.
/// Se registra como Scoped en DI para que cada request tenga su propia conexión.
/// </summary>
public sealed class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = connectionString;
    }

    /// <summary>
    /// Crea y abre una nueva conexión. El llamador es responsable de cerrarla (using).
    /// </summary>
    public async Task<IDbConnection> OpenAsync(CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        return conn;
    }
}
