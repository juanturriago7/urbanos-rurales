using Amazon.S3;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;
using Portal.Infrastructure.Repositories;
using Portal.Infrastructure.Services;
using Portal.Infrastructure.Storage;

namespace Portal.Infrastructure;

/// <summary>
/// Extensión de DI para registrar todos los servicios de Infrastructure.
/// Se llama desde Portal.Api/Program.cs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' not found.");

        // DbConnectionFactory como Singleton (la cadena de conexión no cambia)
        services.AddSingleton(_ => new DbConnectionFactory(connectionString));

        // Repositorios — Scoped: una instancia por request HTTP
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        services.AddScoped<ICatalogoRepository, CatalogoRepository>();
        services.AddScoped<IUbicacionAdminRepository, UbicacionAdminRepository>();
        services.AddScoped<ITipoInmuebleAdminRepository, TipoInmuebleAdminRepository>();
        services.AddScoped<ICaracteristicaAdminRepository, CaracteristicaAdminRepository>();
        services.AddScoped<IArticuloBlogRepository, ArticuloBlogRepository>();
        services.AddScoped<IPostulacionLaboralRepository, PostulacionLaboralRepository>();
        services.AddScoped<IInmuebleRepository, InmuebleRepository>();
        services.AddScoped<IInmueblePublicoRepository, InmueblePublicoRepository>();
        services.AddScoped<ILeadRepository, LeadRepository>();
        services.AddScoped<IImagenRepository, ImagenRepository>();

        // Servicios transversales — sin estado: Singleton
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        services.AddCorreo(configuration);
        services.AddAlmacenamientoObjetos(configuration);
        services.AddNotificaciones(configuration);
        services.AddAgenda(configuration);

        return services;
    }

    /// <summary>
    /// Destinatarios de correos internos (RR. HH., equipo comercial) y los
    /// notificadores que los usan. Sin estado: Singleton.
    /// </summary>
    private static IServiceCollection AddNotificaciones(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<OpcionesNotificaciones>(
            configuration.GetSection(OpcionesNotificaciones.Seccion));

        services.AddSingleton<INotificadorPostulaciones, NotificadorPostulacionesCorreo>();
        services.AddSingleton<INotificadorVisitas, NotificadorVisitasCorreo>();

        return services;
    }

    /// <summary>
    /// Agenda real sobre Microsoft Graph si la sección "Graph" trae tenant,
    /// cliente, secreto y buzón; si no (desarrollo/staging sin registro de app),
    /// cae al stub que solo escribe el evento al log.
    /// </summary>
    private static IServiceCollection AddAgenda(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var seccion = configuration.GetSection(OpcionesGraph.Seccion);
        services.Configure<OpcionesGraph>(seccion);

        static bool Configurado(string? valor)
            => !string.IsNullOrWhiteSpace(valor) && valor != "CHANGE_ME";

        var graphConfigurado =
            Configurado(seccion["TenantId"]) && Configurado(seccion["ClientId"])
            && Configurado(seccion["ClientSecret"]) && Configurado(seccion["MailboxVisitas"]);

        if (graphConfigurado)
        {
            services.AddSingleton<IAgendaVisitasService, GraphAgendaService>();
        }
        else
        {
            services.AddSingleton<IAgendaVisitasService, AgendaLogService>();
        }

        return services;
    }

    /// <summary>
    /// SMTP real si la sección "Correo" trae un Host configurado; si no
    /// (desarrollo sin credenciales a mano), cae al stub que solo loguea.
    /// </summary>
    private static IServiceCollection AddCorreo(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<OpcionesCorreo>(configuration.GetSection(OpcionesCorreo.Seccion));

        var host = configuration[$"{OpcionesCorreo.Seccion}:Host"];
        var correoConfigurado = !string.IsNullOrWhiteSpace(host) && host != "CHANGE_ME";

        if (correoConfigurado)
        {
            services.AddSingleton<ICorreoService, SmtpCorreoService>();
        }
        else
        {
            services.AddSingleton<ICorreoService, CorreoLogService>();
        }

        return services;
    }

    /// <summary>
    /// Cliente de almacenamiento de objetos hablando el protocolo de S3, así que
    /// vale igual para MinIO en desarrollo y para AWS S3, DigitalOcean Spaces o
    /// Cloudflare R2 en producción: solo cambia la configuración.
    /// </summary>
    private static IServiceCollection AddAlmacenamientoObjetos(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<OpcionesAlmacenamiento>(
            configuration.GetSection(OpcionesAlmacenamiento.Seccion));

        services.AddSingleton<IAmazonS3>(sp =>
        {
            var opciones = sp.GetRequiredService<IOptions<OpcionesAlmacenamiento>>().Value;

            var config = new AmazonS3Config
            {
                // MinIO y la mayoría de los compatibles necesitan rutas
                // host/bucket/clave en vez de bucket.host/clave.
                ForcePathStyle = opciones.ForcePathStyle,
                AuthenticationRegion = opciones.Region
            };

            if (!string.IsNullOrWhiteSpace(opciones.Endpoint))
            {
                config.ServiceURL = opciones.Endpoint;

                // El SDK no deriva el esquema de las URLs prefirmadas a partir de
                // ServiceURL: GetPreSignedURLAsync firma en https salvo que UseHttp
                // sea explícito. Sin esto, contra MinIO local (http, sin TLS) el
                // navegador no puede completar el PUT — la URL firmada apunta a un
                // puerto que no habla TLS.
                config.UseHttp = opciones.Endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(opciones.Region);
            }

            return new AmazonS3Client(opciones.AccessKey, opciones.SecretKey, config);
        });

        services.AddSingleton<IAlmacenamientoObjetos, S3AlmacenamientoObjetos>();

        return services;
    }
}
