using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Leads.Commands.ActualizarLead;

public sealed class ActualizarLeadCommandHandler
    : IRequestHandler<ActualizarLeadCommand, Result>
{
    private readonly ILeadRepository _leads;
    private readonly IUsuarioRepository _usuarios;

    public ActualizarLeadCommandHandler(ILeadRepository leads, IUsuarioRepository usuarios)
    {
        _leads = leads;
        _usuarios = usuarios;
    }

    public async Task<Result> Handle(ActualizarLeadCommand request, CancellationToken ct)
    {
        var lead = await _leads.GetByIdAsync(request.Id, ct);

        if (lead is null)
        {
            throw new KeyNotFoundException($"Lead {request.Id} no encontrado.");
        }

        if (request.Estado is not null)
        {
            lead.CambiarEstado(ContratoEnums.ParseEstadoLead(request.Estado));
        }

        if (request.AsignadoA is not null)
        {
            var asesor = await _usuarios.GetByIdAsync(request.AsignadoA.Value, ct);

            if (asesor is null || !asesor.Activo)
            {
                return Result.Failure("El usuario asignado no existe o está inactivo.");
            }

            lead.Asignar(request.AsignadoA.Value);
        }

        await _leads.UpdateAsync(lead, ct);

        return Result.Success();
    }
}
