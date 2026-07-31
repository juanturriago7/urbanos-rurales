namespace Portal.Domain.Entities;

/// <summary>
/// Relación N:M entre inmueble y característica (tabla <c>inmueble_caracteristicas</c>).
/// La clave primaria es compuesta (inmueble, característica).
/// </summary>
public sealed class InmuebleCaracteristica
{
    public long InmuebleId { get; private set; }
    public int CaracteristicaId { get; private set; }

    /// <summary>
    /// Valor asociado: "3" para closets, NULL en características booleanas
    /// (la sola presencia de la fila implica <c>true</c>).
    /// </summary>
    public string? Valor { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private InmuebleCaracteristica() { }

    public static InmuebleCaracteristica Create(long inmuebleId, int caracteristicaId, string? valor = null)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(inmuebleId, 0);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(caracteristicaId, 0);

        return new InmuebleCaracteristica
        {
            InmuebleId = inmuebleId,
            CaracteristicaId = caracteristicaId,
            Valor = string.IsNullOrWhiteSpace(valor) ? null : valor.Trim()
        };
    }

    public void EstablecerValor(string? valor)
        => Valor = string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
