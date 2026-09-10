namespace Portal.Application.Interfaces;

/// <summary>Archivo adjunto de un correo, ya cargado en memoria.</summary>
public sealed record AdjuntoCorreo(string NombreArchivo, string ContentType, byte[] Contenido);

/// <summary>
/// Envío de correos transaccionales (recuperación de contraseña RF-062,
/// notificación de leads, postulaciones y visitas). Implementación dev: escribe
/// al log; SMTP/proveedor real se conecta en despliegue.
/// </summary>
public interface ICorreoService
{
    Task EnviarAsync(string para, string asunto, string cuerpo, CancellationToken ct = default);

    /// <summary>Igual que <see cref="EnviarAsync(string, string, string, CancellationToken)"/> pero con adjuntos.</summary>
    Task EnviarAsync(
        string para,
        string asunto,
        string cuerpo,
        IReadOnlyCollection<AdjuntoCorreo> adjuntos,
        CancellationToken ct = default);
}
