using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Jerarquía zona → localidad → upz → barrio, autorreferenciada por <c>padre_id</c>.
/// El seed cubre las 6 zonas y las 19 localidades reales de Bogotá; las UPZ y
/// barrios son una muestra representativa que hay que completar.
/// </summary>
internal sealed class UbicacionConfiguration : IEntityTypeConfiguration<Ubicacion>
{
    public void Configure(EntityTypeBuilder<Ubicacion> builder)
    {
        builder.ToTable("ubicaciones");
        builder.HasKey(u => u.Id);
        builder.Ignore(u => u.EsRaiz);   // derivada de padre_id

        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Tipo).HasColumnName("tipo").IsRequired();
        builder.Property(u => u.Nombre).HasColumnName("nombre").HasMaxLength(120).IsRequired();
        builder.Property(u => u.Slug).HasColumnName("slug").HasMaxLength(140).IsRequired();
        builder.Property(u => u.PadreId).HasColumnName("padre_id");
        builder.Property(u => u.Activo).HasColumnName("activo").IsRequired().HasDefaultValue(true);
        builder.Property(u => u.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasOne<Ubicacion>()
               .WithMany()
               .HasForeignKey(u => u.PadreId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(u => new { u.Tipo, u.Slug, u.PadreId }).IsUnique();
        builder.HasIndex(u => u.PadreId).HasDatabaseName("idx_ubicaciones_padre");
        builder.HasIndex(u => u.Tipo).HasDatabaseName("idx_ubicaciones_tipo");

        var fecha = SeedConstants.Fecha;

        builder.HasData(
            // ── Zonas (1-6) ──────────────────────────────────────────────────
            new { Id = 1L, Tipo = TipoUbicacion.Zona, Nombre = "Norte", Slug = "norte", PadreId = (long?)null, Activo = true, CreadoEn = fecha },
            new { Id = 2L, Tipo = TipoUbicacion.Zona, Nombre = "Noroccidente", Slug = "noroccidente", PadreId = (long?)null, Activo = true, CreadoEn = fecha },
            new { Id = 3L, Tipo = TipoUbicacion.Zona, Nombre = "Occidente", Slug = "occidente", PadreId = (long?)null, Activo = true, CreadoEn = fecha },
            new { Id = 4L, Tipo = TipoUbicacion.Zona, Nombre = "Centro", Slug = "centro", PadreId = (long?)null, Activo = true, CreadoEn = fecha },
            new { Id = 5L, Tipo = TipoUbicacion.Zona, Nombre = "Sur", Slug = "sur", PadreId = (long?)null, Activo = true, CreadoEn = fecha },
            new { Id = 6L, Tipo = TipoUbicacion.Zona, Nombre = "Suroccidente", Slug = "suroccidente", PadreId = (long?)null, Activo = true, CreadoEn = fecha },

            // ── Localidades (7-25) ───────────────────────────────────────────
            new { Id = 7L, Tipo = TipoUbicacion.Localidad, Nombre = "Usaquén", Slug = "usaquen", PadreId = (long?)1L, Activo = true, CreadoEn = fecha },
            new { Id = 8L, Tipo = TipoUbicacion.Localidad, Nombre = "Chapinero", Slug = "chapinero", PadreId = (long?)1L, Activo = true, CreadoEn = fecha },
            new { Id = 9L, Tipo = TipoUbicacion.Localidad, Nombre = "Suba", Slug = "suba", PadreId = (long?)2L, Activo = true, CreadoEn = fecha },
            new { Id = 10L, Tipo = TipoUbicacion.Localidad, Nombre = "Engativá", Slug = "engativa", PadreId = (long?)2L, Activo = true, CreadoEn = fecha },
            new { Id = 11L, Tipo = TipoUbicacion.Localidad, Nombre = "Barrios Unidos", Slug = "barrios-unidos", PadreId = (long?)2L, Activo = true, CreadoEn = fecha },
            new { Id = 12L, Tipo = TipoUbicacion.Localidad, Nombre = "Fontibón", Slug = "fontibon", PadreId = (long?)3L, Activo = true, CreadoEn = fecha },
            new { Id = 13L, Tipo = TipoUbicacion.Localidad, Nombre = "Teusaquillo", Slug = "teusaquillo", PadreId = (long?)4L, Activo = true, CreadoEn = fecha },
            new { Id = 14L, Tipo = TipoUbicacion.Localidad, Nombre = "Santa Fe", Slug = "santa-fe", PadreId = (long?)4L, Activo = true, CreadoEn = fecha },
            new { Id = 15L, Tipo = TipoUbicacion.Localidad, Nombre = "La Candelaria", Slug = "la-candelaria", PadreId = (long?)4L, Activo = true, CreadoEn = fecha },
            new { Id = 16L, Tipo = TipoUbicacion.Localidad, Nombre = "Los Mártires", Slug = "los-martires", PadreId = (long?)4L, Activo = true, CreadoEn = fecha },
            new { Id = 17L, Tipo = TipoUbicacion.Localidad, Nombre = "Puente Aranda", Slug = "puente-aranda", PadreId = (long?)6L, Activo = true, CreadoEn = fecha },
            new { Id = 18L, Tipo = TipoUbicacion.Localidad, Nombre = "Kennedy", Slug = "kennedy", PadreId = (long?)6L, Activo = true, CreadoEn = fecha },
            new { Id = 19L, Tipo = TipoUbicacion.Localidad, Nombre = "Bosa", Slug = "bosa", PadreId = (long?)6L, Activo = true, CreadoEn = fecha },
            new { Id = 20L, Tipo = TipoUbicacion.Localidad, Nombre = "Antonio Nariño", Slug = "antonio-narino", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },
            new { Id = 21L, Tipo = TipoUbicacion.Localidad, Nombre = "Rafael Uribe Uribe", Slug = "rafael-uribe-uribe", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },
            new { Id = 22L, Tipo = TipoUbicacion.Localidad, Nombre = "Tunjuelito", Slug = "tunjuelito", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },
            new { Id = 23L, Tipo = TipoUbicacion.Localidad, Nombre = "San Cristóbal", Slug = "san-cristobal", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },
            new { Id = 24L, Tipo = TipoUbicacion.Localidad, Nombre = "Usme", Slug = "usme", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },
            new { Id = 25L, Tipo = TipoUbicacion.Localidad, Nombre = "Ciudad Bolívar", Slug = "ciudad-bolivar", PadreId = (long?)5L, Activo = true, CreadoEn = fecha },

            // ── UPZ (26-32) ──────────────────────────────────────────────────
            new { Id = 26L, Tipo = TipoUbicacion.Upz, Nombre = "Santa Bárbara", Slug = "santa-barbara", PadreId = (long?)7L, Activo = true, CreadoEn = fecha },
            new { Id = 27L, Tipo = TipoUbicacion.Upz, Nombre = "Country Club", Slug = "country-club", PadreId = (long?)7L, Activo = true, CreadoEn = fecha },
            new { Id = 28L, Tipo = TipoUbicacion.Upz, Nombre = "Chicó Lago", Slug = "chico-lago", PadreId = (long?)8L, Activo = true, CreadoEn = fecha },
            new { Id = 29L, Tipo = TipoUbicacion.Upz, Nombre = "Chapinero Norte", Slug = "chapinero-norte", PadreId = (long?)8L, Activo = true, CreadoEn = fecha },
            new { Id = 30L, Tipo = TipoUbicacion.Upz, Nombre = "Niza", Slug = "niza", PadreId = (long?)9L, Activo = true, CreadoEn = fecha },
            new { Id = 31L, Tipo = TipoUbicacion.Upz, Nombre = "El Prado", Slug = "el-prado", PadreId = (long?)9L, Activo = true, CreadoEn = fecha },
            new { Id = 32L, Tipo = TipoUbicacion.Upz, Nombre = "Castilla", Slug = "castilla", PadreId = (long?)18L, Activo = true, CreadoEn = fecha },

            // ── Barrios (33-41) ──────────────────────────────────────────────
            new { Id = 33L, Tipo = TipoUbicacion.Barrio, Nombre = "Santa Bárbara Occidental", Slug = "santa-barbara-occidental", PadreId = (long?)26L, Activo = true, CreadoEn = fecha },
            new { Id = 34L, Tipo = TipoUbicacion.Barrio, Nombre = "Molinos Norte", Slug = "molinos-norte", PadreId = (long?)26L, Activo = true, CreadoEn = fecha },
            new { Id = 35L, Tipo = TipoUbicacion.Barrio, Nombre = "Chicó Norte", Slug = "chico-norte", PadreId = (long?)28L, Activo = true, CreadoEn = fecha },
            new { Id = 36L, Tipo = TipoUbicacion.Barrio, Nombre = "El Retiro", Slug = "el-retiro", PadreId = (long?)28L, Activo = true, CreadoEn = fecha },
            new { Id = 37L, Tipo = TipoUbicacion.Barrio, Nombre = "Quinta Camacho", Slug = "quinta-camacho", PadreId = (long?)29L, Activo = true, CreadoEn = fecha },
            new { Id = 38L, Tipo = TipoUbicacion.Barrio, Nombre = "Niza Sur", Slug = "niza-sur", PadreId = (long?)30L, Activo = true, CreadoEn = fecha },
            new { Id = 39L, Tipo = TipoUbicacion.Barrio, Nombre = "Colina Campestre", Slug = "colina-campestre", PadreId = (long?)30L, Activo = true, CreadoEn = fecha },
            new { Id = 40L, Tipo = TipoUbicacion.Barrio, Nombre = "Prado Veraniego", Slug = "prado-veraniego", PadreId = (long?)31L, Activo = true, CreadoEn = fecha },
            new { Id = 41L, Tipo = TipoUbicacion.Barrio, Nombre = "Castilla Central", Slug = "castilla-central", PadreId = (long?)32L, Activo = true, CreadoEn = fecha });
    }
}
