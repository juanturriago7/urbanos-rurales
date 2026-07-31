using FluentValidation;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Commands;

/// <summary>Campos editables compartidos por crear/actualizar inmueble.</summary>
public abstract record InmuebleDatosCommandBase
{
    public string Titulo { get; init; } = default!;
    public string? Descripcion { get; init; }
    public int TipoInmuebleId { get; init; }
    public long UbicacionId { get; init; }
    public string DireccionExacta { get; init; } = default!;
    public decimal? LatitudExacta { get; init; }
    public decimal? LongitudExacta { get; init; }
    public decimal LatitudAproximada { get; init; }
    public decimal LongitudAproximada { get; init; }
    public decimal? AreaConstruidaM2 { get; init; }
    public decimal? AreaPrivadaM2 { get; init; }
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

    protected InmuebleDatosValidatorBase()
    {
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Descripcion).MaximumLength(10_000);
        RuleFor(x => x.TipoInmuebleId).GreaterThan(0);
        RuleFor(x => x.UbicacionId).GreaterThan(0);
        RuleFor(x => x.DireccionExacta).NotEmpty().MaximumLength(200);
        RuleFor(x => x.LatitudAproximada).InclusiveBetween(-90, 90);
        RuleFor(x => x.LongitudAproximada).InclusiveBetween(-180, 180);
        RuleFor(x => x.AreaConstruidaM2).GreaterThan(0).When(x => x.AreaConstruidaM2 is not null);
        RuleFor(x => x.AreaPrivadaM2).GreaterThan(0).When(x => x.AreaPrivadaM2 is not null);
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
    }
}
