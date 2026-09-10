using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Implementación de <see cref="INotificadorVisitas"/>: confirmación al cliente y
/// aviso interno al equipo comercial (<c>Notificaciones:CorreoVisitas</c>). Cada
/// envío es independiente — que falle el del cliente no impide el interno.
/// </summary>
internal sealed class NotificadorVisitasCorreo : INotificadorVisitas
{
    private static readonly CultureInfo EsCo = CultureInfo.GetCultureInfo("es-CO");

    private readonly ICorreoService _correo;
    private readonly OpcionesNotificaciones _opciones;
    private readonly ILogger<NotificadorVisitasCorreo> _logger;

    public NotificadorVisitasCorreo(
        ICorreoService correo,
        IOptions<OpcionesNotificaciones> opciones,
        ILogger<NotificadorVisitasCorreo> logger)
    {
        _correo = correo;
        _opciones = opciones.Value;
        _logger = logger;
    }

    public async Task NotificarSolicitudAsync(DatosNotificacionVisita datos, CancellationToken ct = default)
    {
        await EnviarAsync(
            datos.CorreoCliente,
            $"Solicitud de visita recibida — {datos.TituloInmueble}",
            $"""
            Hola {datos.NombreCliente},

            Recibimos tu solicitud de visita:

            Inmueble: {datos.CodigoReferencia} — {datos.TituloInmueble}
            Fecha:    {datos.InicioLocal.ToString("dddd d 'de' MMMM 'de' yyyy", EsCo)}
            Hora:     {datos.InicioLocal:HH:mm} (hora de Colombia)

            Un asesor te confirmará la visita y la dirección exacta a la brevedad.

            Urbanos & Rurales
            """,
            "confirmación al cliente",
            ct);

        if (!OpcionesNotificaciones.EstaConfigurado(_opciones.CorreoVisitas))
        {
            _logger.LogWarning(
                "Notificaciones:CorreoVisitas sin configurar — no se envió el aviso interno de la visita al inmueble {Codigo}.",
                datos.CodigoReferencia);
            return;
        }

        var estadoAgenda = datos.EventoCreado
            ? "Evento creado en el calendario."
            : "⚠ NO se creó el evento en el calendario (agéndalo manualmente).";

        await EnviarAsync(
            _opciones.CorreoVisitas!,
            $"Nueva solicitud de visita — {datos.CodigoReferencia}",
            $"""
            Nueva solicitud de visita:

            Inmueble:  {datos.CodigoReferencia} — {datos.TituloInmueble}
            Dirección: {datos.DireccionInmueble}
            Fecha:     {datos.InicioLocal:yyyy-MM-dd HH:mm} (hora de Colombia)

            Cliente:   {datos.NombreCliente}
            Correo:    {datos.CorreoCliente}
            Teléfono:  {datos.TelefonoCliente ?? "-"}

            Mensaje:
            {datos.Mensaje ?? "(sin mensaje)"}

            {estadoAgenda}
            """,
            "aviso interno",
            ct);
    }

    private async Task EnviarAsync(string para, string asunto, string cuerpo, string tipo, CancellationToken ct)
    {
        try
        {
            await _correo.EnviarAsync(para, asunto, cuerpo, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo enviando el correo de visita ({Tipo}) a {Para}", tipo, para);
        }
    }
}
