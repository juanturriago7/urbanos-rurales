using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Portal.Application.Interfaces;
using Portal.Infrastructure.Persistence;
using Portal.Infrastructure.Repositories;
using Portal.Infrastructure.Services;

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
        services.AddScoped<IInmuebleRepository, InmuebleRepository>();
        services.AddScoped<IInmueblePublicoRepository, InmueblePublicoRepository>();
        services.AddScoped<ILeadRepository, LeadRepository>();

        // Servicios transversales — sin estado: Singleton
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<ICorreoService, CorreoLogService>();

        return services;
    }
}
