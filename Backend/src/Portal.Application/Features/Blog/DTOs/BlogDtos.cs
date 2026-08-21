namespace Portal.Application.Features.Blog.DTOs;

/// <summary>Lectura pública — ítem de listado en /blog.</summary>
public sealed record ArticuloBlogListItemDto(
    long Id, string Titulo, string Slug, string? Resumen,
    string? ImagenPortadaUrl, string? AutorNombre,
    DateTime? PublicadoEn);

/// <summary>Lectura pública — detalle completo en /blog/{slug}.</summary>
public sealed record ArticuloBlogDetalleDto(
    long Id, string Titulo, string Slug, string? Resumen,
    string Contenido, string? ImagenPortadaUrl,
    string? MetaTitulo, string? MetaDescripcion,
    string? AutorNombre, DateTime? PublicadoEn, DateTime CreadoEn);

/// <summary>Lectura admin — incluye contenido completo y campos meta.</summary>
public sealed record ArticuloBlogAdminDto(
    long Id, string Titulo, string Slug, string? Resumen,
    string Contenido, string? ImagenPortadaKey, string? ImagenPortadaUrl,
    string? MetaTitulo, string? MetaDescripcion,
    string Estado, long? AutorId,
    DateTime? PublicadoEn, DateTime CreadoEn, DateTime ActualizadoEn);
