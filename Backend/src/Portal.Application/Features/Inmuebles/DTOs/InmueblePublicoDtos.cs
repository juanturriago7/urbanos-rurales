namespace Portal.Application.Features.Inmuebles.DTOs;

// El detalle público NUNCA expone direccion_exacta ni lat/long exactas (RF-044).

public sealed record InmueblePublicoListItemDto(
    long Id,
    string Slug,
    string CodigoReferencia,
    string Titulo,
    string TipoInmueble,
    string Ubicacion,
    short Habitaciones,
    short Banos,
    short Parqueaderos,
    decimal? AreaTerrenoM2,
    decimal? AreaConstruidaM2,
    short? Estrato,
    bool Destacado,
    decimal? PrecioVenta,
    decimal? PrecioArriendo,
    string? ImagenPortada);

/// <summary>Nivel de la jerarquía de ubicación para el breadcrumb (zona → … → barrio).</summary>
public sealed record UbicacionRefDto(long Id, string Tipo, string Nombre, string Slug);

public sealed class InmueblePublicoDetalleDto
{
    public long Id { get; init; }
    public string Slug { get; init; } = default!;
    public string CodigoReferencia { get; init; } = default!;
    public string Titulo { get; init; } = default!;
    public string? Descripcion { get; init; }
    public string TipoInmueble { get; init; } = default!;
    public int TipoInmuebleId { get; init; }
    public bool EsPropiedadHorizontal { get; init; }
    public long UbicacionId { get; init; }
    public decimal? AreaTerrenoM2 { get; init; }
    public decimal? AreaConstruidaM2 { get; init; }
    public decimal? AreaPrivadaM2 { get; init; }
    public string? YoutubeUrl { get; init; }
    public string? MapaEmbedUrl { get; init; }
    public short Habitaciones { get; init; }
    public short Banos { get; init; }
    public short Parqueaderos { get; init; }
    public short? Piso { get; init; }
    public short? PisosEdificio { get; init; }
    public short? Estrato { get; init; }
    public string? Antiguedad { get; init; }
    public string? Orientacion { get; init; }
    public string PoliticaMascotas { get; init; } = default!;
    public string? Amoblado { get; init; }
    public bool Destacado { get; init; }
    public string? MetaTitulo { get; init; }
    public string? MetaDescripcion { get; init; }
    public DateTime CreadoEn { get; init; }
    public IReadOnlyList<UbicacionRefDto> Ubicacion { get; set; } = [];
    public IReadOnlyList<OperacionDto> Operaciones { get; set; } = [];
    public IReadOnlyList<CaracteristicaValorDto> Caracteristicas { get; set; } = [];
    public IReadOnlyList<ImagenDto> Imagenes { get; set; } = [];
}

/// <summary>Entrada del sitemap dinámico (RNF-051): slug + última modificación.</summary>
public sealed record SitemapEntradaDto(string Slug, DateTime ActualizadoEn);

/// <summary>Filtros del buscador público (RF-021). Etiquetas snake_case del contrato.</summary>
public sealed record InmueblesFiltro(
    string? Operacion,        // 'venta' | 'arriendo'
    string? Tipo,             // slug del tipo de inmueble
    long? UbicacionId,        // cualquier nivel: filtra el subárbol completo
    decimal? PrecioMin,
    decimal? PrecioMax,
    decimal? AreaMin,
    decimal? AreaMax,
    short? Habitaciones,      // mínimo
    short? Banos,             // mínimo
    short? Parqueaderos,      // mínimo
    bool? Mascotas,           // true = permitidas o con restricciones
    short? Estrato,
    bool? AdminIncluida,
    IReadOnlyList<int>? CaracteristicaIds,  // AND: el inmueble debe tenerlas todas
    string? Q,                // texto libre (RF-025)
    string? Orden);           // reciente | precio_asc | precio_desc | area_asc | area_desc
