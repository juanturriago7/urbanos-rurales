using Microsoft.Extensions.Logging;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Stub de <see cref="IAgendaVisitasService"/> para desarrollo y para staging sin
/// registro de aplicación de Azure: escribe el evento al log en vez de crearlo en
/// Microsoft 365. Devuelve <c>null</c> (no hay id de evento real) — el handler ya
/// contempla ese caso y notifica igual por correo.
/// </summary>
internal sealed class AgendaLogService : IAgendaVisitasService
{
    private readonly ILogger<AgendaLogService> _logger;

    public AgendaLogService(ILogger<AgendaLogService> logger)
    {
        _logger = logger;
    }

    public Task<string?> CrearEventoVisitaAsync(DatosEventoVisita datos, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "📅 [AgendaLogService] Visita NO creada en calendario (Graph sin configurar).\n"
            + "Inmueble: {Codigo} — {Titulo}\nDirección: {Direccion}\n"
            + "Cliente: {Cliente} <{Correo}> {Telefono}\n"
            + "Inicio (America/Bogota): {Inicio:yyyy-MM-dd HH:mm} · Duración: {Minutos} min\n"
            + "Mensaje: {Mensaje}",
            datos.CodigoReferencia, datos.TituloInmueble, datos.DireccionInmueble,
            datos.NombreCliente, datos.CorreoCliente, datos.TelefonoCliente ?? "-",
            datos.InicioLocal, datos.Duracion.TotalMinutes, datos.Mensaje ?? "(sin mensaje)");

        return Task.FromResult<string?>(null);
    }
}
