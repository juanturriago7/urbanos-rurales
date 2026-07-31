using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Leads.DTOs;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Leads.Queries.GetLeads;

public sealed class GetLeadsQueryHandler
    : IRequestHandler<GetLeadsQuery, PagedResult<LeadDto>>
{
    private readonly ILeadRepository _leads;

    public GetLeadsQueryHandler(ILeadRepository leads)
    {
        _leads = leads;
    }

    public Task<PagedResult<LeadDto>> Handle(GetLeadsQuery request, CancellationToken ct)
        => _leads.GetPagedAsync(
            request.Estado, request.InmuebleId, request.Pagination.WithClamp(), ct);
}
