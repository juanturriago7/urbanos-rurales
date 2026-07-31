using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Metadatos de multimedia. El binario vive en almacenamiento de objetos (RNF-013).
/// </summary>
internal sealed class ImagenConfiguration : IEntityTypeConfiguration<Imagen>
{
    public void Configure(EntityTypeBuilder<Imagen> builder)
    {
        builder.ToTable("imagenes");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.InmuebleId).HasColumnName("inmueble_id").IsRequired();
        builder.Property(i => i.StorageKey).HasColumnName("storage_key").IsRequired();
        builder.Property(i => i.UrlCdn).HasColumnName("url_cdn").IsRequired();
        builder.Property(i => i.UrlThumbnail).HasColumnName("url_thumbnail");
        builder.Property(i => i.Formato).HasColumnName("formato").HasMaxLength(10).IsRequired();
        builder.Property(i => i.PesoBytes).HasColumnName("peso_bytes");
        builder.Property(i => i.Orden).HasColumnName("orden").IsRequired().HasDefaultValue((short)0);
        builder.Property(i => i.EsPortada).HasColumnName("es_portada").IsRequired().HasDefaultValue(false);
        builder.Property(i => i.TextoAlt).HasColumnName("texto_alt").HasMaxLength(150);
        builder.Property(i => i.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasOne<Inmueble>()
               .WithMany()
               .HasForeignKey(i => i.InmuebleId)
               .OnDelete(DeleteBehavior.Cascade);

        // Una sola portada por inmueble: índice único parcial.
        builder.HasIndex(i => i.InmuebleId)
               .IsUnique()
               .HasDatabaseName("idx_una_portada")
               .HasFilter("es_portada = TRUE");

        builder.HasIndex(i => new { i.InmuebleId, i.Orden }).HasDatabaseName("idx_imagenes_inmueble");
    }
}
