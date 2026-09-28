using System.Net;
using MediatR;
using Microsoft.Extensions.Logging;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Features.Visitas.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Visitas.Commands.AgendarVisita;

/// <summary>
/// Resuelve el slot, crea el evento en la agenda corporativa y notifica por
/// correo. La visita no se guarda en una tabla propia (decisión de alcance):
/// queda en el calendario del buzón configurado y, como rastro en el CRM, se
/// registra además un lead <c>formulario_inmueble</c>.
/// <para>El evento y el lead son best-effort: si fallan, la solicitud igual se
/// atiende por el correo interno, así que no tumban la respuesta.</para>
/// </summary>
public sealed class AgendarVisitaCommandHandler
    : IRequestHandler<AgendarVisitaCommand, Result<AgendarVisitaResponse>>
{
    // Un solo calendario para todos los inmuebles: la reserva se serializa por proceso.
    private static readonly SemaphoreSlim _reserva = new(1, 1);

    private readonly IInmueblePublicoRepository _inmueblesPublico;
    private readonly IInmuebleRepository _inmuebles;
    private readonly IAgendaVisitasService _agenda;
    private readonly INotificadorVisitas _notificador;
    private readonly ILeadRepository _leads;
    private readonly ILogger<AgendarVisitaCommandHandler> _logger;

    public AgendarVisitaCommandHandler(
        IInmueblePublicoRepository inmueblesPublico,
        IInmuebleRepository inmuebles,
        IAgendaVisitasService agenda,
        INotificadorVisitas notificador,
        ILeadRepository leads,
        ILogger<AgendarVisitaCommandHandler> logger)
    {
        _inmueblesPublico = inmueblesPublico;
        _inmuebles = inmuebles;
        _agenda = agenda;
        _notificador = notificador;
        _leads = leads;
        _logger = logger;
    }

    public async Task<Result<AgendarVisitaResponse>> Handle(
        AgendarVisitaCommand request, CancellationToken ct)
    {
        // Honeypot anti-spam (RNF-023): campo oculto que solo llenan los bots.
        // Éxito falso, sin agendar ni notificar (no conviene avisarle al bot).
        if (!string.IsNullOrWhiteSpace(request.Sitio))
        {
            return Result.Success(new AgendarVisitaResponse(true, ReglasAgenda.AhoraEnColombia));
        }

        if (!ReglasAgenda.TryResolverInicio(request.Fecha, request.Franja, out var inicioLocal, out var error))
        {
            return Result<AgendarVisitaResponse>.Failure(error ?? "Fecha u hora inválida.");
        }

        // Valida que el inmueble exista y esté publicado (misma regla que el detalle público).
        var detalle = await _inmueblesPublico.GetDetallePorIdAsync(request.InmuebleId, ct)
            ?? throw new KeyNotFoundException("El inmueble no existe o no está publicado.");

        // Dirección exacta: solo para el evento del calendario y el correo interno
        // del equipo. NUNCA se devuelve al público (RF-044).
        var inmueble = await _inmuebles.GetByIdAsync(request.InmuebleId, ct);
        var direccion = inmueble?.DireccionExacta ?? "(dirección exacta con el asesor)";

        var nombre = request.Nombre.Trim();
        var correo = request.Correo.Trim();
        var telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
        var mensaje = string.IsNullOrWhiteSpace(request.Mensaje) ? null : request.Mensaje.Trim();

        // El calendario no rechaza eventos traslapados, así que la disponibilidad se
        // revalida aquí (no basta con que el frontend oculte las franjas tomadas) y
        // "chequear + crear" va serializado para que dos solicitudes simultáneas por
        // la misma franja no pasen ambas el chequeo.
        string? eventoId;
        await _reserva.WaitAsync(ct);
        try
        {
            if (await FranjaOcupadaAsync(inicioLocal, ct))
            {
                return Result<AgendarVisitaResponse>.Failure(ReglasAgenda.MensajeFranjaOcupada);
            }

            eventoId = await CrearEventoAsync(
                request.InmuebleId, detalle, direccion, nombre, correo, telefono, inicioLocal, mensaje, ct);
        }
        finally
        {
            _reserva.Release();
        }

        await NotificarAsync(detalle, direccion, nombre, correo, telefono, inicioLocal, mensaje,
            eventoCreado: eventoId is not null, ct);

        await RegistrarLeadAsync(request, nombre, correo, telefono, inicioLocal, mensaje, ct);

        return Result.Success(new AgendarVisitaResponse(true, inicioLocal));
    }

    private async Task<bool> FranjaOcupadaAsync(DateTime inicioLocal, CancellationToken ct)
    {
        try
        {
            var ocupadas = await _agenda.ObtenerFranjasOcupadasAsync(DateOnly.FromDateTime(inicioLocal), ct);
            return ocupadas.Contains($"{inicioLocal:HH:mm}");
        }
        catch (Exception ex)
        {
            // Sin poder consultar la agenda no se bloquea al cliente: la solicitud
            // se atiende igual por el correo interno (mismo criterio best-effort).
            _logger.LogWarning(ex,
                "No se pudo verificar la disponibilidad de {Inicio:yyyy-MM-dd HH:mm}; se agenda sin verificar", inicioLocal);
            return false;
        }
    }

    private async Task<string?> CrearEventoAsync(
        long inmuebleId, InmueblePublicoDetalleDto detalle,
        string direccion, string nombre, string correo, string? telefono,
        DateTime inicioLocal, string? mensaje, CancellationToken ct)
    {
        try
        {
            return await _agenda.CrearEventoVisitaAsync(
                new DatosEventoVisita(
                    inmuebleId, detalle.CodigoReferencia, detalle.Titulo, direccion,
                    nombre, correo, telefono, inicioLocal, ReglasAgenda.DuracionVisita, mensaje),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "No se pudo crear el evento de agenda para la visita al inmueble {InmuebleId}", inmuebleId);
            return null;
        }
    }

    private async Task NotificarAsync(
        InmueblePublicoDetalleDto detalle,
        string direccion, string nombre, string correo, string? telefono,
        DateTime inicioLocal, string? mensaje, bool eventoCreado, CancellationToken ct)
    {
        try
        {
            await _notificador.NotificarSolicitudAsync(
                new DatosNotificacionVisita(
                    detalle.CodigoReferencia, detalle.Titulo, direccion,
                    nombre, correo, telefono, inicioLocal, mensaje, eventoCreado),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "No se pudo notificar por correo la visita al inmueble {Codigo}", detalle.CodigoReferencia);
        }
    }

    private async Task RegistrarLeadAsync(
        AgendarVisitaCommand request, string nombre, string correo, string? telefono,
        DateTime inicioLocal, string? mensaje, CancellationToken ct)
    {
        try
        {
            var texto = $"Solicitud de visita para el {inicioLocal:dd/MM/yyyy} a las {inicioLocal:HH:mm}."
                + (mensaje is null ? string.Empty : $"\n\n{mensaje}");

            var lead = Lead.Create(
                nombre,
                "formulario_inmueble",
                aceptoTratamientoDatos: true,
                inmuebleId: request.InmuebleId,
                correo: correo,
                telefono: telefono,
                mensaje: texto,
                ipOrigen: IPAddress.TryParse(request.IpOrigen, out var ip) ? ip : null);

            await _leads.CreateAsync(lead, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "No se pudo registrar el lead de la visita al inmueble {InmuebleId}", request.InmuebleId);
        }
    }
}
