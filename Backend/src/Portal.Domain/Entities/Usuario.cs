using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Usuario del panel administrativo (tabla <c>usuarios</c>).
/// POCO puro, sin dependencias externas. Las reglas de bloqueo por intentos
/// fallidos (RF-063) viven aquí, no en los handlers.
/// </summary>
/// <remarks>
/// No hereda de <see cref="Common.BaseEntity"/>: el modelo de datos define
/// PK <c>BIGSERIAL</c> y usa <c>activo</c> en lugar de borrado lógico.
/// </remarks>
public sealed class Usuario
{
    /// <summary>Intentos fallidos consecutivos que disparan el bloqueo (RF-063).</summary>
    public const int MaxIntentosFallidos = 5;

    /// <summary>Cuánto dura el bloqueo una vez alcanzado <see cref="MaxIntentosFallidos"/>.</summary>
    public static readonly TimeSpan DuracionBloqueo = TimeSpan.FromMinutes(15);

    public long Id { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string Correo { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public RolUsuario Rol { get; private set; }
    public string? Telefono { get; private set; }
    public bool Activo { get; private set; }
    public short IntentosFallidos { get; private set; }
    public DateTime? BloqueadoHasta { get; private set; }
    public string? RefreshTokenHash { get; private set; }
    public DateTime? RefreshTokenExpira { get; private set; }
    public DateTime CreadoEn { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Usuario() { }

    public static Usuario Create(
        string nombre,
        string correo,
        string passwordHash,
        RolUsuario rol,
        string? telefono = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(correo);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        return new Usuario
        {
            Nombre = nombre.Trim(),
            Correo = correo.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Rol = rol,
            Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim(),
            Activo = true,
            IntentosFallidos = 0,
            CreadoEn = DateTime.UtcNow
        };
    }

    /// <summary>Indica si hay un bloqueo vigente por intentos fallidos (RF-063).</summary>
    public bool EstaBloqueado(DateTime? ahora = null)
        => BloqueadoHasta is not null && BloqueadoHasta > (ahora ?? DateTime.UtcNow);

    /// <summary>Solo puede autenticarse si está activo y sin bloqueo vigente.</summary>
    public bool PuedeAutenticarse(DateTime? ahora = null)
        => Activo && !EstaBloqueado(ahora);

    /// <summary>
    /// Suma un intento fallido y bloquea la cuenta al llegar a
    /// <see cref="MaxIntentosFallidos"/> (RF-063).
    /// </summary>
    public void RegistrarIntentoFallido(DateTime? ahora = null)
    {
        IntentosFallidos = (short)(IntentosFallidos + 1);

        if (IntentosFallidos >= MaxIntentosFallidos)
        {
            BloqueadoHasta = (ahora ?? DateTime.UtcNow).Add(DuracionBloqueo);
        }
    }

    /// <summary>Limpia el contador y el bloqueo tras un login correcto.</summary>
    public void RegistrarAccesoExitoso()
    {
        IntentosFallidos = 0;
        BloqueadoHasta = null;
    }

    /// <summary>Levanta el bloqueo manualmente (acción de administrador).</summary>
    public void Desbloquear() => RegistrarAccesoExitoso();

    public void CambiarPassword(string nuevoPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nuevoPasswordHash);
        PasswordHash = nuevoPasswordHash;
        RegistrarAccesoExitoso();
    }

    /// <summary>Guarda el hash del refresh token vigente (sesión única por usuario).</summary>
    public void AsignarRefreshToken(string tokenHash, DateTime expiraEn)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenHash);
        RefreshTokenHash = tokenHash;
        RefreshTokenExpira = expiraEn;
    }

    /// <summary>Invalida el refresh token (logout / rotación fallida).</summary>
    public void RevocarRefreshToken()
    {
        RefreshTokenHash = null;
        RefreshTokenExpira = null;
    }

    /// <summary>Valida que el hash coincida y no haya expirado.</summary>
    public bool RefreshTokenEsValido(string tokenHash, DateTime? ahora = null)
        => RefreshTokenHash is not null
           && RefreshTokenExpira is not null
           && RefreshTokenExpira > (ahora ?? DateTime.UtcNow)
           && RefreshTokenHash == tokenHash;

    public void CambiarRol(RolUsuario rol) => Rol = rol;

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;
}
