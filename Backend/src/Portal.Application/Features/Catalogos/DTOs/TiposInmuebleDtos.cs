namespace Portal.Application.Features.Catalogos.DTOs;

/// <summary>Tipo de inmueble del catálogo (GET /api/catalogos/tipos-inmueble).</summary>
public sealed record TipoInmuebleDto(
    int Id,
    string Nombre,
    string Slug,
    bool EsPropiedadHorizontal);
