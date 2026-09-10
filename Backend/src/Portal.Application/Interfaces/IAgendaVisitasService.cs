namespace Portal.Application.Interfaces;

/// <summary>
/// Datos que necesita el calendario para crear el evento de una visita a un
/// inmueble. La hora es local de Colombia (America/Bogota, UTC-5 sin horario
/// de verano) — la implementación la convierte al formato que espera el proveedor.
/// </summary>
public sealed record DatosEventoVisita(
    long InmuebleId,
    string CodigoReferencia,
    string TituloInmueble,
    string DireccionInmueble,
    string NombreCliente,
    string CorreoCliente,
    string? TelefonoCliente,
    DateTime InicioLocal,
    TimeSpan Duracion,
    string? Mensaje);

/// <summary>
/// Puerto hacia la agenda corporativa (Microsoft 365 / Graph). Crea el evento de
/// la visita en el buzón configurado (<c>Graph:MailboxVisitas</c>).
/// </summary>
/// <remarks>
/// Implementación real: <c>GraphAgendaService</c> (OAuth client-credentials + Graph
/// REST). Sin credenciales configuradas cae a <c>AgendaLogService</c>, que solo
/// escribe el evento al log — así el flujo completo funciona en desarrollo y en
/// staging antes de tener el registro de aplicación de Azure.
/// </remarks>
public interface IAgendaVisitasService
{
    /// <summary>
    /// Crea el evento de la visita. Devuelve el id del evento en el calendario, o
    /// <c>null</c> si la agenda no está configurada (stub) o el proveedor falló:
    /// la solicitud de visita se atiende igual por correo, así que el llamador
    /// no debe abortar por un <c>null</c>.
    /// </summary>
    Task<string?> CrearEventoVisitaAsync(DatosEventoVisita datos, CancellationToken ct = default);
}
