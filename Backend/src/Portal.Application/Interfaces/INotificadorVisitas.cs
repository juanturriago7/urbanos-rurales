namespace Portal.Application.Interfaces;

/// <summary>Datos para las notificaciones por correo de una solicitud de visita.</summary>
public sealed record DatosNotificacionVisita(
    string CodigoReferencia,
    string TituloInmueble,
    string DireccionInmueble,
    string NombreCliente,
    string CorreoCliente,
    string? TelefonoCliente,
    DateTime InicioLocal,
    string? Mensaje,
    bool EventoCreado);

/// <summary>
/// Envía los correos de una solicitud de visita: confirmación al cliente y aviso
/// interno al buzón de <c>Notificaciones:CorreoVisitas</c>. El destinatario interno
/// vive en configuración (Infrastructure), por eso esto es un puerto y no lógica
/// del handler.
/// </summary>
public interface INotificadorVisitas
{
    Task NotificarSolicitudAsync(DatosNotificacionVisita datos, CancellationToken ct = default);
}
