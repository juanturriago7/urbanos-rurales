using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class TipoInmuebleConfiguration : IEntityTypeConfiguration<TipoInmueble>
{
    public void Configure(EntityTypeBuilder<TipoInmueble> builder)
    {
        builder.ToTable("tipos_inmueble");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.Nombre).HasColumnName("nombre").HasMaxLength(60).IsRequired();
        builder.Property(t => t.Slug).HasColumnName("slug").HasMaxLength(70).IsRequired();
        builder.Property(t => t.Activo).HasColumnName("activo").IsRequired().HasDefaultValue(true);
        builder.Property(t => t.Orden).HasColumnName("orden").IsRequired().HasDefaultValue((short)0);

        builder.HasIndex(t => t.Nombre).IsUnique();
        builder.HasIndex(t => t.Slug).IsUnique();

        builder.HasData(
            new { Id = 1, Nombre = "Apartamento", Slug = "apartamento", Activo = true, Orden = (short)1 },
            new { Id = 2, Nombre = "Casa", Slug = "casa", Activo = true, Orden = (short)2 },
            new { Id = 3, Nombre = "Apartaestudio", Slug = "apartaestudio", Activo = true, Orden = (short)3 },
            new { Id = 4, Nombre = "Local", Slug = "local", Activo = true, Orden = (short)4 },
            new { Id = 5, Nombre = "Oficina", Slug = "oficina", Activo = true, Orden = (short)5 },
            new { Id = 6, Nombre = "Bodega", Slug = "bodega", Activo = true, Orden = (short)6 },
            new { Id = 7, Nombre = "Lote", Slug = "lote", Activo = true, Orden = (short)7 });
    }
}
