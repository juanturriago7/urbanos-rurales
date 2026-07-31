using Portal.Domain.Enums;

namespace Portal.Application.Common;

/// <summary>
/// Conversión entre las etiquetas snake_case del contrato de API / ENUMs de
/// Postgres y los enums del dominio. Los DTOs exponen siempre la etiqueta de BD.
/// </summary>
public static class ContratoEnums
{
    public static PoliticaMascotas ParsePoliticaMascotas(string valor) => valor switch
    {
        "permitidas" => PoliticaMascotas.Permitidas,
        "no_permitidas" => PoliticaMascotas.NoPermitidas,
        "con_restricciones" => PoliticaMascotas.ConRestricciones,
        _ => throw new ArgumentException($"Política de mascotas inválida: '{valor}'.", nameof(valor))
    };

    public static string ToApi(PoliticaMascotas valor) => valor switch
    {
        PoliticaMascotas.Permitidas => "permitidas",
        PoliticaMascotas.NoPermitidas => "no_permitidas",
        PoliticaMascotas.ConRestricciones => "con_restricciones",
        _ => throw new ArgumentOutOfRangeException(nameof(valor))
    };

    public static EstadoInmueble ParseEstadoInmueble(string valor) => valor switch
    {
        "borrador" => EstadoInmueble.Borrador,
        "publicado" => EstadoInmueble.Publicado,
        "pausado" => EstadoInmueble.Pausado,
        "archivado" => EstadoInmueble.Archivado,
        _ => throw new ArgumentException($"Estado de inmueble inválido: '{valor}'.", nameof(valor))
    };

    public static string ToApi(EstadoInmueble valor) => valor.ToString().ToLowerInvariant();

    public static TipoOperacion ParseTipoOperacion(string valor) => valor switch
    {
        "venta" => TipoOperacion.Venta,
        "arriendo" => TipoOperacion.Arriendo,
        _ => throw new ArgumentException($"Tipo de operación inválido: '{valor}'.", nameof(valor))
    };

    public static string ToApi(TipoOperacion valor) => valor.ToString().ToLowerInvariant();

    public static EstadoOperacion ParseEstadoOperacion(string valor) => valor switch
    {
        "disponible" => EstadoOperacion.Disponible,
        "reservado" => EstadoOperacion.Reservado,
        "cerrado" => EstadoOperacion.Cerrado,
        _ => throw new ArgumentException($"Estado de operación inválido: '{valor}'.", nameof(valor))
    };

    public static string ToApi(EstadoOperacion valor) => valor.ToString().ToLowerInvariant();

    public static EstadoLead ParseEstadoLead(string valor) => valor switch
    {
        "nuevo" => EstadoLead.Nuevo,
        "contactado" => EstadoLead.Contactado,
        "descartado" => EstadoLead.Descartado,
        "cerrado" => EstadoLead.Cerrado,
        _ => throw new ArgumentException($"Estado de lead inválido: '{valor}'.", nameof(valor))
    };

    public static string ToApi(EstadoLead valor) => valor.ToString().ToLowerInvariant();
}
