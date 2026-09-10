using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Avisa por correo a RR. HH. de una nueva postulación laboral, con el CV (PDF)
/// adjunto. El destinatario vive en <c>Notificaciones:CorreoPostulaciones</c>
/// (configuración), por eso esto es un puerto y no lógica del handler.
/// </summary>
public interface INotificadorPostulaciones
{
    Task NotificarNuevaPostulacionAsync(PostulacionLaboral postulacion, CancellationToken ct = default);
}
