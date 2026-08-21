using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.BuscarInmuebles;

/// <summary>Búsqueda pública con filtros combinables, orden y paginación (RF-021..025).</summary>
public sealed record BuscarInmueblesQuery(InmueblesFiltro Filtro, PaginationParams Pagination)
    : IRequest<PagedResult<InmueblePublicoListItemDto>>;

public sealed class BuscarInmueblesQueryValidator : AbstractValidator<BuscarInmueblesQuery>
{
    private static readonly string[] OperacionesValidas = ["venta", "arriendo"];

    private static readonly string[] OrdenesValidos =
        ["reciente", "precio_asc", "precio_desc", "area_asc", "area_desc"];

    public BuscarInmueblesQueryValidator()
    {
        RuleFor(x => x.Filtro.Operacion)
            .Must(o => o is null || OperacionesValidas.Contains(o))
            .WithMessage("Operación inválida (venta | arriendo).");
        RuleFor(x => x.Filtro.Orden)
            .Must(o => o is null || OrdenesValidos.Contains(o))
            .WithMessage("Orden inválido (reciente | precio_asc | precio_desc | area_asc | area_desc).");
        RuleFor(x => x.Filtro.PrecioMin).GreaterThanOrEqualTo(0).When(x => x.Filtro.PrecioMin is not null);
        RuleFor(x => x.Filtro.PrecioMax).GreaterThanOrEqualTo(0).When(x => x.Filtro.PrecioMax is not null);
        RuleFor(x => x.Filtro.Estrato)
            .InclusiveBetween((short)1, (short)6)
            .When(x => x.Filtro.Estrato is not null);
        RuleFor(x => x.Filtro.Q).MaximumLength(200);
        RuleForEach(x => x.Filtro.CaracteristicaIds).GreaterThan(0)
            .When(x => x.Filtro.CaracteristicaIds is not null);
    }
}
