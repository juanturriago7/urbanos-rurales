namespace Portal.Application.Features.Catalogos.DTOs;

/// <summary>Fila plana de <c>ubicaciones</c> tal como sale de la BD.</summary>
public sealed record UbicacionPlanaDto(long Id, string Tipo, string Nombre, string Slug, long? PadreId, bool Activo);

/// <summary>
/// Resultado de búsqueda por nombre (GET /api/catalogos/ubicaciones/buscar), para el
/// combobox del formulario: los barrios no viajan en el árbol completo por volumen,
/// así que se resuelven bajo demanda con texto libre.
/// </summary>
public sealed record UbicacionBusquedaDto(long Id, string Tipo, string Nombre, string Slug, string RutaCompleta);

/// <summary>Nodo del árbol zona → localidad → upz → barrio (GET /api/catalogos/ubicaciones).</summary>
public sealed class UbicacionNodoDto
{
    public long Id { get; init; }
    public string Tipo { get; init; } = default!;
    public string Nombre { get; init; } = default!;
    public string Slug { get; init; } = default!;
    public bool Activo { get; init; }
    public List<UbicacionNodoDto> Hijos { get; init; } = [];
}
