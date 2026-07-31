namespace Portal.Domain.Enums;

/// <summary>Estado editorial del inmueble (RF-075, ENUM Postgres <c>estado_inmueble</c>).</summary>
public enum EstadoInmueble
{
    Borrador = 1,
    Publicado = 2,
    Pausado = 3,
    Archivado = 4
}
