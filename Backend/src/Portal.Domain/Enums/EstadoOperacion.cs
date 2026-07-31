namespace Portal.Domain.Enums;

/// <summary>Estado comercial de una operación (ENUM Postgres <c>estado_operacion</c>).</summary>
public enum EstadoOperacion
{
    Disponible = 1,
    Reservado = 2,
    Cerrado = 3
}
