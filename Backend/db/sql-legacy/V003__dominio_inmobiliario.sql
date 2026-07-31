-- =====================================================================
-- V003: Dominio inmobiliario completo (DDL de Task/BackEnd/02-modelo-de-datos.md)
--       + soporte de auth: refresh token en usuarios y tokens de
--       recuperación de contraseña (RF-062).
-- Aplicar manualmente, en orden, después de V002.
-- Rollback: V003__dominio_inmobiliario_down.sql
-- =====================================================================

BEGIN;

-- =========================================================
-- AUTH: sesión única por usuario (refresh token hasheado)
-- =========================================================
ALTER TABLE usuarios
    ADD COLUMN refresh_token_hash   TEXT,
    ADD COLUMN refresh_token_expira TIMESTAMPTZ;

-- Tokens de recuperación de contraseña de un solo uso (RF-062)
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,            -- SHA-256 del token; el token plano solo viaja por correo
    expira_en   TIMESTAMPTZ NOT NULL,
    usado_en    TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_usuario ON password_reset_tokens(usuario_id);

-- =========================================================
-- UBICACIONES (jerárquica: zona -> localidad -> upz -> barrio)
-- =========================================================
CREATE TYPE tipo_ubicacion AS ENUM ('zona', 'localidad', 'upz', 'barrio');

CREATE TABLE ubicaciones (
    id              BIGSERIAL PRIMARY KEY,
    tipo            tipo_ubicacion NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    slug            VARCHAR(140) NOT NULL,
    padre_id        BIGINT REFERENCES ubicaciones(id),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tipo, slug, padre_id)
);
CREATE INDEX idx_ubicaciones_padre ON ubicaciones(padre_id);
CREATE INDEX idx_ubicaciones_tipo ON ubicaciones(tipo);

-- =========================================================
-- CATÁLOGOS: tipos de inmueble y características
-- =========================================================
CREATE TABLE tipos_inmueble (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    slug        VARCHAR(70) NOT NULL UNIQUE,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    orden       SMALLINT DEFAULT 0
);

CREATE TABLE categorias_caracteristica (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE,
    orden       SMALLINT DEFAULT 0
);

CREATE TABLE caracteristicas (
    id              SERIAL PRIMARY KEY,
    categoria_id    INT NOT NULL REFERENCES categorias_caracteristica(id),
    nombre          VARCHAR(100) NOT NULL,
    icono           VARCHAR(60),
    tipo_valor      VARCHAR(20) NOT NULL DEFAULT 'booleano', -- booleano | numero | texto
    filtrable       BOOLEAN NOT NULL DEFAULT TRUE,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (categoria_id, nombre)
);

-- =========================================================
-- INMUEBLES (entidad central)
-- =========================================================
CREATE TYPE estado_inmueble AS ENUM ('borrador', 'publicado', 'pausado', 'archivado');

CREATE TYPE politica_mascotas AS ENUM ('permitidas', 'no_permitidas', 'con_restricciones');

CREATE TABLE inmuebles (
    id                      BIGSERIAL PRIMARY KEY,
    codigo_referencia       VARCHAR(20) NOT NULL UNIQUE,   -- generado automático (RF-074)
    slug                    VARCHAR(180) NOT NULL UNIQUE,  -- SEO (RF-074 / RNF-050)
    titulo                  VARCHAR(160) NOT NULL,
    descripcion             TEXT,

    tipo_inmueble_id        INT NOT NULL REFERENCES tipos_inmueble(id),
    ubicacion_id            BIGINT NOT NULL REFERENCES ubicaciones(id),

    -- Dirección: pública aproximada vs. privada exacta (RF-044)
    direccion_exacta        VARCHAR(200) NOT NULL,   -- SOLO visible en panel admin
    latitud_exacta          NUMERIC(10,7),
    longitud_exacta         NUMERIC(10,7),
    latitud_aproximada      NUMERIC(10,7) NOT NULL,
    longitud_aproximada     NUMERIC(10,7) NOT NULL,

    area_construida_m2      NUMERIC(8,2),
    area_privada_m2         NUMERIC(8,2),
    habitaciones            SMALLINT NOT NULL DEFAULT 0,
    banos                   SMALLINT NOT NULL DEFAULT 0,
    parqueaderos            SMALLINT NOT NULL DEFAULT 0,
    piso                    SMALLINT,
    pisos_edificio          SMALLINT,
    estrato                 SMALLINT CHECK (estrato BETWEEN 1 AND 6),
    antiguedad              VARCHAR(30),
    orientacion             VARCHAR(20),

    politica_mascotas       politica_mascotas NOT NULL DEFAULT 'no_permitidas',
    amoblado                VARCHAR(20) DEFAULT 'no',   -- 'si' | 'no' | 'semi'

    matricula_inmobiliaria  VARCHAR(60),

    estado                  estado_inmueble NOT NULL DEFAULT 'borrador',
    destacado               BOOLEAN NOT NULL DEFAULT FALSE,

    meta_titulo             VARCHAR(160),
    meta_descripcion        VARCHAR(320),

    asesor_id               BIGINT REFERENCES usuarios(id),
    creado_por              BIGINT REFERENCES usuarios(id),

    creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    eliminado_en            TIMESTAMPTZ,   -- borrado lógico (RF-073)

    busqueda_tsv            TSVECTOR       -- texto libre (RF-025)
);

CREATE INDEX idx_inmuebles_filtros
    ON inmuebles (estado, tipo_inmueble_id, ubicacion_id, estrato)
    WHERE eliminado_en IS NULL;
CREATE INDEX idx_inmuebles_destacado ON inmuebles(destacado) WHERE estado = 'publicado';
CREATE INDEX idx_inmuebles_tsv ON inmuebles USING GIN (busqueda_tsv);
CREATE INDEX idx_inmuebles_geo ON inmuebles (latitud_aproximada, longitud_aproximada);

-- Trigger que mantiene busqueda_tsv (RF-025). Usa unaccent (extensión de V001).
CREATE OR REPLACE FUNCTION inmuebles_actualizar_tsv() RETURNS trigger AS $$
BEGIN
    NEW.busqueda_tsv :=
        setweight(to_tsvector('spanish', unaccent(coalesce(NEW.titulo, ''))), 'A') ||
        setweight(to_tsvector('spanish', unaccent(coalesce(NEW.codigo_referencia, ''))), 'A') ||
        setweight(to_tsvector('spanish', unaccent(coalesce(NEW.descripcion, ''))), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inmuebles_tsv
    BEFORE INSERT OR UPDATE OF titulo, descripcion, codigo_referencia
    ON inmuebles
    FOR EACH ROW EXECUTE FUNCTION inmuebles_actualizar_tsv();

-- =========================================================
-- OPERACIONES: venta y/o arriendo con precios independientes (RF-076)
-- =========================================================
CREATE TYPE tipo_operacion AS ENUM ('venta', 'arriendo');
CREATE TYPE estado_operacion AS ENUM ('disponible', 'reservado', 'cerrado');

CREATE TABLE inmueble_operaciones (
    id                      BIGSERIAL PRIMARY KEY,
    inmueble_id             BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    tipo_operacion          tipo_operacion NOT NULL,
    precio                  NUMERIC(14,2) NOT NULL,
    cuota_administracion    NUMERIC(12,2) DEFAULT 0,
    admin_incluida          BOOLEAN NOT NULL DEFAULT FALSE,
    estado                  estado_operacion NOT NULL DEFAULT 'disponible',
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (inmueble_id, tipo_operacion)
);
CREATE INDEX idx_operaciones_filtro
    ON inmueble_operaciones (tipo_operacion, precio, estado) WHERE activo = TRUE;

-- =========================================================
-- CARACTERÍSTICAS DEL INMUEBLE (N:M, extensible sin migración — RNF-011)
-- =========================================================
CREATE TABLE inmueble_caracteristicas (
    inmueble_id         BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    caracteristica_id   INT NOT NULL REFERENCES caracteristicas(id),
    valor               VARCHAR(60),   -- NULL en booleanas = true
    PRIMARY KEY (inmueble_id, caracteristica_id)
);
CREATE INDEX idx_inm_caract_caract ON inmueble_caracteristicas(caracteristica_id);

-- =========================================================
-- MULTIMEDIA (metadatos; el binario vive en almacenamiento de objetos — RNF-013)
-- =========================================================
CREATE TABLE imagenes (
    id              BIGSERIAL PRIMARY KEY,
    inmueble_id     BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    storage_key     TEXT NOT NULL,
    url_cdn         TEXT NOT NULL,
    url_thumbnail   TEXT,
    formato         VARCHAR(10) NOT NULL,   -- jpg | png | webp
    peso_bytes      INT,
    orden           SMALLINT NOT NULL DEFAULT 0,
    es_portada      BOOLEAN NOT NULL DEFAULT FALSE,
    texto_alt       VARCHAR(150),
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_una_portada ON imagenes(inmueble_id) WHERE es_portada = TRUE;
CREATE INDEX idx_imagenes_inmueble ON imagenes(inmueble_id, orden);

-- =========================================================
-- LEADS (captura de contactos con trazabilidad — RF-003)
-- =========================================================
CREATE TYPE estado_lead AS ENUM ('nuevo', 'contactado', 'descartado', 'cerrado');

CREATE TABLE leads (
    id                  BIGSERIAL PRIMARY KEY,
    inmueble_id         BIGINT REFERENCES inmuebles(id),   -- NULL si es contacto general
    nombre              VARCHAR(120) NOT NULL,
    correo              VARCHAR(150),
    telefono            VARCHAR(30),
    mensaje             TEXT,
    origen              VARCHAR(60) NOT NULL,   -- 'formulario_inmueble' | 'formulario_general' | 'whatsapp'
    utm_source          VARCHAR(60),
    utm_campaign        VARCHAR(60),
    acepto_tratamiento_datos BOOLEAN NOT NULL DEFAULT FALSE,  -- RNF-061
    estado              estado_lead NOT NULL DEFAULT 'nuevo',
    asignado_a          BIGINT REFERENCES usuarios(id),
    ip_origen           INET,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_inmueble ON leads(inmueble_id);
CREATE INDEX idx_leads_estado ON leads(estado);

-- =========================================================
-- Historial de estado/precio (auditoría — opcional en MVP)
-- =========================================================
CREATE TABLE inmueble_historial (
    id              BIGSERIAL PRIMARY KEY,
    inmueble_id     BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    campo           VARCHAR(40) NOT NULL,   -- 'estado' | 'precio_venta' | 'precio_arriendo'
    valor_anterior  VARCHAR(60),
    valor_nuevo     VARCHAR(60),
    usuario_id      BIGINT REFERENCES usuarios(id),
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
