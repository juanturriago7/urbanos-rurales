namespace Portal.Application.Features.Visitas.DTOs;

/// <summary>Respuesta pública tras solicitar una visita.</summary>
/// <param name="Agendada">
/// <c>true</c> si la solicitud quedó registrada en la agenda. <c>false</c> nunca
/// se devuelve hoy (los fallos van como 400/500); se deja explícito para el
/// contrato del frontend.
/// </param>
/// <param name="InicioLocal">Fecha y hora local (America/Bogota) confirmada del slot.</param>
public sealed record AgendarVisitaResponse(bool Agendada, DateTime InicioLocal);
