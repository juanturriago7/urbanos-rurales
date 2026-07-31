namespace Portal.Domain.Enums;

/// <summary>
/// Roles del panel administrativo (Task/BackEnd/02-modelo-de-datos.md §2.3).
/// Se persiste en el ENUM nativo <c>rol_usuario</c> de PostgreSQL, cuyas etiquetas
/// van en minúscula ('admin', 'asesor'); el repositorio hace la conversión.
/// El nombre PascalCase es el que viaja como claim de rol en el JWT.
/// </summary>
public enum RolUsuario
{
    Admin = 1,
    Asesor = 2
}
