using MediatR;
using Portal.Application.Features.Catalogos.DTOs;

namespace Portal.Application.Features.Catalogos.Queries.GetUbicacionesAdmin;

/// <summary>
/// Árbol completo de ubicaciones (zona/localidad/upz) para el panel admin —
/// incluye nodos inactivos para permitir su reactivación. Los barrios siguen
/// fuera del árbol por volumen.
/// </summary>
public sealed record GetUbicacionesAdminQuery : IRequest<IReadOnlyList<UbicacionNodoDto>>;
