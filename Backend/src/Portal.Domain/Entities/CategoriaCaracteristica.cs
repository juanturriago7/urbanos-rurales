namespace Portal.Domain.Entities;

/// <summary>
/// Agrupador de características (tabla <c>categorias_caracteristica</c>):
/// "Interior", "Zonas comunes", "Servicios", "Seguridad".
/// Define cómo se agrupan los filtros en la UI pública.
/// </summary>
public sealed class CategoriaCaracteristica
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = default!;
    public short Orden { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private CategoriaCaracteristica() { }

    public static CategoriaCaracteristica Create(string nombre, short orden = 0)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        return new CategoriaCaracteristica
        {
            Nombre = nombre.Trim(),
            Orden = orden
        };
    }
}
