using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>Auditoría de estado y precio (RNF-010). Opcional en el MVP.</summary>
internal sealed class InmuebleHistorialConfiguration : IEntityTypeConfiguration<InmuebleHistorial>
{
    public void Configure(EntityTypeBuilder<InmuebleHistorial> builder)
    {
        builder.ToTable("inmueble_historial");
        builder.HasKey(h => h.Id);

        builder.Property(h => h.Id).HasColumnName("id");
        builder.Property(h => h.InmuebleId).HasColumnName("inmueble_id").IsRequired();
        builder.Property(h => h.Campo).HasColumnName("campo").HasMaxLength(40).IsRequired();
        builder.Property(h => h.ValorAnterior).HasColumnName("valor_anterior").HasMaxLength(60);
        builder.Property(h => h.ValorNuevo).HasColumnName("valor_nuevo").HasMaxLength(60);
        builder.Property(h => h.UsuarioId).HasColumnName("usuario_id");
        builder.Property(h => h.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasOne<Inmueble>()
               .WithMany()
               .HasForeignKey(h => h.InmuebleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Usuario>()
               .WithMany()
               .HasForeignKey(h => h.UsuarioId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(h => h.InmuebleId).HasDatabaseName("idx_inmueble_historial_inmueble");
    }
}
