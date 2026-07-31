namespace Portal.Domain.Entities;

/// <summary>
/// Auditoría de cambios de estado y precio (tabla <c>inmueble_historial</c>).
/// Opcional para el MVP, pero el modelo la incluye para no rediseñar (RNF-010).
/// </summary>
public sealed class InmuebleHistorial
{
    /// <summary>Campos cuyo cambio se audita.</summary>
    public static class Campos
    {
        public const string Estado = "estado";
        public const string PrecioVenta = "precio_venta";
        public const string PrecioArriendo = "precio_arriendo";
    }

    public long Id { get; private set; }
    public long InmuebleId { get; private set; }
    public string Campo { get; private set; } = default!;
    public string? ValorAnterior { get; private set; }
    public string? ValorNuevo { get; private set; }
    public long? UsuarioId { get; private set; }
    public DateTime CreadoEn { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private InmuebleHistorial() { }

    public static InmuebleHistorial Registrar(
        long inmuebleId,
        string campo,
        string? valorAnterior,
        string? valorNuevo,
        long? usuarioId)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(inmuebleId, 0);
        ArgumentException.ThrowIfNullOrWhiteSpace(campo);

        return new InmuebleHistorial
        {
            InmuebleId = inmuebleId,
            Campo = campo,
            ValorAnterior = valorAnterior,
            ValorNuevo = valorNuevo,
            UsuarioId = usuarioId,
            CreadoEn = DateTime.UtcNow
        };
    }
}
