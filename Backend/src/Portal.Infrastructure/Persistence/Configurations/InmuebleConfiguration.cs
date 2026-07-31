using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NpgsqlTypes;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

internal sealed class InmuebleConfiguration : IEntityTypeConfiguration<Inmueble>
{
    public void Configure(EntityTypeBuilder<Inmueble> builder)
    {
        builder.ToTable("inmuebles", t =>
            t.HasCheckConstraint("ck_inmuebles_estrato", "estrato BETWEEN 1 AND 6"));

        builder.HasKey(i => i.Id);
        builder.Ignore(i => i.EstaEliminado);   // derivada de eliminado_en

        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.CodigoReferencia)
               .HasColumnName("codigo_referencia").HasMaxLength(20).IsRequired();
        builder.Property(i => i.Slug).HasColumnName("slug").HasMaxLength(180).IsRequired();
        builder.Property(i => i.Titulo).HasColumnName("titulo").HasMaxLength(160).IsRequired();
        builder.Property(i => i.Descripcion).HasColumnName("descripcion");

        builder.Property(i => i.TipoInmuebleId).HasColumnName("tipo_inmueble_id").IsRequired();
        builder.Property(i => i.UbicacionId).HasColumnName("ubicacion_id").IsRequired();

        // Dirección exacta: SOLO panel admin. La pública es la aproximada (RF-044).
        builder.Property(i => i.DireccionExacta)
               .HasColumnName("direccion_exacta").HasMaxLength(200).IsRequired();
        builder.Property(i => i.LatitudExacta).HasColumnName("latitud_exacta").HasPrecision(10, 7);
        builder.Property(i => i.LongitudExacta).HasColumnName("longitud_exacta").HasPrecision(10, 7);
        builder.Property(i => i.LatitudAproximada)
               .HasColumnName("latitud_aproximada").HasPrecision(10, 7).IsRequired();
        builder.Property(i => i.LongitudAproximada)
               .HasColumnName("longitud_aproximada").HasPrecision(10, 7).IsRequired();

        builder.Property(i => i.AreaConstruidaM2).HasColumnName("area_construida_m2").HasPrecision(8, 2);
        builder.Property(i => i.AreaPrivadaM2).HasColumnName("area_privada_m2").HasPrecision(8, 2);
        builder.Property(i => i.Habitaciones).HasColumnName("habitaciones").IsRequired().HasDefaultValue((short)0);
        builder.Property(i => i.Banos).HasColumnName("banos").IsRequired().HasDefaultValue((short)0);
        builder.Property(i => i.Parqueaderos).HasColumnName("parqueaderos").IsRequired().HasDefaultValue((short)0);
        builder.Property(i => i.Piso).HasColumnName("piso");
        builder.Property(i => i.PisosEdificio).HasColumnName("pisos_edificio");
        builder.Property(i => i.Estrato).HasColumnName("estrato");
        builder.Property(i => i.Antiguedad).HasColumnName("antiguedad").HasMaxLength(30);
        builder.Property(i => i.Orientacion).HasColumnName("orientacion").HasMaxLength(20);

        builder.Property(i => i.PoliticaMascotas)
               .HasColumnName("politica_mascotas").IsRequired()
               .HasDefaultValue(Domain.Enums.PoliticaMascotas.NoPermitidas);
        builder.Property(i => i.Amoblado).HasColumnName("amoblado").HasMaxLength(20).HasDefaultValue("no");

        builder.Property(i => i.MatriculaInmobiliaria)
               .HasColumnName("matricula_inmobiliaria").HasMaxLength(60);   // RNF-063

        builder.Property(i => i.Estado)
               .HasColumnName("estado").IsRequired()
               .HasDefaultValue(Domain.Enums.EstadoInmueble.Borrador);
        builder.Property(i => i.Destacado).HasColumnName("destacado").IsRequired().HasDefaultValue(false);

        builder.Property(i => i.MetaTitulo).HasColumnName("meta_titulo").HasMaxLength(160);
        builder.Property(i => i.MetaDescripcion).HasColumnName("meta_descripcion").HasMaxLength(320);

        builder.Property(i => i.AsesorId).HasColumnName("asesor_id");
        builder.Property(i => i.CreadoPor).HasColumnName("creado_por");

        builder.Property(i => i.CreadoEn).HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");
        builder.Property(i => i.ActualizadoEn)
               .HasColumnName("actualizado_en").IsRequired().HasDefaultValueSql("now()");
        builder.Property(i => i.EliminadoEn).HasColumnName("eliminado_en");   // borrado lógico (RF-073)

        // Búsqueda de texto libre (RF-025). Columna generada y almacenada, no trigger.
        // Nota: no se aplica unaccent() — no es IMMUTABLE y PostgreSQL la rechaza
        // en columnas generadas; la configuración 'spanish' ya hace stemming.
        builder.Property<NpgsqlTsVector>("BusquedaTsv")
               .HasColumnName("busqueda_tsv")
               .HasComputedColumnSql(
                   "setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') || " +
                   "setweight(to_tsvector('spanish', coalesce(codigo_referencia, '')), 'A') || " +
                   "setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B')",
                   stored: true);

        builder.HasOne<TipoInmueble>()
               .WithMany().HasForeignKey(i => i.TipoInmuebleId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Ubicacion>()
               .WithMany().HasForeignKey(i => i.UbicacionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Usuario>()
               .WithMany().HasForeignKey(i => i.AsesorId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<Usuario>()
               .WithMany().HasForeignKey(i => i.CreadoPor).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => i.CodigoReferencia).IsUnique();
        builder.HasIndex(i => i.Slug).IsUnique();

        builder.HasIndex(i => new { i.Estado, i.TipoInmuebleId, i.UbicacionId, i.Estrato })
               .HasDatabaseName("idx_inmuebles_filtros")
               .HasFilter("eliminado_en IS NULL");

        builder.HasIndex(i => i.Destacado)
               .HasDatabaseName("idx_inmuebles_destacado")
               .HasFilter("estado = 'publicado'");

        builder.HasIndex("BusquedaTsv").HasMethod("gin").HasDatabaseName("idx_inmuebles_tsv");

        builder.HasIndex(i => new { i.LatitudAproximada, i.LongitudAproximada })
               .HasDatabaseName("idx_inmuebles_geo");
    }
}
