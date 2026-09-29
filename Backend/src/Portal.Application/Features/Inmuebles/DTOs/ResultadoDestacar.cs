namespace Portal.Application.Features.Inmuebles.DTOs;

/// <summary>Desenlace de <c>IInmuebleRepository.DestacarConCupoAsync</c> (RF-078).</summary>
public enum ResultadoDestacar
{
    /// <summary>Quedó destacado.</summary>
    Destacado,

    /// <summary>Ya hay <c>Inmueble.MaximoDestacados</c> destacados publicados.</summary>
    SinCupo,

    /// <summary>
    /// Entre la lectura del handler y el bloqueo dejó de estar publicado o se
    /// eliminó (carrera con otro admin).
    /// </summary>
    NoDisponible,
}
