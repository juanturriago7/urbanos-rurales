using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>
/// Catálogo de amenidades. Agregar una nueva es un INSERT, no una migración (RNF-011);
/// el seed de abajo es solo el punto de partida y está pendiente de validación
/// con el patrocinador (Task/BackEnd/05-proximos-pasos.md #1).
/// </summary>
internal sealed class CaracteristicaConfiguration : IEntityTypeConfiguration<Caracteristica>
{
    public void Configure(EntityTypeBuilder<Caracteristica> builder)
    {
        builder.ToTable("caracteristicas");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.CategoriaId).HasColumnName("categoria_id").IsRequired();
        builder.Property(c => c.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        builder.Property(c => c.Icono).HasColumnName("icono").HasMaxLength(60);
        builder.Property(c => c.TipoValor)
               .HasColumnName("tipo_valor").HasMaxLength(20).IsRequired()
               .HasDefaultValue(Caracteristica.TiposValor.Booleano);
        builder.Property(c => c.Filtrable).HasColumnName("filtrable").IsRequired().HasDefaultValue(true);
        builder.Property(c => c.Activo).HasColumnName("activo").IsRequired().HasDefaultValue(true);

        builder.HasOne<CategoriaCaracteristica>()
               .WithMany()
               .HasForeignKey(c => c.CategoriaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => new { c.CategoriaId, c.Nombre }).IsUnique();

        const string booleano = Caracteristica.TiposValor.Booleano;
        const string numero = Caracteristica.TiposValor.Numero;

        builder.HasData(
            // Interior (categoría 1)
            new { Id = 1, CategoriaId = 1, Nombre = "Cocina integral", Icono = "kitchen", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 2, CategoriaId = 1, Nombre = "Calentador", Icono = "water-heater", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 3, CategoriaId = 1, Nombre = "Closets", Icono = "closet", TipoValor = numero, Filtrable = false, Activo = true },
            new { Id = 4, CategoriaId = 1, Nombre = "Balcón", Icono = "balcony", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 5, CategoriaId = 1, Nombre = "Terraza", Icono = "terrace", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 6, CategoriaId = 1, Nombre = "Estudio", Icono = "study", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 7, CategoriaId = 1, Nombre = "Depósito", Icono = "storage", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 8, CategoriaId = 1, Nombre = "Chimenea", Icono = "fireplace", TipoValor = booleano, Filtrable = false, Activo = true },

            // Zonas comunes (categoría 2)
            new { Id = 9, CategoriaId = 2, Nombre = "Ascensor", Icono = "elevator", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 10, CategoriaId = 2, Nombre = "Piscina", Icono = "pool", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 11, CategoriaId = 2, Nombre = "Gimnasio", Icono = "gym", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 12, CategoriaId = 2, Nombre = "Salón comunal", Icono = "community-room", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 13, CategoriaId = 2, Nombre = "Parque infantil", Icono = "playground", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 14, CategoriaId = 2, Nombre = "Zona BBQ", Icono = "bbq", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 15, CategoriaId = 2, Nombre = "Cancha múltiple", Icono = "court", TipoValor = booleano, Filtrable = false, Activo = true },

            // Servicios (categoría 3)
            new { Id = 16, CategoriaId = 3, Nombre = "Internet incluido", Icono = "wifi", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 17, CategoriaId = 3, Nombre = "Gas natural", Icono = "gas", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 18, CategoriaId = 3, Nombre = "Aire acondicionado", Icono = "ac", TipoValor = booleano, Filtrable = false, Activo = true },

            // Seguridad (categoría 4)
            new { Id = 19, CategoriaId = 4, Nombre = "Vigilancia 24h", Icono = "security", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 20, CategoriaId = 4, Nombre = "Portería", Icono = "doorman", TipoValor = booleano, Filtrable = true, Activo = true },
            new { Id = 21, CategoriaId = 4, Nombre = "CCTV", Icono = "cctv", TipoValor = booleano, Filtrable = false, Activo = true },
            new { Id = 22, CategoriaId = 4, Nombre = "Alarma", Icono = "alarm", TipoValor = booleano, Filtrable = false, Activo = true });
    }
}
