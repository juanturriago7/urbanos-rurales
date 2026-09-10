using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;

namespace Portal.Infrastructure.Services;

/// <summary>
/// Implementación real de <see cref="IAgendaVisitasService"/> sobre Microsoft Graph.
/// Flujo OAuth client-credentials (app-only) + <c>POST /users/{buzon}/events</c>.
/// Se registra en vez de <see cref="AgendaLogService"/> cuando la sección
/// <c>Graph</c> trae tenant, cliente, secreto y buzón (ver
/// <c>DependencyInjection.AddAgenda</c>).
/// </summary>
/// <remarks>
/// Se habla el API REST directo con <see cref="HttpClient"/> en vez del SDK de
/// Graph: las únicas operaciones necesarias son crear un evento y pedir el token,
/// y así el proyecto no suma dependencias pesadas.
/// </remarks>
internal sealed class GraphAgendaService : IAgendaVisitasService
{
    private static readonly TimeSpan MargenRenovacion = TimeSpan.FromSeconds(60);

    // El servicio es singleton: un único HttpClient de larga vida es el patrón
    // recomendado y evita sumar Microsoft.Extensions.Http solo por la factory.
    private readonly HttpClient _http = new();
    private readonly OpcionesGraph _opciones;
    private readonly ILogger<GraphAgendaService> _logger;

    private readonly SemaphoreSlim _tokenGate = new(1, 1);
    private string? _token;
    private DateTimeOffset _tokenExpiraEn = DateTimeOffset.MinValue;

    public GraphAgendaService(
        IOptions<OpcionesGraph> opciones,
        ILogger<GraphAgendaService> logger)
    {
        _opciones = opciones.Value;
        _logger = logger;
    }

    public async Task<string?> CrearEventoVisitaAsync(DatosEventoVisita datos, CancellationToken ct = default)
    {
        var token = await ObtenerTokenAsync(ct);

        var inicio = datos.InicioLocal.ToString("yyyy-MM-ddTHH:mm:ss");
        var fin = datos.InicioLocal.Add(datos.Duracion).ToString("yyyy-MM-ddTHH:mm:ss");

        var cuerpo = new StringBuilder()
            .AppendLine($"Solicitud de visita al inmueble {datos.CodigoReferencia} — {datos.TituloInmueble}.")
            .AppendLine()
            .AppendLine($"Cliente: {datos.NombreCliente}")
            .AppendLine($"Correo: {datos.CorreoCliente}")
            .AppendLine($"Teléfono: {datos.TelefonoCliente ?? "-"}")
            .AppendLine($"Dirección: {datos.DireccionInmueble}")
            .AppendLine()
            .AppendLine("Mensaje del cliente:")
            .AppendLine(datos.Mensaje ?? "(sin mensaje)")
            .ToString();

        var evento = new
        {
            subject = $"Visita {datos.CodigoReferencia} — {datos.NombreCliente}",
            body = new { contentType = "text", content = cuerpo },
            start = new { dateTime = inicio, timeZone = _opciones.ZonaHoraria },
            end = new { dateTime = fin, timeZone = _opciones.ZonaHoraria },
            location = new { displayName = $"{datos.DireccionInmueble} (Ref. {datos.CodigoReferencia})" },
            attendees = new[]
            {
                new
                {
                    emailAddress = new { address = datos.CorreoCliente, name = datos.NombreCliente },
                    type = "required",
                },
            },
            isReminderOn = true,
            reminderMinutesBeforeStart = 60,
            // Graph deduplica reintentos con el mismo transactionId: evita eventos
            // duplicados si el navegador reenvía el formulario.
            transactionId = TransactionId(datos),
        };

        using var peticion = new HttpRequestMessage(
            HttpMethod.Post,
            $"{_opciones.GraphBaseUrl.TrimEnd('/')}/users/{Uri.EscapeDataString(_opciones.MailboxVisitas!)}/events")
        {
            Content = JsonContent.Create(evento),
        };
        peticion.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        peticion.Headers.TryAddWithoutValidation("Prefer", $"outlook.timezone=\"{_opciones.ZonaHoraria}\"");

        using var respuesta = await _http.SendAsync(peticion, ct);
        var contenido = await respuesta.Content.ReadAsStringAsync(ct);

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Graph respondió {(int)respuesta.StatusCode} al crear el evento: {Recortar(contenido)}");
        }

        using var doc = JsonDocument.Parse(contenido);
        var id = doc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;

        _logger.LogInformation(
            "Evento de visita creado en Graph ({Buzon}) para el inmueble {Codigo}: {EventoId}",
            _opciones.MailboxVisitas, datos.CodigoReferencia, id);

        return id;
    }

    private async Task<string> ObtenerTokenAsync(CancellationToken ct)
    {
        if (_token is not null && DateTimeOffset.UtcNow < _tokenExpiraEn - MargenRenovacion)
        {
            return _token;
        }

        await _tokenGate.WaitAsync(ct);
        try
        {
            if (_token is not null && DateTimeOffset.UtcNow < _tokenExpiraEn - MargenRenovacion)
            {
                return _token;
            }

            using var respuesta = await _http.PostAsync(
                $"{_opciones.Instancia.TrimEnd('/')}/{_opciones.TenantId}/oauth2/v2.0/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = _opciones.ClientId!,
                    ["client_secret"] = _opciones.ClientSecret!,
                    ["scope"] = "https://graph.microsoft.com/.default",
                    ["grant_type"] = "client_credentials",
                }),
                ct);

            var contenido = await respuesta.Content.ReadAsStringAsync(ct);

            if (!respuesta.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"No se pudo obtener el token de Graph ({(int)respuesta.StatusCode}): {Recortar(contenido)}");
            }

            using var doc = JsonDocument.Parse(contenido);
            var raiz = doc.RootElement;
            var token = raiz.GetProperty("access_token").GetString()
                ?? throw new InvalidOperationException("La respuesta de token de Graph no trae access_token.");
            var expiraEnSegundos = raiz.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 3600;

            _token = token;
            _tokenExpiraEn = DateTimeOffset.UtcNow.AddSeconds(expiraEnSegundos);
            return token;
        }
        finally
        {
            _tokenGate.Release();
        }
    }

    private static string TransactionId(DatosEventoVisita datos)
    {
        var semilla = $"{datos.InmuebleId}|{datos.CorreoCliente}|{datos.InicioLocal:yyyyMMddHHmm}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(semilla));
        return "visita-" + Convert.ToHexStringLower(hash)[..32];
    }

    private static string Recortar(string texto)
        => texto.Length <= 500 ? texto : texto[..500] + "…";
}
