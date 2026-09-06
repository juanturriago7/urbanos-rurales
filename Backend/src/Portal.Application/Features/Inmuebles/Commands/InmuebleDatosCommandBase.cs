using FluentValidation;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Commands;

/// <summary>Campos editables compartidos por crear/actualizar inmueble.</summary>
public abstract record InmuebleDatosCommandBase
{
    public string Titulo { get; init; } = default!;
    public string? Descripcion { get; init; }
    public int TipoInmuebleId { get; init; }
    public long UbicacionId { get; init; }
    public string DireccionExacta { get; init; } = default!;

    // Spec 03 — área de terreno obligatoria si el tipo no es PH, área construida
    // obligatoria si sí lo es (InmuebleDatosValidatorBase, regla cruzada contra
    // tipos_inmueble vía ITipoInmuebleAdminRepository).
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

    /// <summary>'permitidas' | 'no_permitidas' | 'con_restricciones' (contrato snake_case).</summary>
    public string PoliticaMascotas { get; init; } = "no_permitidas";

    /// <summary>'si' | 'no' | 'semi'.</summary>
    public string? Amoblado { get; init; }

    public string? MatriculaInmobiliaria { get; init; }
    public string? MetaTitulo { get; init; }
    public string? MetaDescripcion { get; init; }
    public long? AsesorId { get; init; }

    public List<CaracteristicaValorInput>? Caracteristicas { get; init; }
}

/// <summary>Reglas compartidas de validación para los datos del inmueble.</summary>
public abstract class InmuebleDatosValidatorBase<T> : AbstractValidator<T>
    where T : InmuebleDatosCommandBase
{
    private static readonly string[] PoliticasValidas =
        ["permitidas", "no_permitidas", "con_restricciones"];

    private static readonly string[] AmobladoValidos = ["si", "no", "semi"];

    protected InmuebleDatosValidatorBase(ITipoInmuebleAdminRepository tiposInmueble)
    {
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Descripcion).MaximumLength(10_000);
        RuleFor(x => x.TipoInmuebleId).GreaterThan(0);
        RuleFor(x => x.UbicacionId).GreaterThan(0);
        RuleFor(x => x.DireccionExacta).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AreaTerrenoM2).GreaterThan(0).When(x => x.AreaTerrenoM2 is not null);
        RuleFor(x => x.AreaConstruidaM2).GreaterThan(0).When(x => x.AreaConstruidaM2 is not null);
        RuleFor(x => x.AreaPrivadaM2).GreaterThan(0).When(x => x.AreaPrivadaM2 is not null);
        RuleFor(x => x.YoutubeUrl)
            .Must(u => u!.Contains("youtube.com") || u!.Contains("youtu.be"))
            .When(x => !string.IsNullOrEmpty(x.YoutubeUrl))
            .WithMessage("El link debe ser una URL de YouTube.");
        RuleFor(x => x.MapaEmbedUrl)
            .Must(u => u!.StartsWith("https://www.google.com/maps/embed"))
            .When(x => !string.IsNullOrEmpty(x.MapaEmbedUrl))
            .WithMessage("El mapa debe ser una URL de embed de Google Maps (https://www.google.com/maps/embed...).");
        RuleFor(x => x.Habitaciones).GreaterThanOrEqualTo((short)0);
        RuleFor(x => x.Banos).GreaterThanOrEqualTo((short)0);
        RuleFor(x => x.Parqueaderos).GreaterThanOrEqualTo((short)0);
        RuleFor(x => x.Estrato)
            .InclusiveBetween((short)1, (short)6)
            .When(x => x.Estrato is not null)
            .WithMessage("El estrato debe estar entre 1 y 6.");
        RuleFor(x => x.PoliticaMascotas)
            .Must(v => PoliticasValidas.Contains(v))
            .WithMessage("Política de mascotas inválida (permitidas | no_permitidas | con_restricciones).");
        RuleFor(x => x.Amoblado)
            .Must(v => v is null || AmobladoValidos.Contains(v))
            .WithMessage("Amoblado inválido (si | no | semi).");
        RuleFor(x => x.MetaTitulo).MaximumLength(160);
        RuleFor(x => x.MetaDescripcion).MaximumLength(320);
        RuleForEach(x => x.Caracteristicas)
            .ChildRules(c =>
            {
                c.RuleFor(x => x.CaracteristicaId).GreaterThan(0);
                c.RuleFor(x => x.Valor).MaximumLength(60);
            })
            .When(x => x.Caracteristicas is not null);

        // Spec 03 — regla cruzada con el catálogo: un tipo "propiedad horizontal"
        // (apartamento, oficina, local...) exige área construida; los demás
        // (casa, lote, bodega...) exigen área de terreno. Si el tipo no existe,
        // GreaterThan(0) de arriba ya reportó el problema — aquí no se duplica.
        RuleFor(x => x).CustomAsync(async (cmd, context, ct) =>
        {
            if (cmd.TipoInmuebleId <= 0) return;

            var tipo = await tiposInmueble.GetByIdAsync(cmd.TipoInmuebleId, ct);
            if (tipo is null) return;

            if (tipo.EsPropiedadHorizontal)
            {
                if (cmd.AreaConstruidaM2 is null || cmd.AreaConstruidaM2 <= 0)
                {
                    context.AddFailure(
                        nameof(InmuebleDatosCommandBase.AreaConstruidaM2),
                        "El área construida es obligatoria para este tipo de inmueble.");
                }
            }
            else if (cmd.AreaTerrenoM2 is null || cmd.AreaTerrenoM2 <= 0)
            {
                context.AddFailure(
                    nameof(InmuebleDatosCommandBase.AreaTerrenoM2),
                    "El área de terreno es obligatoria para este tipo de inmueble.");
            }
        });
    }
}
