using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Catálogo descriptivo de roles. Nombres en inglés por herencia del slice original.
/// </summary>
internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
        builder.Property(r => r.Description)
               .HasColumnName("description").HasMaxLength(255).IsRequired().HasDefaultValue(string.Empty);
        builder.Property(r => r.CreatedAt)
               .HasColumnName("created_at").IsRequired().HasDefaultValueSql("now()");

        builder.HasIndex(r => r.Name).IsUnique();

        // Sin 'Editor': el ENUM rol_usuario solo define admin y asesor.
        builder.HasData(
            new { Id = 1, Name = "Admin", Description = "Acceso total al sistema", CreatedAt = SeedConstants.Fecha },
            new { Id = 2, Name = "Asesor", Description = "Gestión de propiedades y leads asignados", CreatedAt = SeedConstants.Fecha });
    }
}
