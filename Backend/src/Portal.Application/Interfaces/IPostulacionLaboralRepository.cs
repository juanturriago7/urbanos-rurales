using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

public interface IPostulacionLaboralRepository
{
    Task<long> CreateAsync(PostulacionLaboral postulacion, CancellationToken ct = default);
}
