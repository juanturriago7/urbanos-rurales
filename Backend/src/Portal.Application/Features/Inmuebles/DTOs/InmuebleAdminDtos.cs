namespace Portal.Application.Features.Inmuebles.DTOs;

// ── Inputs compartidos por Crear/Actualizar ─────────────────────────────────

/// <summary>Operación comercial en el payload de creación (etiquetas snake_case del contrato).</summary>
public sealed record OperacionInput(
    string TipoOperacion,            // 'venta' | 'arriendo'
    decimal Precio,
    decimal? CuotaAdministracion,
    bool AdminIncluida);

public sealed record CaracteristicaValorInput(int CaracteristicaId, string? Valor);

// ── Lecturas del panel admin ────────────────────────────────────────────────

public sealed record InmuebleAdminListItemDto(
    long Id,
    string CodigoReferencia,
    string Slug,
    string Titulo,
    string TipoInmueble,
    string Ubicacion,
    string Estado,
    bool Destacado,
    decimal? PrecioVenta,
    decimal? PrecioArriendo,
    string? ImagenPortada,
    DateTime ActualizadoEn);

public sealed record OperacionDto(
    long Id,
    string TipoOperacion,
    decimal Precio,
    decimal? CuotaAdministracion,
    bool AdminIncluida,
    string Estado,
    bool Activo);

public sealed record CaracteristicaValorDto(
    int CaracteristicaId,
    string Nombre,
    string Categoria,
    string? Valor);

public sealed record ImagenDto(
    long Id,
    string UrlCdn,
    string? UrlThumbnail,
    string Formato,
    short Orden,
    bool EsPortada,
    string? TextoAlt);

/// <summary>Detalle completo para el panel admin — incluye la dirección exacta (RF-044).</summary>
public sealed class InmuebleAdminDetalleDto
{
    public long Id { get; init; }
    public string CodigoReferencia { get; init; } = default!;
    public string Slug { get; init; } = default!;
    public string Titulo { get; init; } = default!;
    public string? Descripcion { get; init; }
    public int TipoInmuebleId { get; init; }
    public long UbicacionId { get; init; }
    public string DireccionExacta { get; init; } = default!;
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
    public string? MatriculaInmobiliaria { get; init; }
    public string Estado { get; init; } = default!;
    public bool Destacado { get; init; }
    public string? MetaTitulo { get; init; }
    public string? MetaDescripcion { get; init; }
    public long? AsesorId { get; init; }
    public DateTime CreadoEn { get; init; }
    public DateTime ActualizadoEn { get; init; }
    public IReadOnlyList<OperacionDto> Operaciones { get; set; } = [];
    public IReadOnlyList<CaracteristicaValorDto> Caracteristicas { get; set; } = [];
    public IReadOnlyList<ImagenDto> Imagenes { get; set; } = [];
}
