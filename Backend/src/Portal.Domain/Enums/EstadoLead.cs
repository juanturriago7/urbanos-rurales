namespace Portal.Domain.Enums;

/// <summary>Estado de gestión de un lead (ENUM Postgres <c>estado_lead</c>).</summary>
public enum EstadoLead
{
    Nuevo = 1,
    Contactado = 2,
    Descartado = 3,
    Cerrado = 4
}
