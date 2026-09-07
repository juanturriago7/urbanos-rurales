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
        => EnviarAsync(para, asunto, cuerpo, [], ct);

    public Task EnviarAsync(
        string para,
        string asunto,
        string cuerpo,
        IReadOnlyCollection<AdjuntoCorreo> adjuntos,
        CancellationToken ct = default)
    {
        var resumenAdjuntos = adjuntos.Count == 0
            ? "(sin adjuntos)"
            : string.Join(", ", adjuntos.Select(a => $"{a.NombreArchivo} ({a.Contenido.Length} bytes)"));

        _logger.LogInformation(
            "📧 [CorreoLogService] Para: {Para} | Asunto: {Asunto} | Adjuntos: {Adjuntos}\n{Cuerpo}",
            para, asunto, resumenAdjuntos, cuerpo);

        return Task.CompletedTask;
    }
}
