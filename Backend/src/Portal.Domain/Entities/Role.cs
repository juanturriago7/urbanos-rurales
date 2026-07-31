namespace Portal.Domain.Entities;

/// <summary>
/// Catálogo de roles (tabla <c>roles</c>). Es puramente descriptivo: el rol
/// efectivo de un usuario vive en <see cref="Usuario.Rol"/> como ENUM nativo.
/// Se conserva porque lo consume <c>GET /api/roles</c> desde el panel admin.
/// </summary>
/// <remarks>
/// Única entidad con nombres en inglés, heredada del slice original.
/// Todo lo construido desde el DDL del Task va en español.
/// </remarks>
public sealed class Role
{
    public int Id { get; private set; }
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public DateTime CreatedAt { get; private set; }

    private Role() { }

    public static Role Create(string name, string description)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new Role
        {
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };
    }
}
