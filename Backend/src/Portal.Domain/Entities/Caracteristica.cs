namespace Portal.Domain.Entities;

/// <summary>
/// Amenidad o atributo catalogado (tabla <c>caracteristicas</c>): "Piscina",
/// "Ascensor", "Closets"… Agregar una nueva es un INSERT, sin migración (RNF-011).
/// </summary>
public sealed class Caracteristica
{
    /// <summary>Valores admitidos en <see cref="TipoValor"/> (columna VARCHAR del DDL).</summary>
    public static class TiposValor
    {
        public const string Booleano = "booleano";
        public const string Numero = "numero";
        public const string Texto = "texto";

        public static bool EsValido(string valor)
            => valor is Booleano or Numero or Texto;
    }

    public int Id { get; private set; }
    public int CategoriaId { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string? Icono { get; private set; }

    /// <summary>booleano | numero | texto — determina cómo se interpreta el valor asociado.</summary>
    public string TipoValor { get; private set; } = default!;

    /// <summary>Controla si la característica se ofrece como filtro público.</summary>
    public bool Filtrable { get; private set; }
    public bool Activo { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Caracteristica() { }

    public static Caracteristica Create(
        int categoriaId,
        string nombre,
        string tipoValor = TiposValor.Booleano,
        bool filtrable = true,
        string? icono = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(categoriaId, 0);

        if (!TiposValor.EsValido(tipoValor))
        {
            throw new ArgumentException(
                $"Tipo de valor no soportado: '{tipoValor}'. Use booleano, numero o texto.",
                nameof(tipoValor));
        }

        return new Caracteristica
        {
            CategoriaId = categoriaId,
            Nombre = nombre.Trim(),
            TipoValor = tipoValor,
            Filtrable = filtrable,
            Icono = icono,
            Activo = true
        };
    }

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;
}
