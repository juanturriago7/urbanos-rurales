using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Implementación real de <see cref="ICorreoService"/> vía SMTP. Se registra en
/// vez de <see cref="CorreoLogService"/> cuando la sección "Correo" trae un Host
/// configurado (ver DependencyInjection.AddInfrastructure).
/// </summary>
internal sealed class SmtpCorreoService : ICorreoService
{
    private readonly OpcionesCorreo _opciones;
    private readonly ILogger<SmtpCorreoService> _logger;

    public SmtpCorreoService(IOptions<OpcionesCorreo> opciones, ILogger<SmtpCorreoService> logger)
    {
        _opciones = opciones.Value;
        _logger = logger;
    }

    public Task EnviarAsync(string para, string asunto, string cuerpo, CancellationToken ct = default)
        => EnviarAsync(para, asunto, cuerpo, [], ct);

    public async Task EnviarAsync(
        string para,
        string asunto,
        string cuerpo,
        IReadOnlyCollection<AdjuntoCorreo> adjuntos,
        CancellationToken ct = default)
    {
        using var mensaje = new MailMessage
        {
            From = new MailAddress(_opciones.RemitenteCorreo ?? _opciones.Usuario!, _opciones.RemitenteNombre),
            Subject = asunto,
            Body = cuerpo,
            IsBodyHtml = false,
        };
        mensaje.To.Add(para);

        // Cada MemoryStream lo libera MailMessage.Dispose() junto con su Attachment.
        foreach (var adjunto in adjuntos)
        {
            var stream = new MemoryStream(adjunto.Contenido, writable: false);
            mensaje.Attachments.Add(new Attachment(stream, adjunto.NombreArchivo, adjunto.ContentType));
        }

        using var cliente = new SmtpClient(_opciones.Host, _opciones.Puerto)
        {
            EnableSsl = _opciones.UsarSsl,
            Credentials = string.IsNullOrWhiteSpace(_opciones.Usuario)
                ? null
                : new NetworkCredential(_opciones.Usuario, _opciones.Password),
        };

        try
        {
            await cliente.SendMailAsync(mensaje, ct);
        }
        catch (Exception ex)
        {
            // El fallo de envío no debe tumbar el flujo que lo dispara (ej. creación
            // de un lead) — se loguea aquí y el llamador decide si necesita reintentar.
            _logger.LogError(ex, "Fallo enviando correo a {Para} con asunto {Asunto}", para, asunto);
            throw;
        }
    }
}
