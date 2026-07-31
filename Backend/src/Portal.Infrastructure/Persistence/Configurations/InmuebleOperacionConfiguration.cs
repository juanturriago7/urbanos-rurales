using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Un inmueble puede estar en venta y arriendo a la vez con precios
/// independientes (RF-076); el índice único (inmueble, tipo) lo garantiza.
/// </summary>
internal sealed class InmuebleOperacionConfiguration : IEntityTypeConfiguration<InmuebleOperacion>
{
    public void Configure(EntityTypeBuilder<InmuebleOperacion> builder)
    {
        builder.ToTable("inmueble_operaciones");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id).HasColumnName("id");
        builder.Property(o => o.InmuebleId).HasColumnName("inmueble_id").IsRequired();
        builder.Property(o => o.TipoOperacion).HasColumnName("tipo_operacion").IsRequired();
        builder.Property(o => o.Precio).HasColumnName("precio").HasPrecision(14, 2).IsRequired();
        builder.Property(o => o.CuotaAdministracion)
               .HasColumnName("cuota_administracion").HasPrecision(12, 2).HasDefaultValue(0m);
        builder.Property(o => o.AdminIncluida)
               .HasColumnName("admin_incluida").IsRequired().HasDefaultValue(false);
        builder.Property(o => o.Estado)
               .HasColumnName("estado").IsRequired().HasDefaultValue(EstadoOperacion.Disponible);
        builder.Property(o => o.Activo).HasColumnName("activo").IsRequired().HasDefaultValue(true);
        builder.Property(o => o.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasOne<Inmueble>()
               .WithMany()
               .HasForeignKey(o => o.InmuebleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => new { o.InmuebleId, o.TipoOperacion }).IsUnique();

        builder.HasIndex(o => new { o.TipoOperacion, o.Precio, o.Estado })
               .HasDatabaseName("idx_operaciones_filtro")
               .HasFilter("activo = TRUE");
    }
}
