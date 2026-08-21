using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <summary>
    /// Spec 03 — actualiza la ficha técnica del inmueble:
    /// - Suelta latitud/longitud (exacta y aproximada) y el índice geo asociado
    ///   (nunca tuvieron consumidor real y se reemplazan por un embed de Google Maps).
    /// - Agrega area_terreno_m2 (obligatoria para tipos no-PH por regla de negocio
    ///   en el handler, no por CHECK), youtube_url y mapa_embed_url.
    /// </summary>
    public partial class ActualizarFichaTecnicaInmueble : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_inmuebles_geo",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "latitud_aproximada",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "latitud_exacta",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "longitud_aproximada",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "longitud_exacta",
                table: "inmuebles");

            migrationBuilder.AddColumn<decimal>(
                name: "area_terreno_m2",
                table: "inmuebles",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "youtube_url",
                table: "inmuebles",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mapa_embed_url",
                table: "inmuebles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "mapa_embed_url",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "youtube_url",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "area_terreno_m2",
                table: "inmuebles");

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

            migrationBuilder.CreateIndex(
                name: "idx_inmuebles_geo",
                table: "inmuebles",
                columns: new[] { "latitud_aproximada", "longitud_aproximada" });
        }
    }
}
