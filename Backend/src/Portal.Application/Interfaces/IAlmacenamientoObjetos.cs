namespace Portal.Application.Interfaces;

/// <summary>Datos de un objeto ya presente en el almacenamiento.</summary>
public sealed record ObjetoAlmacenado(bool Existe, long PesoBytes, string? ContentType);

/// <summary>
/// Puerto hacia el almacenamiento de objetos (RNF-013: el binario nunca vive en
/// el filesystem del servidor).
/// </summary>
/// <remarks>
/// La API no transporta los bytes: firma una URL para que el navegador suba
/// directo al bucket y después confirma que el objeto llegó. Esto mantiene los
/// handlers como consultas de milisegundos y evita ocupar hilos de request con
/// transferencias largas — cada inmueble lleva de 5 a 10 imágenes (RF-090).
/// <para>
/// La implementación habla el protocolo de S3, así que sirve igual para AWS S3,
/// DigitalOcean Spaces, Cloudflare R2 o MinIO en desarrollo.
/// </para>
/// </remarks>
public interface IAlmacenamientoObjetos
{
    /// <summary>
    /// Genera una URL PUT prefirmada de vida corta para subir un objeto.
    /// El <paramref name="contentType"/> queda fijado en la firma: si el
    /// navegador sube otra cosa, el almacenamiento rechaza la petición.
    /// </summary>
    Task<string> GenerarUrlSubidaAsync(
        string storageKey,
        string contentType,
        TimeSpan vigencia,
        CancellationToken ct = default);

    /// <summary>
    /// Consulta el objeto sin descargarlo. Es lo que impide registrar en la base
    /// una imagen que nunca se subió, y da el peso real en lugar del que declare
    /// el cliente.
    /// </summary>
    Task<ObjetoAlmacenado> ObtenerInfoAsync(string storageKey, CancellationToken ct = default);

    Task EliminarObjetoAsync(string storageKey, CancellationToken ct = default);

    /// <summary>
    /// Ruta pública relativa que se guarda en <c>imagenes.url_cdn</c>.
    /// Se guarda relativa a propósito: si mañana cambia el dominio del CDN o el
    /// proveedor, basta con cambiar configuración en vez de reescribir filas.
    /// </summary>
    string ConstruirUrlPublica(string storageKey);
}
