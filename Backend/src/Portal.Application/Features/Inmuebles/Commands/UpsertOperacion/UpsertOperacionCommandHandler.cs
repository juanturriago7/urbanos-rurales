using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Inmuebles.Commands.UpsertOperacion;

public sealed class UpsertOperacionCommandHandler
    : IRequestHandler<UpsertOperacionCommand, Result<long>>
{
    private readonly IInmuebleRepository _inmuebles;

    public UpsertOperacionCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result<long>> Handle(UpsertOperacionCommand request, CancellationToken ct)
    {
        var inmueble = await _inmuebles.GetByIdAsync(request.InmuebleId, ct);

        if (inmueble is null || inmueble.EstaEliminado)
        {
            throw new KeyNotFoundException($"Inmueble {request.InmuebleId} no encontrado.");
        }

        var tipo = ContratoEnums.ParseTipoOperacion(request.TipoOperacion);
        var operacion = await _inmuebles.GetOperacionAsync(request.InmuebleId, tipo, ct);

        if (operacion is null)
        {
            operacion = InmuebleOperacion.Create(
                request.InmuebleId,
                tipo,
                request.Precio,
                request.CuotaAdministracion,
                request.AdminIncluida);

            if (request.Estado is not null)
            {
                operacion.CambiarEstado(ContratoEnums.ParseEstadoOperacion(request.Estado));
            }

            if (request.Activo == false)
            {
                operacion.Desactivar();
            }

            var id = await _inmuebles.CreateOperacionAsync(operacion, ct);
            return Result.Success(id);
        }

        operacion.ActualizarPrecio(request.Precio, request.CuotaAdministracion, request.AdminIncluida);

        if (request.Estado is not null)
        {
            operacion.CambiarEstado(ContratoEnums.ParseEstadoOperacion(request.Estado));
        }

        if (request.Activo is not null)
        {
            if (request.Activo.Value) operacion.Activar();
            else operacion.Desactivar();
        }

        await _inmuebles.UpdateOperacionAsync(operacion, ct);
        return Result.Success(operacion.Id);
    }
}
