using System.Net;
using MediatR;
using Microsoft.Extensions.Logging;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Leads.Commands.CrearLead;

/// <summary>
/// Crea el lead y notifica por correo (dev: log; producción: SMTP real — ver
/// DependencyInjection.AddCorreo). Si el honeypot viene lleno, responde éxito
/// falso sin persistir (no conviene avisarle al bot).
/// </summary>
public sealed class CrearLeadCommandHandler : IRequestHandler<CrearLeadCommand, Result<long>>
{
    private readonly ILeadRepository _leads;
    private readonly ICorreoService _correo;
    private readonly IUsuarioRepository _usuarios;
    private readonly ILogger<CrearLeadCommandHandler> _logger;

    public CrearLeadCommandHandler(
        ILeadRepository leads,
        ICorreoService correo,
        IUsuarioRepository usuarios,
        ILogger<CrearLeadCommandHandler> logger)
    {
        _leads = leads;
        _correo = correo;
        _usuarios = usuarios;
        _logger = logger;
    }

    public async Task<Result<long>> Handle(CrearLeadCommand request, CancellationToken ct)
    {
        // Honeypot anti-spam (RNF-023): campo oculto que solo llenan los bots
        if (!string.IsNullOrWhiteSpace(request.Sitio))
        {
            return Result.Success(0L);
        }

        var lead = Lead.Create(
            request.Nombre,
            request.Origen,
            request.AceptoTratamientoDatos,
            request.InmuebleId,
            request.Correo,
            request.Telefono,
            request.Mensaje,
            request.UtmSource,
            request.UtmCampaign,
            IPAddress.TryParse(request.IpOrigen, out var ip) ? ip : null);

        var id = await _leads.CreateAsync(lead, ct);

        await NotificarAsync(lead, id, ct);

        return Result.Success(id);
    }

    /// <summary>
    /// Notifica el lead por correo. El lead ya quedó persistido antes de llamar
    /// esto: un fallo de envío (SMTP caído, credenciales, etc.) no debe tumbar
    /// la respuesta de creación, así que se captura y solo se loguea.
    /// </summary>
    private async Task NotificarAsync(Lead lead, long id, CancellationToken ct)
    {
        try
        {
            var admin = await _usuarios.GetByCorreoAsync("admin@portal.local", ct);

            if (admin is null)
            {
                return;
            }

            await _correo.EnviarAsync(
                admin.Correo,
                $"Nuevo lead #{id} — {lead.Nombre}",
                $"""
                Nuevo lead recibido:

                Nombre:   {lead.Nombre}
                Correo:   {lead.Correo ?? "-"}
                Teléfono: {lead.Telefono ?? "-"}
                Origen:   {lead.Origen}
                Inmueble: {(lead.InmuebleId is null ? "contacto general" : lead.InmuebleId.ToString())}

                Mensaje:
                {lead.Mensaje ?? "(sin mensaje)"}
                """,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo notificar por correo el lead #{Id}", id);
        }
    }
}
