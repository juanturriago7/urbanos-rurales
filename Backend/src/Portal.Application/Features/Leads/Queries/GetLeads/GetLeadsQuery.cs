using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Leads.DTOs;

namespace Portal.Application.Features.Leads.Queries.GetLeads;

/// <summary>Listado paginado de leads para el panel admin (GET /api/admin/leads).</summary>
public sealed record GetLeadsQuery(
    string? Estado,
    long? InmuebleId,
    PaginationParams Pagination) : IRequest<PagedResult<LeadDto>>;

public sealed class GetLeadsQueryValidator : AbstractValidator<GetLeadsQuery>
{
    private static readonly string[] EstadosValidos =
        ["nuevo", "contactado", "descartado", "cerrado"];

    public GetLeadsQueryValidator()
    {
        RuleFor(x => x.Estado)
            .Must(e => e is null || EstadosValidos.Contains(e))
            .WithMessage("Estado inválido (nuevo | contactado | descartado | cerrado).");
    }
}
