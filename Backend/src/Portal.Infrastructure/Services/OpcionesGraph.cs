namespace Portal.Infrastructure.Services;

/// <summary>
/// Configuración de la integración con Microsoft Graph para la agenda de visitas
/// (sección <c>Graph</c>). Sin <see cref="TenantId"/>/<see cref="ClientId"/>/
/// <see cref="ClientSecret"/> reales, la app usa el stub <c>AgendaLogService</c>.
/// </summary>
public sealed class OpcionesGraph
{
    public const string Seccion = "Graph";

    public string? TenantId { get; set; }

    public string? ClientId { get; set; }

    public string? ClientSecret { get; set; }

    /// <summary>
    /// UPN o id del buzón (usuario licenciado, sala o buzón compartido) donde se
    /// crean los eventos de visita. Es el organizador del evento.
    /// </summary>
    public string? MailboxVisitas { get; set; }

    /// <summary>Zona horaria IANA que se envía a Graph en el evento.</summary>
    public string ZonaHoraria { get; set; } = "America/Bogota";

    /// <summary>Authority de Entra ID para el flujo client-credentials.</summary>
    public string Instancia { get; set; } = "https://login.microsoftonline.com";

    /// <summary>Base del API de Graph.</summary>
    public string GraphBaseUrl { get; set; } = "https://graph.microsoft.com/v1.0";

    public bool EstaConfigurado()
        => Configurado(TenantId) && Configurado(ClientId)
        && Configurado(ClientSecret) && Configurado(MailboxVisitas);

    private static bool Configurado(string? valor)
        => !string.IsNullOrWhiteSpace(valor) && valor != "CHANGE_ME";
}
