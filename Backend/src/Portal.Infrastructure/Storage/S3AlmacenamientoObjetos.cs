using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Storage;

/// <summary>
/// Implementación de <see cref="IAlmacenamientoObjetos"/> sobre el protocolo de S3.
/// </summary>
/// <remarks>
/// Funciona igual contra AWS S3, DigitalOcean Spaces, Cloudflare R2 o MinIO: lo
/// único que cambia es el endpoint de la configuración.
/// </remarks>
internal sealed class S3AlmacenamientoObjetos : IAlmacenamientoObjetos
{
    private readonly IAmazonS3 _s3;
    private readonly OpcionesAlmacenamiento _opciones;

    public S3AlmacenamientoObjetos(IAmazonS3 s3, IOptions<OpcionesAlmacenamiento> opciones)
    {
        _s3 = s3;
        _opciones = opciones.Value;
    }

    public Task<string> GenerarUrlSubidaAsync(
        string storageKey,
        string contentType,
        TimeSpan vigencia,
        CancellationToken ct = default)
    {
        var peticion = new GetPreSignedUrlRequest
        {
            BucketName = _opciones.Bucket,
            Key = storageKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(vigencia),
            // Queda dentro de la firma: si el navegador sube con otro Content-Type,
            // el almacenamiento rechaza la subida.
            ContentType = contentType,
            // El SDK no deriva el esquema de la URL prefirmada desde ServiceURL: sin
            // esto firma en https por defecto, aunque el endpoint (MinIO local, sin
            // TLS) sea http. El PUT del navegador nunca llegaría a conectar.
            Protocol = _opciones.Endpoint?.StartsWith("http://", StringComparison.OrdinalIgnoreCase) == true
                ? Protocol.HTTP
                : Protocol.HTTPS
        };

        return _s3.GetPreSignedURLAsync(peticion);
    }

    public async Task<ObjetoAlmacenado> ObtenerInfoAsync(
        string storageKey,
        CancellationToken ct = default)
    {
        try
        {
            var meta = await _s3.GetObjectMetadataAsync(
                new GetObjectMetadataRequest { BucketName = _opciones.Bucket, Key = storageKey },
                ct);

            return new ObjetoAlmacenado(true, meta.ContentLength, meta.Headers.ContentType);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // El objeto no existe: la subida nunca se completó.
            return new ObjetoAlmacenado(false, 0, null);
        }
    }

    public async Task EliminarObjetoAsync(string storageKey, CancellationToken ct = default)
    {
        await _s3.DeleteObjectAsync(
            new DeleteObjectRequest { BucketName = _opciones.Bucket, Key = storageKey },
            ct);
    }

    public string ConstruirUrlPublica(string storageKey)
        => $"{_opciones.UrlPublicaBase.TrimEnd('/')}/{storageKey}";
}
