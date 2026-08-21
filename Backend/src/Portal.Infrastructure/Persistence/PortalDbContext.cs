using Microsoft.EntityFrameworkCore;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence;

/// <summary>
/// DbContext usado <b>exclusivamente para migraciones</b> (Add-Migration / Update-Database
/// desde la consola del administrador de paquetes).
/// </summary>
/// <remarks>
/// El acceso a datos en runtime sigue siendo Dapper a través de
/// <see cref="DbConnectionFactory"/>: este contexto NO se registra en el
/// contenedor de DI y ningún repositorio lo consume. Su única razón de existir
/// es describir el esquema para que EF genere el DDL.
/// <para>
/// Las migraciones no se aplican solas al arrancar la API — no hay ningún
/// <c>Migrate()</c>/<c>MigrateAsync()</c> en <c>Program.cs</c> a propósito.
/// </para>
/// </remarks>
public sealed class PortalDbContext : DbContext
{
    public PortalDbContext(DbContextOptions<PortalDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
    public DbSet<TipoInmueble> TiposInmueble => Set<TipoInmueble>();
    public DbSet<CategoriaCaracteristica> CategoriasCaracteristica => Set<CategoriaCaracteristica>();
    public DbSet<Caracteristica> Caracteristicas => Set<Caracteristica>();
    public DbSet<Inmueble> Inmuebles => Set<Inmueble>();
    public DbSet<InmuebleOperacion> InmuebleOperaciones => Set<InmuebleOperacion>();
    public DbSet<InmuebleCaracteristica> InmuebleCaracteristicas => Set<InmuebleCaracteristica>();
    public DbSet<Imagen> Imagenes => Set<Imagen>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<InmuebleHistorial> InmuebleHistorial => Set<InmuebleHistorial>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Extensiones requeridas por el esquema
        modelBuilder.HasPostgresExtension("pg_trgm");    // búsqueda difusa
        modelBuilder.HasPostgresExtension("unaccent");   // normalización de acentos
        modelBuilder.HasPostgresExtension("pgcrypto");   // hashing en seeds de desarrollo

        // ENUM nativos de PostgreSQL. Npgsql traduce el nombre del tipo CLR a
        // snake_case ('RolUsuario' -> 'rol_usuario') y cada miembro a su etiqueta
        // ('NoPermitidas' -> 'no_permitidas'), que es justo lo que define el DDL.
        modelBuilder.HasPostgresEnum<RolUsuario>();
        modelBuilder.HasPostgresEnum<TipoUbicacion>();
        modelBuilder.HasPostgresEnum<EstadoInmueble>();
        modelBuilder.HasPostgresEnum<PoliticaMascotas>();
        modelBuilder.HasPostgresEnum<TipoOperacion>();
        modelBuilder.HasPostgresEnum<EstadoOperacion>();
        modelBuilder.HasPostgresEnum<EstadoLead>();
        modelBuilder.HasPostgresEnum<EstadoArticuloBlog>();

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PortalDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
