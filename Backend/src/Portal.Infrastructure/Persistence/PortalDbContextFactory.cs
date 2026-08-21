using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Portal.Domain.Enums;

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
        "Host=localhost;Port=5433;Database=portal_db;Username=portal_user;Password=portal_pass";

    public PortalDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? Environment.GetEnvironmentVariable("PORTAL_DB_CONNECTION")
            ?? ConexionDesarrollo;

        var options = new DbContextOptionsBuilder<PortalDbContext>()
            .UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(PortalDbContext).Assembly.FullName);
                MapearEnums(npgsql);
            })
            .Options;

        return new PortalDbContext(options);
    }

    /// <summary>
    /// Asocia cada enum del dominio con su ENUM nativo de PostgreSQL.
    /// </summary>
    /// <remarks>
    /// <c>HasPostgresEnum&lt;T&gt;()</c> en <see cref="PortalDbContext.OnModelCreating"/>
    /// solo emite el <c>CREATE TYPE</c>; a partir de Npgsql 9 hace falta además
    /// registrar el enum aquí para que las columnas se generen con el tipo nativo.
    /// Sin esto EF cae al mapeo por defecto de un enum de CLR y las columnas salen
    /// como <c>integer</c>, lo que rompe el SQL de los repositorios Dapper
    /// (<c>estado = 'publicado'</c>, <c>CAST(@Rol AS rol_usuario)</c>) y los
    /// índices filtrados por etiqueta.
    /// Los nombres van explícitos para que el esquema no dependa del traductor
    /// de nombres por defecto.
    /// </remarks>
    private static void MapearEnums(Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure.NpgsqlDbContextOptionsBuilder npgsql)
    {
        npgsql.MapEnum<RolUsuario>("rol_usuario");
        npgsql.MapEnum<TipoUbicacion>("tipo_ubicacion");
        npgsql.MapEnum<EstadoInmueble>("estado_inmueble");
        npgsql.MapEnum<PoliticaMascotas>("politica_mascotas");
        npgsql.MapEnum<TipoOperacion>("tipo_operacion");
        npgsql.MapEnum<EstadoOperacion>("estado_operacion");
        npgsql.MapEnum<EstadoLead>("estado_lead");
        npgsql.MapEnum<EstadoArticuloBlog>("estado_articulo_blog");
    }
}
