using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class InmuebleCaracteristicaConfiguration : IEntityTypeConfiguration<InmuebleCaracteristica>
{
    public void Configure(EntityTypeBuilder<InmuebleCaracteristica> builder)
    {
        builder.ToTable("inmueble_caracteristicas");
        builder.HasKey(ic => new { ic.InmuebleId, ic.CaracteristicaId });

        builder.Property(ic => ic.InmuebleId).HasColumnName("inmueble_id");
        builder.Property(ic => ic.CaracteristicaId).HasColumnName("caracteristica_id");
        builder.Property(ic => ic.Valor).HasColumnName("valor").HasMaxLength(60);

        builder.HasOne<Inmueble>()
               .WithMany()
               .HasForeignKey(ic => ic.InmuebleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Caracteristica>()
               .WithMany()
               .HasForeignKey(ic => ic.CaracteristicaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ic => ic.CaracteristicaId).HasDatabaseName("idx_inm_caract_caract");
    }
}
