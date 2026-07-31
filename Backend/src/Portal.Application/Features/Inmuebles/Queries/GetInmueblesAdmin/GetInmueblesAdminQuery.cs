using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetInmueblesAdmin;

/// <summary>Listado paginado del panel admin (GET /api/admin/inmuebles). RF-071.</summary>
public sealed record GetInmueblesAdminQuery(
    string? Estado,
    string? Q,
    PaginationParams Pagination) : IRequest<PagedResult<InmuebleAdminListItemDto>>;

public sealed class GetInmueblesAdminQueryValidator : AbstractValidator<GetInmueblesAdminQuery>
{
    private static readonly string[] EstadosValidos =
        ["borrador", "publicado", "pausado", "archivado"];

    public GetInmueblesAdminQueryValidator()
    {
        RuleFor(x => x.Estado)
            .Must(e => e is null || EstadosValidos.Contains(e))
            .WithMessage("Estado inválido (borrador | publicado | pausado | archivado).");
        RuleFor(x => x.Q).MaximumLength(200);
    }
}
