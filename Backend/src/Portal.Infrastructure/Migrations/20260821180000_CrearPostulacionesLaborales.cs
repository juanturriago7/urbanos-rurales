using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <summary>
    /// Spec 07 — tabla para postulaciones del formulario "Trabaja con nosotros".
    /// Bandeja simple sin estado (mismo criterio que `leads`).
    /// </summary>
    public partial class CrearPostulacionesLaborales : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "postulaciones_laborales",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    correo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    cargo_interes = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    mensaje = table.Column<string>(type: "text", nullable: true),
                    cv_storage_key = table.Column<string>(type: "text", nullable: false),
                    cv_url = table.Column<string>(type: "text", nullable: false),
                    ip_origen = table.Column<string>(type: "inet", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_postulaciones_laborales", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_postulaciones_creado_en",
                table: "postulaciones_laborales",
                column: "creado_en");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "postulaciones_laborales");
        }
    }
}
