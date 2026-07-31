using Microsoft.Extensions.Logging;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Implementación de desarrollo de <see cref="ICorreoService"/>: escribe el correo
/// al log en lugar de enviarlo. Sustituir por SMTP/proveedor transaccional en despliegue.
/// </summary>
internal sealed class CorreoLogService : ICorreoService
{
    private readonly ILogger<CorreoLogService> _logger;

    public CorreoLogService(ILogger<CorreoLogService> logger)
    {
        _logger = logger;
    }

    public Task EnviarAsync(string para, string asunto, string cuerpo, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "📧 [CorreoLogService] Para: {Para} | Asunto: {Asunto}\n{Cuerpo}",
            para, asunto, cuerpo);

        return Task.CompletedTask;
    }
}
