using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        builder.Property(u => u.Correo).HasColumnName("correo").HasMaxLength(150).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();

        builder.Property(u => u.Rol)
               .HasColumnName("rol").IsRequired().HasDefaultValue(RolUsuario.Asesor);

        builder.Property(u => u.Telefono).HasColumnName("telefono").HasMaxLength(30);
        builder.Property(u => u.Activo).HasColumnName("activo").IsRequired().HasDefaultValue(true);

        // RF-063: bloqueo tras intentos fallidos consecutivos
        builder.Property(u => u.IntentosFallidos)
               .HasColumnName("intentos_fallidos").IsRequired().HasDefaultValue((short)0);
        builder.Property(u => u.BloqueadoHasta).HasColumnName("bloqueado_hasta");

        // Sesión única por usuario: se guarda el hash, nunca el token en claro
        builder.Property(u => u.RefreshTokenHash).HasColumnName("refresh_token_hash");
        builder.Property(u => u.RefreshTokenExpira).HasColumnName("refresh_token_expira");

        builder.Property(u => u.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasIndex(u => u.Correo).IsUnique();
        builder.HasIndex(u => u.Rol).HasDatabaseName("idx_usuarios_rol").HasFilter("activo = TRUE");
    }
}
