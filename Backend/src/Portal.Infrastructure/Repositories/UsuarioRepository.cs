using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>
/// Repositorio de usuarios con Dapper.
/// Convenciones:
///   - snake_case en SQL (columnas PostgreSQL), PascalCase en C#
///   - mapeo explícito mediante alias en SELECT (sin ORMs, sin AutoMapper)
///   - <c>rol</c> es un ENUM nativo: se lee con <c>::text</c> y se escribe con
///     CAST explícito, porque Npgsql no infiere el tipo desde un string.
/// </summary>
internal sealed class UsuarioRepository : IUsuarioRepository
{
    private const string SelectUsuario = """
        SELECT
            id                AS Id,
            nombre            AS Nombre,
            correo            AS Correo,
            password_hash     AS PasswordHash,
            rol::text         AS Rol,
            telefono          AS Telefono,
            activo            AS Activo,
            intentos_fallidos AS IntentosFallidos,
            bloqueado_hasta   AS BloqueadoHasta,
            refresh_token_hash   AS RefreshTokenHash,
            refresh_token_expira AS RefreshTokenExpira,
            creado_en         AS CreadoEn
        FROM usuarios
        """;

    private readonly DbConnectionFactory _connectionFactory;

    public UsuarioRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Usuario?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        const string sql = $"{SelectUsuario} WHERE id = @Id";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Usuario>(sql, new { Id = id });
    }

    public async Task<Usuario?> GetByCorreoAsync(string correo, CancellationToken ct = default)
    {
        const string sql = $"{SelectUsuario} WHERE correo = @Correo";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Usuario>(
            sql, new { Correo = correo.Trim().ToLowerInvariant() });
    }

    public async Task<Usuario?> GetByRefreshTokenHashAsync(
        string refreshTokenHash, CancellationToken ct = default)
    {
        const string sql = $"{SelectUsuario} WHERE refresh_token_hash = @Hash";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Usuario>(sql, new { Hash = refreshTokenHash });
    }

    public async Task<bool> ExisteCorreoAsync(string correo, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS (SELECT 1 FROM usuarios WHERE correo = @Correo)";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(
            sql, new { Correo = correo.Trim().ToLowerInvariant() });
    }

    public async Task<long> CreateAsync(Usuario usuario, CancellationToken ct = default)
    {
        // `id` lo genera la secuencia (BIGSERIAL); no se envía desde la aplicación.
        const string sql = """
            INSERT INTO usuarios (
                nombre, correo, password_hash, rol, telefono,
                activo, intentos_fallidos, bloqueado_hasta, creado_en)
            VALUES (
                @Nombre, @Correo, @PasswordHash, CAST(@Rol AS rol_usuario), @Telefono,
                @Activo, @IntentosFallidos, @BloqueadoHasta, @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            usuario.Nombre,
            usuario.Correo,
            usuario.PasswordHash,
            Rol = ToDbRol(usuario),
            usuario.Telefono,
            usuario.Activo,
            usuario.IntentosFallidos,
            usuario.BloqueadoHasta,
            usuario.CreadoEn
        });
    }

    public async Task UpdateAsync(Usuario usuario, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE usuarios SET
                nombre            = @Nombre,
                correo            = @Correo,
                password_hash     = @PasswordHash,
                rol               = CAST(@Rol AS rol_usuario),
                telefono          = @Telefono,
                activo            = @Activo,
                intentos_fallidos = @IntentosFallidos,
                bloqueado_hasta   = @BloqueadoHasta,
                refresh_token_hash   = @RefreshTokenHash,
                refresh_token_expira = @RefreshTokenExpira
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            usuario.Id,
            usuario.Nombre,
            usuario.Correo,
            usuario.PasswordHash,
            Rol = ToDbRol(usuario),
            usuario.Telefono,
            usuario.Activo,
            usuario.IntentosFallidos,
            usuario.BloqueadoHasta,
            usuario.RefreshTokenHash,
            usuario.RefreshTokenExpira
        });
    }

    /// <summary>El ENUM `rol_usuario` usa etiquetas en minúscula ('admin', 'asesor').</summary>
    private static string ToDbRol(Usuario usuario) => usuario.Rol.ToString().ToLowerInvariant();
}
