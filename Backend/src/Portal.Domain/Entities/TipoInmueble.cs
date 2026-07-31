namespace Portal.Domain.Entities;

/// <summary>
/// Catálogo de tipos de inmueble (tabla <c>tipos_inmueble</c>):
/// apartamento, casa, apartaestudio, local, oficina, bodega, lote.
/// </summary>
public sealed class TipoInmueble
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public bool Activo { get; private set; }
    public short Orden { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private TipoInmueble() { }

    public static TipoInmueble Create(string nombre, string slug, short orden = 0)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        return new TipoInmueble
        {
            Nombre = nombre.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Activo = true,
            Orden = orden
        };
    }

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;
}
