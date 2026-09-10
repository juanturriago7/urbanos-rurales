namespace Portal.Infrastructure.Services;

/// <summary>
/// Destinatarios internos de los correos transaccionales que no van a un usuario
/// del sistema (sección <c>Notificaciones</c>). Son uno por tipo, así que viven
/// en configuración y no en una tabla.
/// </summary>
public sealed class OpcionesNotificaciones
{
    public const string Seccion = "Notificaciones";

    /// <summary>
    /// Correo de RR. HH. que recibe cada postulación laboral con el CV adjunto.
    /// Vacío o "CHANGE_ME" desactiva el envío (se registra un aviso en el log).
    /// </summary>
    public string? CorreoPostulaciones { get; set; }

    /// <summary>
    /// Correo del equipo comercial que recibe cada solicitud de visita.
    /// Vacío o "CHANGE_ME" desactiva el envío del aviso interno.
    /// </summary>
    public string? CorreoVisitas { get; set; }

    public static bool EstaConfigurado(string? valor)
        => !string.IsNullOrWhiteSpace(valor) && valor != "CHANGE_ME";
}
