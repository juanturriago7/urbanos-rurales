using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Postulaciones.Commands.CrearPostulacion;

public sealed class CrearPostulacionCommandHandler
    : IRequestHandler<CrearPostulacionCommand, Result<long>>
{
    private const int MaxBytes = 5 * 1024 * 1024;
    private const string PrefijoEsperado = "postulaciones/";

    private readonly IPostulacionLaboralRepository _repo;
    private readonly IAlmacenamientoObjetos _almacenamiento;

    public CrearPostulacionCommandHandler(
        IPostulacionLaboralRepository repo,
        IAlmacenamientoObjetos almacenamiento)
    {
        _repo = repo;
        _almacenamiento = almacenamiento;
    }

    public async Task<Result<long>> Handle(CrearPostulacionCommand request, CancellationToken ct)
    {
        // La clave la genera el servidor en PresignCvCommandHandler con este
        // prefijo. Comprobarlo impide registrar como CV un objeto ajeno del bucket.
        if (!request.CvStorageKey.StartsWith(PrefijoEsperado, StringComparison.Ordinal))
        {
            return Result<long>.Failure("La clave del CV no es válida.");
        }

        // Sin esta verificación se podría crear una postulación apuntando a un
        // PDF que nunca se subió. De paso valida el peso real, no el declarado.
        var objeto = await _almacenamiento.ObtenerInfoAsync(request.CvStorageKey, ct);

        if (!objeto.Existe)
        {
            return Result<long>.Failure("El CV no llegó al almacenamiento. Vuelve a intentar la subida.");
        }

        if (objeto.PesoBytes > MaxBytes)
        {
            await _almacenamiento.EliminarObjetoAsync(request.CvStorageKey, ct);
            return Result<long>.Failure($"El CV supera el máximo de {MaxBytes / (1024 * 1024)} MB.");
        }

        var cvUrl = _almacenamiento.ConstruirUrlPublica(request.CvStorageKey);

        var postulacion = new PostulacionLaboral(
            request.Nombre, request.Correo, request.Telefono, request.CargoInteres,
            request.Mensaje, request.CvStorageKey, cvUrl, request.IpOrigen);

        var id = await _repo.CreateAsync(postulacion, ct);
        return Result.Success(id);
    }
}
