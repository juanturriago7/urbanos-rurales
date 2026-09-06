namespace Portal.Infrastructure.Services;

/// <summary>
/// Configuración del envío de correo transaccional (sección <c>Correo</c>).
/// </summary>
public sealed class OpcionesCorreo
{
    public const string Seccion = "Correo";

    /// <summary>Host SMTP. Vacío o "CHANGE_ME" desactiva el envío real (cae a log).</summary>
    public string? Host { get; set; }

    public int Puerto { get; set; } = 587;

    public string? Usuario { get; set; }

    public string? Password { get; set; }

    public bool UsarSsl { get; set; } = true;

    public string RemitenteNombre { get; set; } = "Urbanos & Rurales";

    public string? RemitenteCorreo { get; set; }
}
