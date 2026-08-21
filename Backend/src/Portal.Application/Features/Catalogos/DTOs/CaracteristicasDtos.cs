namespace Portal.Application.Features.Catalogos.DTOs;

public sealed record CaracteristicaDto(
    int Id, string Nombre, string? Icono, string TipoValor, bool Filtrable, bool Activo);

/// <summary>Fila plana característica + categoría, para agrupar en el handler.</summary>
public sealed record CaracteristicaPlanaDto(
    int Id, string Nombre, string? Icono, string TipoValor, bool Filtrable,
    int CategoriaId, string CategoriaNombre);

/// <summary>Categoría con sus características (GET /api/catalogos/caracteristicas).</summary>
public sealed record CategoriaCaracteristicasDto(
    int Id, string Nombre, IReadOnlyList<CaracteristicaDto> Caracteristicas);
