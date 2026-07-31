using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Portal.Infrastructure.Persistence;

/// <summary>
/// Permite que las herramientas de EF construyan el contexto en tiempo de diseño
/// sin arrancar la API. Gracias a esto, <c>Add-Migration</c> funciona con
/// Portal.Infrastructure como proyecto predeterminado en la consola del
/// administrador de paquetes.
/// </summary>
/// <remarks>
/// La cadena de conexión se resuelve, en orden:
/// <list type="number">
///   <item>variable de entorno <c>ConnectionStrings__Default</c></item>
///   <item>variable de entorno <c>PORTAL_DB_CONNECTION</c></item>
///   <item>valor por defecto de desarrollo (el del docker-compose)</item>
/// </list>
/// Solo se usa para generar y aplicar migraciones; la API en runtime lee su
/// cadena de <c>appsettings</c> como siempre.
/// </remarks>
public sealed class PortalDbContextFactory : IDesignTimeDbContextFactory<PortalDbContext>
{
    private const string ConexionDesarrollo =
        "Host=localhost;Port=5432;Database=portal_db;Username=portal_user;Password=portal_pass";

    public PortalDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? Environment.GetEnvironmentVariable("PORTAL_DB_CONNECTION")
            ?? ConexionDesarrollo;

        var options = new DbContextOptionsBuilder<PortalDbContext>()
            .UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(PortalDbContext).Assembly.FullName))
            .Options;

        return new PortalDbContext(options);
    }
}
