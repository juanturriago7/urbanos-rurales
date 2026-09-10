using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Implementación de <see cref="INotificadorPostulaciones"/>: descarga el CV del
/// almacenamiento y lo envía adjunto a <c>Notificaciones:CorreoPostulaciones</c>.
/// Se adjunta el PDF en vez de enlazarlo para no exponer datos personales en una
/// URL pública permanente.
/// </summary>
internal sealed class NotificadorPostulacionesCorreo : INotificadorPostulaciones
{
    private readonly ICorreoService _correo;
    private readonly IAlmacenamientoObjetos _almacenamiento;
    private readonly OpcionesNotificaciones _opciones;
    private readonly ILogger<NotificadorPostulacionesCorreo> _logger;

    public NotificadorPostulacionesCorreo(
        ICorreoService correo,
        IAlmacenamientoObjetos almacenamiento,
        IOptions<OpcionesNotificaciones> opciones,
        ILogger<NotificadorPostulacionesCorreo> logger)
    {
        _correo = correo;
        _almacenamiento = almacenamiento;
        _opciones = opciones.Value;
        _logger = logger;
    }

    public async Task NotificarNuevaPostulacionAsync(PostulacionLaboral postulacion, CancellationToken ct = default)
    {
        if (!OpcionesNotificaciones.EstaConfigurado(_opciones.CorreoPostulaciones))
        {
            _logger.LogWarning(
                "Notificaciones:CorreoPostulaciones sin configurar — no se envió el aviso de la postulación de {Correo}.",
                postulacion.Correo);
            return;
        }

        var pdf = await _almacenamiento.DescargarAsync(postulacion.CvStorageKey, ct);
        var nombreArchivo = $"CV - {SanitizarNombre(postulacion.Nombre)}.pdf";

        var cuerpo =
            $"""
            Nueva postulación laboral:

            Nombre:          {postulacion.Nombre}
            Correo:          {postulacion.Correo}
            Teléfono:        {postulacion.Telefono ?? "-"}
            Cargo de interés: {postulacion.CargoInteres ?? "-"}

            Mensaje:
            {postulacion.Mensaje ?? "(sin mensaje)"}

            La hoja de vida va adjunta a este correo.
            """;

        await _correo.EnviarAsync(
            _opciones.CorreoPostulaciones!,
            $"Nueva postulación — {postulacion.Nombre}",
            cuerpo,
            [new AdjuntoCorreo(nombreArchivo, "application/pdf", pdf)],
            ct);
    }

    /// <summary>Quita separadores de ruta y controla el largo para el nombre del adjunto.</summary>
    private static string SanitizarNombre(string nombre)
    {
        var limpio = nombre.Replace('/', '-').Replace('\\', '-').Replace('"', '\'').Trim();
        return limpio.Length <= 80 ? limpio : limpio[..80];
    }
}
