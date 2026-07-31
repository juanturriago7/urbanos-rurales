namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Constantes compartidas por los datos semilla (<c>HasData</c>).
/// </summary>
internal static class SeedConstants
{
    /// <summary>
    /// Marca temporal fija de los registros semilla. Debe ser una constante:
    /// usar <c>DateTime.UtcNow</c> en <c>HasData</c> haría que EF detecte un
    /// cambio en el modelo y generara una migración nueva en cada ejecución.
    /// </summary>
    public static readonly DateTime Fecha = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
}
