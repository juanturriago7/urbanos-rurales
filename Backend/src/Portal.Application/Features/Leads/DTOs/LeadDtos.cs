namespace Portal.Application.Features.Leads.DTOs;

public sealed record LeadDto(
    long Id,
    long? InmuebleId,
    string? InmuebleTitulo,
    string? InmuebleCodigo,
    string Nombre,
    string? Correo,
    string? Telefono,
    string? Mensaje,
    string Origen,
    string? UtmSource,
    string? UtmCampaign,
    string Estado,
    long? AsignadoA,
    string? AsignadoNombre,
    DateTime CreadoEn);
