using FluentValidation;
using MediatR;
using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Features.Catalogos.Queries.BuscarUbicaciones;

/// <summary>Búsqueda por nombre para el combobox de ubicación (GET /api/catalogos/ubicaciones/buscar).</summary>
public sealed record BuscarUbicacionesQuery(string Termino) : IRequest<IReadOnlyList<UbicacionBusquedaDto>>;

public sealed class BuscarUbicacionesQueryValidator : AbstractValidator<BuscarUbicacionesQuery>
{
    public BuscarUbicacionesQueryValidator()
    {
        RuleFor(x => x.Termino).NotEmpty().MinimumLength(2).MaximumLength(120);
    }
}
