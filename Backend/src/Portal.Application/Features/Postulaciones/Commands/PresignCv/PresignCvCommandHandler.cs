using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Postulaciones.Commands.PresignCv;

public sealed class PresignCvCommandHandler : IRequestHandler<PresignCvCommand, Result<UrlSubidaDto>>
{
    /// <summary>Vigencia corta: el candidato sube el PDF en el mismo envío del formulario.</summary>
    private static readonly TimeSpan Vigencia = TimeSpan.FromMinutes(10);

    private readonly IAlmacenamientoObjetos _almacenamiento;

    public PresignCvCommandHandler(IAlmacenamientoObjetos almacenamiento)
    {
        _almacenamiento = almacenamiento;
    }

    public async Task<Result<UrlSubidaDto>> Handle(PresignCvCommand request, CancellationToken ct)
    {
        // Clave generada por el servidor, nunca el nombre original del archivo
        // (colisiones, caracteres problemáticos, a veces datos personales).
        var storageKey = $"postulaciones/{Guid.NewGuid():N}.pdf";

        var url = await _almacenamiento.GenerarUrlSubidaAsync(
            storageKey, "application/pdf", Vigencia, ct);

        return Result<UrlSubidaDto>.Success(
            new UrlSubidaDto(url, storageKey, (int)Vigencia.TotalSeconds));
    }
}
