using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Inmuebles.Queries.GetResumenDestacados;

public sealed class GetResumenDestacadosQueryHandler
    : IRequestHandler<GetResumenDestacadosQuery, DestacadosResumenDto>
{
    private readonly IInmuebleRepository _inmuebles;

    public GetResumenDestacadosQueryHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<DestacadosResumenDto> Handle(
        GetResumenDestacadosQuery request, CancellationToken ct)
        => new(await _inmuebles.ContarDestacadosAsync(ct), Inmueble.MaximoDestacados);
}
