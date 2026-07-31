namespace Portal.Domain.Entities;

/// <summary>
/// Metadatos de una imagen del inmueble (tabla <c>imagenes</c>).
/// El binario vive en almacenamiento de objetos, nunca en el filesystem del
/// servidor (RNF-013); aquí solo se guardan la clave y las URLs públicas.
/// </summary>
public sealed class Imagen
{
    /// <summary>Formatos aceptados al subir (RF-093).</summary>
    public static class Formatos
    {
        public const string Jpg = "jpg";
        public const string Png = "png";
        public const string Webp = "webp";

        public static bool EsValido(string formato)
            => formato is Jpg or Png or Webp;
    }

    public long Id { get; private set; }
    public long InmuebleId { get; private set; }
    public string StorageKey { get; private set; } = default!;
    public string UrlCdn { get; private set; } = default!;
    public string? UrlThumbnail { get; private set; }
    public string Formato { get; private set; } = default!;
    public int? PesoBytes { get; private set; }
    public short Orden { get; private set; }
    public bool EsPortada { get; private set; }
    public string? TextoAlt { get; private set; }
    public DateTime CreadoEn { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Imagen() { }

    public static Imagen Create(
        long inmuebleId,
        string storageKey,
        string urlCdn,
        string formato,
        string? urlThumbnail = null,
        int? pesoBytes = null,
        short orden = 0,
        string? textoAlt = null)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(inmuebleId, 0);
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(urlCdn);

        var formatoNormalizado = formato?.Trim().ToLowerInvariant() ?? string.Empty;

        if (!Formatos.EsValido(formatoNormalizado))
        {
            throw new ArgumentException(
                $"Formato no soportado: '{formato}'. Use jpg, png o webp.", nameof(formato));
        }

        return new Imagen
        {
            InmuebleId = inmuebleId,
            StorageKey = storageKey,
            UrlCdn = urlCdn,
            UrlThumbnail = urlThumbnail,
            Formato = formatoNormalizado,
            PesoBytes = pesoBytes,
            Orden = orden,
            EsPortada = false,
            TextoAlt = textoAlt,
            CreadoEn = DateTime.UtcNow
        };
    }

    /// <summary>
    /// RF-091. La unicidad de portada por inmueble la garantiza el índice parcial
    /// <c>idx_una_portada</c>; el handler debe desmarcar la anterior en la misma transacción.
    /// </summary>
    public void MarcarComoPortada(bool esPortada) => EsPortada = esPortada;

    public void Reordenar(short orden) => Orden = orden;

    /// <summary>RF-094: el texto alternativo es contenido editable (accesibilidad y SEO).</summary>
    public void EditarTextoAlt(string? textoAlt)
        => TextoAlt = string.IsNullOrWhiteSpace(textoAlt) ? null : textoAlt.Trim();

    /// <summary>Registra las URLs generadas por el pipeline de compresión/WebP (RF-092).</summary>
    public void EstablecerDerivadas(string urlCdn, string? urlThumbnail, string formato, int? pesoBytes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(urlCdn);

        UrlCdn = urlCdn;
        UrlThumbnail = urlThumbnail;
        Formato = formato.Trim().ToLowerInvariant();
        PesoBytes = pesoBytes;
    }
}
