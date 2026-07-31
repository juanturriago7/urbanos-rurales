using Portal.Application.Common;
using Portal.Application.Features.Leads.DTOs;
using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>Puerto del repositorio de leads (tabla <c>leads</c>).</summary>
public interface ILeadRepository
{
    Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default);

    Task<long> CreateAsync(Lead lead, CancellationToken ct = default);

    Task UpdateAsync(Lead lead, CancellationToken ct = default);

    Task<PagedResult<LeadDto>> GetPagedAsync(
        string? estado, long? inmuebleId, PaginationParams pagination, CancellationToken ct = default);
}
