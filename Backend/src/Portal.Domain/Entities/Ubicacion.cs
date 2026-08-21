using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Nodo de la jerarquía de ubicaciones (tabla <c>ubicaciones</c>):
/// zona → localidad → upz → barrio, enlazados por <see cref="PadreId"/>.
/// Los inmuebles apuntan al nivel más específico (barrio); para filtrar por
/// zona o localidad completa se sube por <c>padre_id</c>.
/// </summary>
public sealed class Ubicacion
{
    public long Id { get; private set; }
    public TipoUbicacion Tipo { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public long? PadreId { get; private set; }
    public bool Activo { get; private set; }
    public DateTime CreadoEn { get; private set; }

    /// <summary>Solo las zonas carecen de padre; el resto de niveles lo exigen.</summary>
    public bool EsRaiz => PadreId is null;

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Ubicacion() { }

    public static Ubicacion Create(TipoUbicacion tipo, string nombre, string slug, long? padreId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        if (tipo != TipoUbicacion.Zona && padreId is null)
        {
            throw new ArgumentException(
                $"Una ubicación de tipo '{tipo}' requiere una ubicación padre.", nameof(padreId));
        }

        return new Ubicacion
        {
            Tipo = tipo,
            Nombre = nombre.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            PadreId = padreId,
            Activo = true,
            CreadoEn = DateTime.UtcNow
        };
    }

    public void Renombrar(string nombre, string slug)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        Nombre = nombre.Trim();
        Slug = slug.Trim().ToLowerInvariant();
    }

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;

    public void Reubicar(long? nuevoPadreId)
    {
        if (Tipo != TipoUbicacion.Zona && nuevoPadreId is null)
        {
            throw new ArgumentException(
                $"Una ubicación de tipo '{Tipo}' requiere una ubicación padre.", nameof(nuevoPadreId));
        }

        PadreId = nuevoPadreId;
    }
}
