using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <summary>
    /// Spec 02 — agrega el flag <c>es_propiedad_horizontal</c> a
    /// <c>tipos_inmueble</c> (lo usa la spec 03 para decidir si mostrar
    /// "área de terreno" en la ficha) y siembra el nuevo tipo "Edificio"
    /// solicitado por el cliente. La columna se crea con default TRUE
    /// para que apartamento/apartaestudio/local/oficina queden como PH
    /// sin tocarlos; casa/lote/bodega se actualizan a FALSE.
    /// </summary>
    public partial class FlagPropiedadHorizontalYEdificio : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "es_propiedad_horizontal",
                table: "tipos_inmueble",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.UpdateData(
                table: "tipos_inmueble",
                keyColumn: "id",
                keyValue: 2,
                column: "es_propiedad_horizontal",
                value: false);

            migrationBuilder.UpdateData(
                table: "tipos_inmueble",
                keyColumn: "id",
                keyValue: 6,
                column: "es_propiedad_horizontal",
                value: false);

            migrationBuilder.UpdateData(
                table: "tipos_inmueble",
                keyColumn: "id",
                keyValue: 7,
                column: "es_propiedad_horizontal",
                value: false);

            migrationBuilder.InsertData(
                table: "tipos_inmueble",
                columns: new[] { "id", "activo", "es_propiedad_horizontal", "nombre", "orden", "slug" },
                values: new object[] { 8, true, false, "Edificio", (short)8, "edificio" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "tipos_inmueble",
                keyColumn: "id",
                keyValue: 8);

            migrationBuilder.DropColumn(
                name: "es_propiedad_horizontal",
                table: "tipos_inmueble");
        }
    }
}
