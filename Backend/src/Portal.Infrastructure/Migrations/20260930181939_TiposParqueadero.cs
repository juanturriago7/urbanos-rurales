using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TiposParqueadero : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "tipos_parqueadero",
                table: "inmuebles",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddCheckConstraint(
                name: "ck_inmuebles_tipos_parqueadero",
                table: "inmuebles",
                sql: "tipos_parqueadero <@ ARRAY['privado', 'privado_uso_exclusivo', 'doble']::text[] AND (parqueaderos > 0 OR cardinality(tipos_parqueadero) = 0)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_inmuebles_tipos_parqueadero",
                table: "inmuebles");

            migrationBuilder.DropColumn(
                name: "tipos_parqueadero",
                table: "inmuebles");
        }
    }
}
