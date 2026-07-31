using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portal.Domain.Entities;

namespace Portal.Infrastructure.Persistence.Configurations;

/// <summary>Tokens de recuperación de contraseña de un solo uso (RF-062).</summary>
internal sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("password_reset_tokens");
        builder.HasKey(t => t.Id);
        builder.Ignore(t => t.EstaUsado);   // derivada de usado_en

        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.UsuarioId).HasColumnName("usuario_id").IsRequired();
        builder.Property(t => t.TokenHash).HasColumnName("token_hash").IsRequired();
        builder.Property(t => t.ExpiraEn).HasColumnName("expira_en").IsRequired();
        builder.Property(t => t.UsadoEn).HasColumnName("usado_en");
        builder.Property(t => t.CreadoEn)
               .HasColumnName("creado_en").IsRequired().HasDefaultValueSql("now()");

        builder.HasOne<Usuario>()
               .WithMany()
               .HasForeignKey(t => t.UsuarioId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.UsuarioId).HasDatabaseName("idx_prt_usuario");
    }
}
