using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("leads");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id).HasColumnName("id");
        builder.Property(l => l.InmuebleId).HasColumnName("inmueble_id");   // NULL = contacto general
        builder.Property(l => l.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        builder.Property(l => l.Correo).HasColumnName("correo").HasMaxLength(150);
        builder.Property(l => l.Telefono).HasColumnName("telefono").HasMaxLength(30);
        builder.Property(l => l.Mensaje).HasColumnName("mensaje");
        builder.Property(l => l.Origen).HasColumnName("origen").HasMaxLength(60).IsRequired();
        builder.Property(l => l.UtmSource).HasColumnName("utm_source").HasMaxLength(60);
        builder.Property(l => l.UtmCampaign).HasColumnName("utm_campaign").HasMaxLength(60);

        // Consentimiento de tratamiento de datos (RNF-061)
        builder.Property(l => l.AceptoTratamientoDatos)
               .HasColumnName("acepto_tratamiento_datos").IsRequired().HasDefaultValue(false);

        builder.Property(l => l.Estado)
               .HasColumnName("estado").IsRequired().HasDefaultValue(EstadoLead.Nuevo);
        builder.Property(l => l.AsignadoA).HasColumnName("asignado_a");
        builder.Property(l => l.IpOrigen).HasColumnName("ip_origen").HasColumnType("inet");
        builder.Property(l => l.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        // Sin cascada: un lead es evidencia comercial, sobrevive al inmueble.
        builder.HasOne<Inmueble>()
               .WithMany()
               .HasForeignKey(l => l.InmuebleId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Usuario>()
               .WithMany()
               .HasForeignKey(l => l.AsignadoA)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(l => l.InmuebleId).HasDatabaseName("idx_leads_inmueble");
        builder.HasIndex(l => l.Estado).HasDatabaseName("idx_leads_estado");
    }
}
