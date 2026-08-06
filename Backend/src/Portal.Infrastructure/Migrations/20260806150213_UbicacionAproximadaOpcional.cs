using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UbicacionAproximadaOpcional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "longitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,7)",
                oldPrecision: 10,
                oldScale: 7);

            migrationBuilder.AlterColumn<decimal>(
                name: "latitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,7)",
                oldPrecision: 10,
                oldScale: 7);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "longitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,7)",
                oldPrecision: 10,
                oldScale: 7,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "latitud_aproximada",
                table: "inmuebles",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,7)",
                oldPrecision: 10,
                oldScale: 7,
                oldNullable: true);
        }
    }
}
