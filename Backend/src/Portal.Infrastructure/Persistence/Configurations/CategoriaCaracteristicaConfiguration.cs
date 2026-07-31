using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class CategoriaCaracteristicaConfiguration : IEntityTypeConfiguration<CategoriaCaracteristica>
{
    public void Configure(EntityTypeBuilder<CategoriaCaracteristica> builder)
    {
        builder.ToTable("categorias_caracteristica");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
        builder.Property(c => c.Orden).HasColumnName("orden").IsRequired().HasDefaultValue((short)0);

        builder.HasIndex(c => c.Nombre).IsUnique();

        builder.HasData(
            new { Id = 1, Nombre = "Interior", Orden = (short)1 },
            new { Id = 2, Nombre = "Zonas comunes", Orden = (short)2 },
            new { Id = 3, Nombre = "Servicios", Orden = (short)3 },
            new { Id = 4, Nombre = "Seguridad", Orden = (short)4 });
    }
}
