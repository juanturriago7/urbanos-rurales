using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Artículo del blog del portal (tabla <c>articulos_blog</c>).
/// Spec 06 — módulo de blog completo, v1 con editor Markdown + portada por URL.
/// NO usa "publicaciones" en ningún identificador (esa palabra ya significa
/// inmuebles publicados — ver <c>Task/Specs/00-overview.md</c>).
/// </summary>
public sealed class ArticuloBlog
{
    public long Id { get; private set; }
    public string Titulo { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public string? Resumen { get; private set; }
    /// <summary>Cuerpo en Markdown. Se renderiza en frontend con sanitización.</summary>
    public string Contenido { get; private set; } = default!;
    public string? ImagenPortadaKey { get; private set; }
    public string? ImagenPortadaUrl { get; private set; }
    public string? MetaTitulo { get; private set; }
    public string? MetaDescripcion { get; private set; }
    public EstadoArticuloBlog Estado { get; private set; }
    public long? AutorId { get; private set; }
    public DateTime? PublicadoEn { get; private set; }
    public DateTime CreadoEn { get; private set; }
    public DateTime ActualizadoEn { get; private set; }

    // Constructor privado para hidratación Dapper — usa reflexión con setters privados.
    private ArticuloBlog() { }

    /// <summary>Constructor para materialización desde repositorio (Dapper).</summary>
    public ArticuloBlog(
        long id, string titulo, string slug, string? resumen, string contenido,
        string? imagenPortadaKey, string? imagenPortadaUrl,
        string? metaTitulo, string? metaDescripcion,
        EstadoArticuloBlog estado, long? autorId,
        DateTime? publicadoEn, DateTime creadoEn, DateTime actualizadoEn)
    {
        Id = id;
        Titulo = titulo;
        Slug = slug;
        Resumen = resumen;
        Contenido = contenido;
        ImagenPortadaKey = imagenPortadaKey;
        ImagenPortadaUrl = imagenPortadaUrl;
        MetaTitulo = metaTitulo;
        MetaDescripcion = metaDescripcion;
        Estado = estado;
        AutorId = autorId;
        PublicadoEn = publicadoEn;
        CreadoEn = creadoEn;
        ActualizadoEn = actualizadoEn;
    }

    public static ArticuloBlog Create(
        string titulo, string slug, string contenido,
        string? resumen = null, string? imagenPortadaKey = null,
        string? imagenPortadaUrl = null, string? metaTitulo = null,
        string? metaDescripcion = null, long? autorId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(titulo);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        ArgumentException.ThrowIfNullOrWhiteSpace(contenido);

        var ahora = DateTime.UtcNow;
        return new ArticuloBlog
        {
            Titulo = titulo.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Contenido = contenido,
            Resumen = resumen?.Trim(),
            ImagenPortadaKey = imagenPortadaKey,
            ImagenPortadaUrl = imagenPortadaUrl,
            MetaTitulo = metaTitulo?.Trim(),
            MetaDescripcion = metaDescripcion?.Trim(),
            Estado = EstadoArticuloBlog.Borrador,
            AutorId = autorId,
            CreadoEn = ahora,
            ActualizadoEn = ahora,
        };
    }

    public void Actualizar(
        string titulo, string contenido, string? resumen,
        string? imagenPortadaKey, string? imagenPortadaUrl,
        string? metaTitulo, string? metaDescripcion)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(titulo);
        ArgumentException.ThrowIfNullOrWhiteSpace(contenido);
        Titulo = titulo.Trim();
        Contenido = contenido;
        Resumen = resumen?.Trim();
        ImagenPortadaKey = imagenPortadaKey;
        ImagenPortadaUrl = imagenPortadaUrl;
        MetaTitulo = metaTitulo?.Trim();
        MetaDescripcion = metaDescripcion?.Trim();
        ActualizadoEn = DateTime.UtcNow;
    }

    /// <summary>
    /// Fija la portada tras confirmar la subida al bucket (flujo de presign).
    /// Independiente de <see cref="Actualizar"/>, que solo toca la URL manual
    /// heredada de la v1 y nunca la storage key (ver ActualizarArticuloCommand).
    /// </summary>
    public void EstablecerImagenPortada(string storageKey, string url)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(url);

        ImagenPortadaKey = storageKey;
        ImagenPortadaUrl = url;
        ActualizadoEn = DateTime.UtcNow;
    }

    public void CambiarEstado(EstadoArticuloBlog nuevoEstado)
    {
        var pasaba = Estado;
        Estado = nuevoEstado;
        if (nuevoEstado == EstadoArticuloBlog.Publicado && pasaba != EstadoArticuloBlog.Publicado)
        {
            PublicadoEn = DateTime.UtcNow;
        }
        ActualizadoEn = DateTime.UtcNow;
    }
}
