using System.Net;
using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Lead de contacto (tabla <c>leads</c>), general o asociado a un inmueble (RF-003).
/// El consentimiento de tratamiento de datos es obligatorio (RNF-061).
/// </summary>
public sealed class Lead
{
    public long Id { get; private set; }
    public long? InmuebleId { get; private set; }
    public string Nombre { get; private set; } = default!;
    public string? Correo { get; private set; }
    public string? Telefono { get; private set; }
    public string? Mensaje { get; private set; }
    public string Origen { get; private set; } = default!;
    public string? UtmSource { get; private set; }
    public string? UtmCampaign { get; private set; }
    public bool AceptoTratamientoDatos { get; private set; }
    public EstadoLead Estado { get; private set; }
    public long? AsignadoA { get; private set; }

    /// <summary>Columna <c>INET</c>: Npgsql la mapea a <see cref="IPAddress"/>, no a string.</summary>
    public IPAddress? IpOrigen { get; private set; }
    public DateTime CreadoEn { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private Lead() { }

    public static Lead Create(
        string nombre,
        string origen,
        bool aceptoTratamientoDatos,
        long? inmuebleId = null,
        string? correo = null,
        string? telefono = null,
        string? mensaje = null,
        string? utmSource = null,
        string? utmCampaign = null,
        IPAddress? ipOrigen = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(origen);

        if (!aceptoTratamientoDatos)
        {
            throw new ArgumentException(
                "El consentimiento de tratamiento de datos es obligatorio (RNF-061).",
                nameof(aceptoTratamientoDatos));
        }

        if (string.IsNullOrWhiteSpace(correo) && string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("El lead debe tener al menos correo o teléfono.");
        }

        return new Lead
        {
            Nombre = nombre.Trim(),
            Origen = origen.Trim(),
            AceptoTratamientoDatos = true,
            InmuebleId = inmuebleId,
            Correo = string.IsNullOrWhiteSpace(correo) ? null : correo.Trim().ToLowerInvariant(),
            Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim(),
            Mensaje = string.IsNullOrWhiteSpace(mensaje) ? null : mensaje.Trim(),
            UtmSource = utmSource,
            UtmCampaign = utmCampaign,
            IpOrigen = ipOrigen,
            Estado = EstadoLead.Nuevo,
            CreadoEn = DateTime.UtcNow
        };
    }

    public void CambiarEstado(EstadoLead estado) => Estado = estado;

    public void Asignar(long usuarioId)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(usuarioId, 0);
        AsignadoA = usuarioId;
    }
}
