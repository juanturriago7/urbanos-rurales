namespace Portal.Infrastructure.Storage;

/// <summary>
/// Configuración del almacenamiento de objetos (sección <c>Storage</c>).
/// </summary>
/// <remarks>
/// Al hablar el protocolo de S3, la misma configuración sirve para MinIO en
/// desarrollo y para AWS S3, DigitalOcean Spaces o Cloudflare R2 en producción:
/// solo cambian <see cref="Endpoint"/> y las credenciales.
/// </remarks>
public sealed class OpcionesAlmacenamiento
{
    public const string Seccion = "Storage";

    /// <summary>Endpoint del servicio. Vacío para usar el de AWS según la región.</summary>
    public string? Endpoint { get; set; }

    public string Region { get; set; } = "us-east-1";

    public string Bucket { get; set; } = "portal-inmuebles";

    public string AccessKey { get; set; } = default!;

    public string SecretKey { get; set; } = default!;

    /// <summary>
    /// MinIO y la mayoría de los compatibles requieren rutas tipo
    /// <c>host/bucket/clave</c> en vez de <c>bucket.host/clave</c>.
    /// </summary>
    public bool ForcePathStyle { get; set; } = true;

    /// <summary>
    /// Base pública desde donde se sirven las imágenes (CDN). Se antepone a la
    /// clave del objeto al construir la URL que consume el frontend.
    /// </summary>
    public string UrlPublicaBase { get; set; } = default!;

    /// <summary>Minutos de vigencia de las URLs prefirmadas de subida.</summary>
    public int MinutosVigenciaSubida { get; set; } = 5;

    /// <summary>Tamaño máximo aceptado por imagen (RF-093).</summary>
    public int MaxBytesPorImagen { get; set; } = 10 * 1024 * 1024;
}
