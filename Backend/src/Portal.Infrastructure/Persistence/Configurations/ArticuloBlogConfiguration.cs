using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class ArticuloBlogConfiguration : IEntityTypeConfiguration<ArticuloBlog>
{
    public void Configure(EntityTypeBuilder<ArticuloBlog> builder)
    {
        builder.ToTable("articulos_blog");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.Titulo).HasColumnName("titulo").HasMaxLength(160).IsRequired();
        builder.Property(a => a.Slug).HasColumnName("slug").HasMaxLength(180).IsRequired();
        builder.Property(a => a.Resumen).HasColumnName("resumen").HasMaxLength(320);
        builder.Property(a => a.Contenido).HasColumnName("contenido").IsRequired();
        builder.Property(a => a.ImagenPortadaKey).HasColumnName("imagen_portada_key");
        builder.Property(a => a.ImagenPortadaUrl).HasColumnName("imagen_portada_url");
        builder.Property(a => a.MetaTitulo).HasColumnName("meta_titulo").HasMaxLength(160);
        builder.Property(a => a.MetaDescripcion).HasColumnName("meta_descripcion").HasMaxLength(320);
        builder.Property(a => a.Estado)
            .HasColumnName("estado")
            .HasConversion<string>()
            .IsRequired()
            .HasDefaultValue(EstadoArticuloBlog.Borrador);
        builder.Property(a => a.AutorId).HasColumnName("autor_id");
        builder.Property(a => a.PublicadoEn).HasColumnName("publicado_en");
        builder.Property(a => a.CreadoEn)
            .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");
        builder.Property(a => a.ActualizadoEn)
            .HasColumnName("actualizado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasIndex(a => a.Slug).IsUnique().HasDatabaseName("idx_articulos_blog_slug");
        builder.HasIndex(a => a.Estado).HasDatabaseName("idx_articulos_blog_estado");
    }
}
