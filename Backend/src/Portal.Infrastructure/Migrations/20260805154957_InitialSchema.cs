using System;
using System.Net;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using NpgsqlTypes;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Portal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:estado_inmueble", "borrador,publicado,pausado,archivado")
                .Annotation("Npgsql:Enum:estado_lead", "nuevo,contactado,descartado,cerrado")
                .Annotation("Npgsql:Enum:estado_operacion", "disponible,reservado,cerrado")
                .Annotation("Npgsql:Enum:politica_mascotas", "permitidas,no_permitidas,con_restricciones")
                .Annotation("Npgsql:Enum:rol_usuario", "admin,asesor")
                .Annotation("Npgsql:Enum:tipo_operacion", "venta,arriendo")
                .Annotation("Npgsql:Enum:tipo_ubicacion", "zona,localidad,upz,barrio")
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,")
                .Annotation("Npgsql:PostgresExtension:pgcrypto", ",,")
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,");

            migrationBuilder.CreateTable(
                name: "categorias_caracteristica",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    orden = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias_caracteristica", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false, defaultValue: ""),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tipos_inmueble",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    slug = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    orden = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tipos_inmueble", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ubicaciones",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipo = table.Column<int>(type: "integer", nullable: false),
                    nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    padre_id = table.Column<long>(type: "bigint", nullable: true),
                    activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ubicaciones", x => x.id);
                    table.ForeignKey(
                        name: "FK_ubicaciones_ubicaciones_padre_id",
                        column: x => x.padre_id,
                        principalTable: "ubicaciones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    correo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    rol = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    intentos_fallidos = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    bloqueado_hasta = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    refresh_token_hash = table.Column<string>(type: "text", nullable: true),
                    refresh_token_expira = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "caracteristicas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    categoria_id = table.Column<int>(type: "integer", nullable: false),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    icono = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    tipo_valor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "booleano"),
                    filtrable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_caracteristicas", x => x.id);
                    table.ForeignKey(
                        name: "FK_caracteristicas_categorias_caracteristica_categoria_id",
                        column: x => x.categoria_id,
                        principalTable: "categorias_caracteristica",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inmuebles",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo_referencia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    slug = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    tipo_inmueble_id = table.Column<int>(type: "integer", nullable: false),
                    ubicacion_id = table.Column<long>(type: "bigint", nullable: false),
                    direccion_exacta = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    latitud_exacta = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    longitud_exacta = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    latitud_aproximada = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    longitud_aproximada = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    area_construida_m2 = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    area_privada_m2 = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    habitaciones = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    banos = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    parqueaderos = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    piso = table.Column<short>(type: "smallint", nullable: true),
                    pisos_edificio = table.Column<short>(type: "smallint", nullable: true),
                    estrato = table.Column<short>(type: "smallint", nullable: true),
                    antiguedad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    orientacion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    politica_mascotas = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    amoblado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true, defaultValue: "no"),
                    matricula_inmobiliaria = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    estado = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    destacado = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    meta_titulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    meta_descripcion = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    asesor_id = table.Column<long>(type: "bigint", nullable: true),
                    creado_por = table.Column<long>(type: "bigint", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    eliminado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    busqueda_tsv = table.Column<NpgsqlTsVector>(type: "tsvector", nullable: true, computedColumnSql: "setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') || setweight(to_tsvector('spanish', coalesce(codigo_referencia, '')), 'A') || setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B')", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inmuebles", x => x.id);
                    table.CheckConstraint("ck_inmuebles_estrato", "estrato BETWEEN 1 AND 6");
                    table.ForeignKey(
                        name: "FK_inmuebles_tipos_inmueble_tipo_inmueble_id",
                        column: x => x.tipo_inmueble_id,
                        principalTable: "tipos_inmueble",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_inmuebles_ubicaciones_ubicacion_id",
                        column: x => x.ubicacion_id,
                        principalTable: "ubicaciones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_inmuebles_usuarios_asesor_id",
                        column: x => x.asesor_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_inmuebles_usuarios_creado_por",
                        column: x => x.creado_por,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<long>(type: "bigint", nullable: false),
                    token_hash = table.Column<string>(type: "text", nullable: false),
                    expira_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    usado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "imagenes",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    inmueble_id = table.Column<long>(type: "bigint", nullable: false),
                    storage_key = table.Column<string>(type: "text", nullable: false),
                    url_cdn = table.Column<string>(type: "text", nullable: false),
                    url_thumbnail = table.Column<string>(type: "text", nullable: true),
                    formato = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    peso_bytes = table.Column<int>(type: "integer", nullable: true),
                    orden = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    es_portada = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    texto_alt = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imagenes", x => x.id);
                    table.ForeignKey(
                        name: "FK_imagenes_inmuebles_inmueble_id",
                        column: x => x.inmueble_id,
                        principalTable: "inmuebles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inmueble_caracteristicas",
                columns: table => new
                {
                    inmueble_id = table.Column<long>(type: "bigint", nullable: false),
                    caracteristica_id = table.Column<int>(type: "integer", nullable: false),
                    valor = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inmueble_caracteristicas", x => new { x.inmueble_id, x.caracteristica_id });
                    table.ForeignKey(
                        name: "FK_inmueble_caracteristicas_caracteristicas_caracteristica_id",
                        column: x => x.caracteristica_id,
                        principalTable: "caracteristicas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_inmueble_caracteristicas_inmuebles_inmueble_id",
                        column: x => x.inmueble_id,
                        principalTable: "inmuebles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inmueble_historial",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    inmueble_id = table.Column<long>(type: "bigint", nullable: false),
                    campo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    valor_anterior = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    valor_nuevo = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    usuario_id = table.Column<long>(type: "bigint", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inmueble_historial", x => x.id);
                    table.ForeignKey(
                        name: "FK_inmueble_historial_inmuebles_inmueble_id",
                        column: x => x.inmueble_id,
                        principalTable: "inmuebles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inmueble_historial_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "inmueble_operaciones",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    inmueble_id = table.Column<long>(type: "bigint", nullable: false),
                    tipo_operacion = table.Column<int>(type: "integer", nullable: false),
                    precio = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    cuota_administracion = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true, defaultValue: 0m),
                    admin_incluida = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    estado = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inmueble_operaciones", x => x.id);
                    table.ForeignKey(
                        name: "FK_inmueble_operaciones_inmuebles_inmueble_id",
                        column: x => x.inmueble_id,
                        principalTable: "inmuebles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "leads",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    inmueble_id = table.Column<long>(type: "bigint", nullable: true),
                    nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    correo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    mensaje = table.Column<string>(type: "text", nullable: true),
                    origen = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    utm_source = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    utm_campaign = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    acepto_tratamiento_datos = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    estado = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    asignado_a = table.Column<long>(type: "bigint", nullable: true),
                    ip_origen = table.Column<IPAddress>(type: "inet", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leads", x => x.id);
                    table.ForeignKey(
                        name: "FK_leads_inmuebles_inmueble_id",
                        column: x => x.inmueble_id,
                        principalTable: "inmuebles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_leads_usuarios_asignado_a",
                        column: x => x.asignado_a,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "categorias_caracteristica",
                columns: new[] { "id", "nombre", "orden" },
                values: new object[,]
                {
                    { 1, "Interior", (short)1 },
                    { 2, "Zonas comunes", (short)2 },
                    { 3, "Servicios", (short)3 },
                    { 4, "Seguridad", (short)4 }
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "created_at", "description", "name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Acceso total al sistema", "Admin" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Gestión de propiedades y leads asignados", "Asesor" }
                });

            migrationBuilder.InsertData(
                table: "tipos_inmueble",
                columns: new[] { "id", "activo", "nombre", "orden", "slug" },
                values: new object[,]
                {
                    { 1, true, "Apartamento", (short)1, "apartamento" },
                    { 2, true, "Casa", (short)2, "casa" },
                    { 3, true, "Apartaestudio", (short)3, "apartaestudio" },
                    { 4, true, "Local", (short)4, "local" },
                    { 5, true, "Oficina", (short)5, "oficina" },
                    { 6, true, "Bodega", (short)6, "bodega" },
                    { 7, true, "Lote", (short)7, "lote" }
                });

            migrationBuilder.InsertData(
                table: "ubicaciones",
                columns: new[] { "id", "activo", "creado_en", "nombre", "padre_id", "slug", "tipo" },
                values: new object[,]
                {
                    { 1L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Norte", null, "norte", 1 },
                    { 2L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Noroccidente", null, "noroccidente", 1 },
                    { 3L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Occidente", null, "occidente", 1 },
                    { 4L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Centro", null, "centro", 1 },
                    { 5L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sur", null, "sur", 1 },
                    { 6L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Suroccidente", null, "suroccidente", 1 }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "filtrable", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 1, true, 1, true, "kitchen", "Cocina integral", "booleano" },
                    { 2, true, 1, true, "water-heater", "Calentador", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "icono", "nombre", "tipo_valor" },
                values: new object[] { 3, true, 1, "closet", "Closets", "numero" });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "filtrable", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 4, true, 1, true, "balcony", "Balcón", "booleano" },
                    { 5, true, 1, true, "terrace", "Terraza", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 6, true, 1, "study", "Estudio", "booleano" },
                    { 7, true, 1, "storage", "Depósito", "booleano" },
                    { 8, true, 1, "fireplace", "Chimenea", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "filtrable", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 9, true, 2, true, "elevator", "Ascensor", "booleano" },
                    { 10, true, 2, true, "pool", "Piscina", "booleano" },
                    { 11, true, 2, true, "gym", "Gimnasio", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 12, true, 2, "community-room", "Salón comunal", "booleano" },
                    { 13, true, 2, "playground", "Parque infantil", "booleano" },
                    { 14, true, 2, "bbq", "Zona BBQ", "booleano" },
                    { 15, true, 2, "court", "Cancha múltiple", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "filtrable", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 16, true, 3, true, "wifi", "Internet incluido", "booleano" },
                    { 17, true, 3, true, "gas", "Gas natural", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "icono", "nombre", "tipo_valor" },
                values: new object[] { 18, true, 3, "ac", "Aire acondicionado", "booleano" });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "filtrable", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 19, true, 4, true, "security", "Vigilancia 24h", "booleano" },
                    { 20, true, 4, true, "doorman", "Portería", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "caracteristicas",
                columns: new[] { "id", "activo", "categoria_id", "icono", "nombre", "tipo_valor" },
                values: new object[,]
                {
                    { 21, true, 4, "cctv", "CCTV", "booleano" },
                    { 22, true, 4, "alarm", "Alarma", "booleano" }
                });

            migrationBuilder.InsertData(
                table: "ubicaciones",
                columns: new[] { "id", "activo", "creado_en", "nombre", "padre_id", "slug", "tipo" },
                values: new object[,]
                {
                    { 7L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Usaquén", 1L, "usaquen", 2 },
                    { 8L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chapinero", 1L, "chapinero", 2 },
                    { 9L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Suba", 2L, "suba", 2 },
                    { 10L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Engativá", 2L, "engativa", 2 },
                    { 11L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Barrios Unidos", 2L, "barrios-unidos", 2 },
                    { 12L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Fontibón", 3L, "fontibon", 2 },
                    { 13L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Teusaquillo", 4L, "teusaquillo", 2 },
                    { 14L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Santa Fe", 4L, "santa-fe", 2 },
                    { 15L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "La Candelaria", 4L, "la-candelaria", 2 },
                    { 16L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Los Mártires", 4L, "los-martires", 2 },
                    { 17L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Puente Aranda", 6L, "puente-aranda", 2 },
                    { 18L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Kennedy", 6L, "kennedy", 2 },
                    { 19L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Bosa", 6L, "bosa", 2 },
                    { 20L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Antonio Nariño", 5L, "antonio-narino", 2 },
                    { 21L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Rafael Uribe Uribe", 5L, "rafael-uribe-uribe", 2 },
                    { 22L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tunjuelito", 5L, "tunjuelito", 2 },
                    { 23L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "San Cristóbal", 5L, "san-cristobal", 2 },
                    { 24L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Usme", 5L, "usme", 2 },
                    { 25L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ciudad Bolívar", 5L, "ciudad-bolivar", 2 },
                    { 26L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Santa Bárbara", 7L, "santa-barbara", 3 },
                    { 27L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Country Club", 7L, "country-club", 3 },
                    { 28L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chicó Lago", 8L, "chico-lago", 3 },
                    { 29L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chapinero Norte", 8L, "chapinero-norte", 3 },
                    { 30L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Niza", 9L, "niza", 3 },
                    { 31L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "El Prado", 9L, "el-prado", 3 },
                    { 32L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Castilla", 18L, "castilla", 3 },
                    { 33L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Santa Bárbara Occidental", 26L, "santa-barbara-occidental", 4 },
                    { 34L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Molinos Norte", 26L, "molinos-norte", 4 },
                    { 35L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chicó Norte", 28L, "chico-norte", 4 },
                    { 36L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "El Retiro", 28L, "el-retiro", 4 },
                    { 37L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quinta Camacho", 29L, "quinta-camacho", 4 },
                    { 38L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Niza Sur", 30L, "niza-sur", 4 },
                    { 39L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Colina Campestre", 30L, "colina-campestre", 4 },
                    { 40L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Prado Veraniego", 31L, "prado-veraniego", 4 },
                    { 41L, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Castilla Central", 32L, "castilla-central", 4 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_caracteristicas_categoria_id_nombre",
                table: "caracteristicas",
                columns: new[] { "categoria_id", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categorias_caracteristica_nombre",
                table: "categorias_caracteristica",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_imagenes_inmueble",
                table: "imagenes",
                columns: new[] { "inmueble_id", "orden" });

            migrationBuilder.CreateIndex(
                name: "idx_una_portada",
                table: "imagenes",
                column: "inmueble_id",
                unique: true,
                filter: "es_portada = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_inm_caract_caract",
                table: "inmueble_caracteristicas",
                column: "caracteristica_id");

            migrationBuilder.CreateIndex(
                name: "idx_inmueble_historial_inmueble",
                table: "inmueble_historial",
                column: "inmueble_id");

            migrationBuilder.CreateIndex(
                name: "IX_inmueble_historial_usuario_id",
                table: "inmueble_historial",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "idx_operaciones_filtro",
                table: "inmueble_operaciones",
                columns: new[] { "tipo_operacion", "precio", "estado" },
                filter: "activo = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_inmueble_operaciones_inmueble_id_tipo_operacion",
                table: "inmueble_operaciones",
                columns: new[] { "inmueble_id", "tipo_operacion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_inmuebles_destacado",
                table: "inmuebles",
                column: "destacado",
                filter: "estado = 'publicado'");

            migrationBuilder.CreateIndex(
                name: "idx_inmuebles_filtros",
                table: "inmuebles",
                columns: new[] { "estado", "tipo_inmueble_id", "ubicacion_id", "estrato" },
                filter: "eliminado_en IS NULL");

            migrationBuilder.CreateIndex(
                name: "idx_inmuebles_geo",
                table: "inmuebles",
                columns: new[] { "latitud_aproximada", "longitud_aproximada" });

            migrationBuilder.CreateIndex(
                name: "idx_inmuebles_tsv",
                table: "inmuebles",
                column: "busqueda_tsv")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_asesor_id",
                table: "inmuebles",
                column: "asesor_id");

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_codigo_referencia",
                table: "inmuebles",
                column: "codigo_referencia",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_creado_por",
                table: "inmuebles",
                column: "creado_por");

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_slug",
                table: "inmuebles",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_tipo_inmueble_id",
                table: "inmuebles",
                column: "tipo_inmueble_id");

            migrationBuilder.CreateIndex(
                name: "IX_inmuebles_ubicacion_id",
                table: "inmuebles",
                column: "ubicacion_id");

            migrationBuilder.CreateIndex(
                name: "idx_leads_estado",
                table: "leads",
                column: "estado");

            migrationBuilder.CreateIndex(
                name: "idx_leads_inmueble",
                table: "leads",
                column: "inmueble_id");

            migrationBuilder.CreateIndex(
                name: "IX_leads_asignado_a",
                table: "leads",
                column: "asignado_a");

            migrationBuilder.CreateIndex(
                name: "idx_prt_usuario",
                table: "password_reset_tokens",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tipos_inmueble_nombre",
                table: "tipos_inmueble",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tipos_inmueble_slug",
                table: "tipos_inmueble",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ubicaciones_padre",
                table: "ubicaciones",
                column: "padre_id");

            migrationBuilder.CreateIndex(
                name: "idx_ubicaciones_tipo",
                table: "ubicaciones",
                column: "tipo");

            migrationBuilder.CreateIndex(
                name: "IX_ubicaciones_tipo_slug_padre_id",
                table: "ubicaciones",
                columns: new[] { "tipo", "slug", "padre_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_usuarios_rol",
                table: "usuarios",
                column: "rol",
                filter: "activo = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_correo",
                table: "usuarios",
                column: "correo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imagenes");

            migrationBuilder.DropTable(
                name: "inmueble_caracteristicas");

            migrationBuilder.DropTable(
                name: "inmueble_historial");

            migrationBuilder.DropTable(
                name: "inmueble_operaciones");

            migrationBuilder.DropTable(
                name: "leads");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "caracteristicas");

            migrationBuilder.DropTable(
                name: "inmuebles");

            migrationBuilder.DropTable(
                name: "categorias_caracteristica");

            migrationBuilder.DropTable(
                name: "tipos_inmueble");

            migrationBuilder.DropTable(
                name: "ubicaciones");

            migrationBuilder.DropTable(
                name: "usuarios");
        }
    }
}
