using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portal.Infrastructure.Migrations
{
    /// <summary>
    /// Spec 06 — crea el módulo de blog (tabla articulos_blog + enum estado_articulo_blog).
    /// Tabla nueva, no toca ninguna existente.
    /// </summary>
    public partial class CrearModuloBlog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE TYPE estado_articulo_blog AS ENUM ('borrador', 'publicado', 'archivado')");

            migrationBuilder.CreateTable(
                name: "articulos_blog",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    slug = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    resumen = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    contenido = table.Column<string>(type: "text", nullable: false),
                    imagen_portada_key = table.Column<string>(type: "text", nullable: true),
                    imagen_portada_url = table.Column<string>(type: "text", nullable: true),
                    meta_titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    meta_descripcion = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    estado = table.Column<string>(type: "estado_articulo_blog", nullable: false, defaultValue: "borrador"),
                    autor_id = table.Column<long>(type: "bigint", nullable: true),
                    publicado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_articulos_blog", x => x.id);
                    table.ForeignKey(
                        name: "FK_articulos_blog_usuarios_autor_id",
                        column: x => x.autor_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_articulos_blog_slug",
                table: "articulos_blog",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_articulos_blog_estado",
                table: "articulos_blog",
                column: "estado");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "articulos_blog");
            migrationBuilder.Sql("DROP TYPE estado_articulo_blog");
        }
    }
}
