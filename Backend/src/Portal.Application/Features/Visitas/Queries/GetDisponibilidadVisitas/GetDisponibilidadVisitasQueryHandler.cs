using MediatR;
using Microsoft.Extensions.Logging;
using Portal.Application.Features.Visitas.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Visitas.Queries.GetDisponibilidadVisitas;

public sealed class GetDisponibilidadVisitasQueryHandler
    : IRequestHandler<GetDisponibilidadVisitasQuery, DisponibilidadVisitasResponse>
{
    private readonly IAgendaVisitasService _agenda;
    private readonly ILogger<GetDisponibilidadVisitasQueryHandler> _logger;

    public GetDisponibilidadVisitasQueryHandler(
        IAgendaVisitasService agenda,
        ILogger<GetDisponibilidadVisitasQueryHandler> logger)
    {
        _agenda = agenda;
        _logger = logger;
    }

    public async Task<DisponibilidadVisitasResponse> Handle(
        GetDisponibilidadVisitasQuery request, CancellationToken ct)
    {
        var fecha = DateOnly.ParseExact(request.Fecha, "yyyy-MM-dd");

        try
        {
            return new DisponibilidadVisitasResponse(request.Fecha, await _agenda.ObtenerFranjasOcupadasAsync(fecha, ct));
        }
        catch (Exception ex)
        {
            // Sin la agenda no se puede saber qué está ocupado: se muestran todas las
            // franjas y la solicitud se atiende igual (mismo criterio best-effort del
            // agendamiento).
            _logger.LogError(ex, "No se pudo consultar la disponibilidad de visitas para {Fecha}", request.Fecha);
            return new DisponibilidadVisitasResponse(request.Fecha, []);
        }
    }
}
