namespace Portal.Application.Interfaces;

/// <summary>
/// Envío de correos transaccionales (recuperación de contraseña RF-062,
/// notificación de leads). Implementación dev: escribe al log; SMTP/proveedor
/// real se conecta en despliegue.
/// </summary>
public interface ICorreoService
{
    Task EnviarAsync(string para, string asunto, string cuerpo, CancellationToken ct = default);
}
