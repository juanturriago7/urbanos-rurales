namespace Portal.Domain.Entities;

/// <summary>
/// Postulación a un cargo (formulario "Trabaja con nosotros" en la página Quiénes
/// somos — spec 07). Bandeja de entrada simple sin estado: leer/descargar y listo.
/// </summary>
public sealed class PostulacionLaboral
{
    public long Id { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string Correo { get; private set; } = default!;
    public string? Telefono { get; private set; }
    public string? CargoInteres { get; private set; }
    public string? Mensaje { get; private set; }
    /// <summary>Storage key del PDF de la hoja de vida en el bucket.</summary>
    public string CvStorageKey { get; private set; } = default!;
    /// <summary>URL pública (o prefirmada) del CV para descarga.</summary>
    public string CvUrl { get; private set; } = default!;
    public string? IpOrigen { get; private set; }
    public DateTime CreadoEn { get; private set; }

    private PostulacionLaboral() { }

    public PostulacionLaboral(
        string nombre, string correo, string? telefono, string? cargoInteres,
        string? mensaje, string cvStorageKey, string cvUrl, string? ipOrigen)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(correo);
        ArgumentException.ThrowIfNullOrWhiteSpace(cvStorageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(cvUrl);

        Nombre = nombre.Trim();
        Correo = correo.Trim();
        Telefono = telefono?.Trim();
        CargoInteres = cargoInteres?.Trim();
        Mensaje = mensaje?.Trim();
        CvStorageKey = cvStorageKey;
        CvUrl = cvUrl;
        IpOrigen = ipOrigen;
        CreadoEn = DateTime.UtcNow;
    }
}
