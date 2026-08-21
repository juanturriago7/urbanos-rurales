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
        services.AddSingleton<ICorreoService, CorreoLogService>();

        services.AddAlmacenamientoObjetos(configuration);

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
