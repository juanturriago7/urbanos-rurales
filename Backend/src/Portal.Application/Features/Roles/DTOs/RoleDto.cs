namespace Portal.Application.Features.Roles.DTOs;

/// <summary>
/// DTO de lectura para Roles. Los repositorios proyectan directamente a DTOs en queries.
/// Nunca se expone la entidad de dominio directamente hacia afuera.
/// </summary>
public sealed record RoleDto(
    int Id,
    string Name,
    string Description,
    int UserCount
);
