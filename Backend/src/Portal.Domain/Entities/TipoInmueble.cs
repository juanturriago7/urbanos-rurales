namespace Portal.Domain.Entities;

/// <summary>
/// Catálogo de tipos de inmueble (tabla <c>tipos_inmueble</c>).
///
/// <para>
/// <see cref="EsPropiedadHorizontal"/> distingue tipos donde el inmueble es una
/// unidad dentro de un edificio/conjunto con áreas comunes administradas
/// (apartamento, oficina, local) de tipos donde el inmueble ocupa el predio
/// completo (casa, lote, bodega, edificio). Lo usa la spec 03 para mostrar u
/// ocultar el campo "área de terreno" en la ficha del inmueble.
/// </para>
/// </summary>
public sealed class TipoInmueble
{
    public int Id { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public bool Activo { get; private set; }
    public short Orden { get; private set; }
    public bool EsPropiedadHorizontal { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private TipoInmueble() { }

    public static TipoInmueble Create(
        string nombre, string slug, bool esPropiedadHorizontal, short orden = 0)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        return new TipoInmueble
        {
            Nombre = nombre.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Activo = true,
            Orden = orden,
            EsPropiedadHorizontal = esPropiedadHorizontal,
        };
    }

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;

    public void Actualizar(string nombre, short orden, bool esPropiedadHorizontal)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        Nombre = nombre.Trim();
        Orden = orden;
        EsPropiedadHorizontal = esPropiedadHorizontal;
    }
}
