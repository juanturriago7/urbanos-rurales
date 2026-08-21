using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class PostulacionLaboralConfiguration : IEntityTypeConfiguration<PostulacionLaboral>
{
    public void Configure(EntityTypeBuilder<PostulacionLaboral> builder)
    {
        builder.ToTable("postulaciones_laborales");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        builder.Property(p => p.Correo).HasColumnName("correo").HasMaxLength(150).IsRequired();
        builder.Property(p => p.Telefono).HasColumnName("telefono").HasMaxLength(30);
        builder.Property(p => p.CargoInteres).HasColumnName("cargo_interes").HasMaxLength(120);
        builder.Property(p => p.Mensaje).HasColumnName("mensaje");
        builder.Property(p => p.CvStorageKey).HasColumnName("cv_storage_key").IsRequired();
        builder.Property(p => p.CvUrl).HasColumnName("cv_url").IsRequired();
        builder.Property(p => p.IpOrigen).HasColumnName("ip_origen");
        builder.Property(p => p.CreadoEn)
            .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasIndex(p => p.CreadoEn).HasDatabaseName("idx_postulaciones_creado_en");
    }
}
