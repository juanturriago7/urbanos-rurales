using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Portal.Application;

/// <summary>
/// Extensión de DI para registrar todos los servicios de Application.
/// Se llama desde Portal.Api/Program.cs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Registra todos los IRequestHandler<,> del ensamblado
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            // Pipeline behavior para validación automática con FluentValidation
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        // Registra todos los validators de FluentValidation del ensamblado
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
