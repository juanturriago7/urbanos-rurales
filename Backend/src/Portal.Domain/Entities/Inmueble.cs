using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Inmueble (tabla <c>inmuebles</c>), entidad central del portal.
/// Reglas editoriales (RF-070..078) viven aquí; la orquestación (unicidad de
/// slug/código, conteo de imágenes para publicar) la resuelven los handlers.
/// </summary>
public sealed class Inmueble
{
    public long Id { get; private set; }
    public string CodigoReferencia { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public string Titulo { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    public int TipoInmuebleId { get; private set; }
    public long UbicacionId { get; private set; }

    // Dirección pública aproximada vs. privada exacta (RF-044)
    public string DireccionExacta { get; private set; } = default!;
    public decimal? LatitudExacta { get; private set; }
    public decimal? LongitudExacta { get; private set; }
    public decimal? LatitudAproximada { get; private set; }
    public decimal? LongitudAproximada { get; private set; }

    public decimal? AreaConstruidaM2 { get; private set; }
    public decimal? AreaPrivadaM2 { get; private set; }
    public short Habitaciones { get; private set; }
    public short Banos { get; private set; }
    public short Parqueaderos { get; private set; }
    public short? Piso { get; private set; }
    public short? PisosEdificio { get; private set; }
    public short? Estrato { get; private set; }
    public string? Antiguedad { get; private set; }
    public string? Orientacion { get; private set; }

    public PoliticaMascotas PoliticaMascotas { get; private set; }
    public string? Amoblado { get; private set; }

    public string? MatriculaInmobiliaria { get; private set; }

    public EstadoInmueble Estado { get; private set; }
    public bool Destacado { get; private set; }

    public string? MetaTitulo { get; private set; }
    public string? MetaDescripcion { get; private set; }

    public long? AsesorId { get; private set; }
    public long? CreadoPor { get; private set; }

    public DateTime CreadoEn { get; private set; }
    public DateTime ActualizadoEn { get; private set; }
    public DateTime? EliminadoEn { get; private set; }

    public bool EstaEliminado => EliminadoEn is not null;

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Inmueble() { }

    public static Inmueble Create(
        string codigoReferencia,
        string slug,
        string titulo,
        string? descripcion,
        int tipoInmuebleId,
        long ubicacionId,
        string direccionExacta,
        decimal? latitudAproximada = null,
        decimal? longitudAproximada = null,
        long? asesorId = null,
        long? creadoPor = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(codigoReferencia);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        ArgumentException.ThrowIfNullOrWhiteSpace(titulo);
        ArgumentException.ThrowIfNullOrWhiteSpace(direccionExacta);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(tipoInmuebleId, 0);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(ubicacionId, 0);

        var ahora = DateTime.UtcNow;

        return new Inmueble
        {
            CodigoReferencia = codigoReferencia,
            Slug = slug,
            Titulo = titulo.Trim(),
            Descripcion = descripcion?.Trim(),
            TipoInmuebleId = tipoInmuebleId,
            UbicacionId = ubicacionId,
            DireccionExacta = direccionExacta.Trim(),
            LatitudAproximada = latitudAproximada,
            LongitudAproximada = longitudAproximada,
            PoliticaMascotas = PoliticaMascotas.NoPermitidas,
            Amoblado = "no",
            Estado = EstadoInmueble.Borrador,
            Destacado = false,
            AsesorId = asesorId,
            CreadoPor = creadoPor,
            CreadoEn = ahora,
            ActualizadoEn = ahora
        };
    }

    /// <summary>Actualiza los datos editables (RF-072). No toca código, slug ni estado.</summary>
    public void ActualizarDatos(
        string titulo,
        string? descripcion,
        int tipoInmuebleId,
        long ubicacionId,
        string direccionExacta,
        decimal? latitudAproximada,
        decimal? longitudAproximada,
        decimal? latitudExacta,
        decimal? longitudExacta,
        decimal? areaConstruidaM2,
        decimal? areaPrivadaM2,
        short habitaciones,
        short banos,
        short parqueaderos,
        short? piso,
        short? pisosEdificio,
        short? estrato,
        string? antiguedad,
        string? orientacion,
        PoliticaMascotas politicaMascotas,
        string? amoblado,
        string? matriculaInmobiliaria,
        string? metaTitulo,
        string? metaDescripcion,
        long? asesorId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(titulo);
        ArgumentException.ThrowIfNullOrWhiteSpace(direccionExacta);

        if (estrato is < 1 or > 6)
        {
            throw new ArgumentOutOfRangeException(nameof(estrato), "El estrato debe estar entre 1 y 6.");
        }

        Titulo = titulo.Trim();
        Descripcion = descripcion?.Trim();
        TipoInmuebleId = tipoInmuebleId;
        UbicacionId = ubicacionId;
        DireccionExacta = direccionExacta.Trim();
        LatitudAproximada = latitudAproximada;
        LongitudAproximada = longitudAproximada;
        LatitudExacta = latitudExacta;
        LongitudExacta = longitudExacta;
        AreaConstruidaM2 = areaConstruidaM2;
        AreaPrivadaM2 = areaPrivadaM2;
        Habitaciones = habitaciones;
        Banos = banos;
        Parqueaderos = parqueaderos;
        Piso = piso;
        PisosEdificio = pisosEdificio;
        Estrato = estrato;
        Antiguedad = antiguedad;
        Orientacion = orientacion;
        PoliticaMascotas = politicaMascotas;
        Amoblado = amoblado;
        MatriculaInmobiliaria = matriculaInmobiliaria;
        MetaTitulo = metaTitulo;
        MetaDescripcion = metaDescripcion;
        AsesorId = asesorId;
        MarcarActualizado();
    }

    /// <summary>
    /// Cambia el estado editorial (RF-075). La validación de publicación
    /// (imágenes + campos obligatorios, RF-077) se hace en el handler porque
    /// requiere consultar imágenes y operaciones.
    /// </summary>
    public void CambiarEstado(EstadoInmueble nuevoEstado)
    {
        if (EstaEliminado)
        {
            throw new InvalidOperationException("No se puede cambiar el estado de un inmueble eliminado.");
        }

        Estado = nuevoEstado;
        MarcarActualizado();
    }

    /// <summary>RF-077: campos mínimos que exige la publicación (las imágenes se validan aparte).</summary>
    public bool TieneCamposObligatoriosParaPublicar()
        => !string.IsNullOrWhiteSpace(Titulo)
           && !string.IsNullOrWhiteSpace(Descripcion)
           && TipoInmuebleId > 0
           && UbicacionId > 0
           && !string.IsNullOrWhiteSpace(DireccionExacta);

    /// <summary>Marca o desmarca como destacado (RF-078).</summary>
    public void MarcarDestacado(bool destacado)
    {
        Destacado = destacado;
        MarcarActualizado();
    }

    /// <summary>Borrado lógico (RF-073): conserva el registro, lo saca del sitio público.</summary>
    public void EliminarLogico()
    {
        EliminadoEn = DateTime.UtcNow;
        Estado = EstadoInmueble.Archivado;
        MarcarActualizado();
    }

    private void MarcarActualizado() => ActualizadoEn = DateTime.UtcNow;
}
