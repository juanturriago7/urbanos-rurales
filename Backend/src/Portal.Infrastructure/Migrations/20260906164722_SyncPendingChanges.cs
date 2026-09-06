using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Intentar eliminar columnas solo si existen
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN
                    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inmuebles' AND column_name='latitud_aproximada') THEN
                        ALTER TABLE inmuebles DROP COLUMN latitud_aproximada;
                    END IF;
                    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inmuebles' AND column_name='latitud_exacta') THEN
                        ALTER TABLE inmuebles DROP COLUMN latitud_exacta;
                    END IF;
                    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inmuebles' AND column_name='longitud_aproximada') THEN
                        ALTER TABLE inmuebles DROP COLUMN longitud_aproximada;
                    END IF;
                    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inmuebles' AND column_name='longitud_exacta') THEN
                        ALTER TABLE inmuebles DROP COLUMN longitud_exacta;
                    END IF;
                END $$;
            ");

            // Las tablas articulos_blog y postulaciones_laborales ya fueron creadas 
            // en migraciones anteriores (20260821170000 y 20260821180000)
            // Esta migración solo sincroniza los cambios en el modelo sin crear tablas duplicadas
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No eliminamos las tablas porque no fueron creadas en esta migración
            // Solo restauramos las columnas de latitud/longitud si es necesario
            migrationBuilder.AddColumn<decimal>(
                name: "latitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "latitud_exacta",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "longitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "longitud_exacta",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);
        }
    }
}
