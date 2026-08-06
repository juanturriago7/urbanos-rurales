namespace Portal.Application.Features.Catalogos.DTOs;

/// <summary>Fila plana de <c>ubicaciones</c> tal como sale de la BD.</summary>
public sealed record UbicacionPlanaDto(long Id, string Tipo, string Nombre, string Slug, long? PadreId);

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
    public List<UbicacionNodoDto> Hijos { get; init; } = [];
}

public sealed record TipoInmuebleDto(int Id, string Nombre, string Slug);

public sealed record CaracteristicaDto(
    int Id, string Nombre, string? Icono, string TipoValor, bool Filtrable);

/// <summary>Fila plana característica + categoría, para agrupar en el handler.</summary>
public sealed record CaracteristicaPlanaDto(
    int Id, string Nombre, string? Icono, string TipoValor, bool Filtrable,
    int CategoriaId, string CategoriaNombre);

/// <summary>Categoría con sus características (GET /api/catalogos/caracteristicas).</summary>
public sealed record CategoriaCaracteristicasDto(
    int Id, string Nombre, IReadOnlyList<CaracteristicaDto> Caracteristicas);
