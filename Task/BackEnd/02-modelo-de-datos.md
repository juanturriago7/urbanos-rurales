## 2. Modelo de datos

**Motor recomendado:** PostgreSQL (ENUM nativos, `TSVECTOR` para búsqueda de texto libre, JSONB si se requiere flexibilidad puntual, compatible con PostGIS si a futuro se necesita geolocalización avanzada).

### 2.1 Entidades

```
ubicaciones (jerárquica: zona → localidad → upz → barrio)
tipos_inmueble (catálogo)
categorias_caracteristica (catálogo, agrupa características)
caracteristicas (catálogo, referencia categoria)
usuarios (admin / asesor)
inmuebles (entidad central)
inmueble_operaciones (venta y/o arriendo, precios independientes)
inmueble_caracteristicas (N:M inmueble ↔ caracteristica)
imagenes (multimedia por inmueble)
leads (captura de contacto)
inmueble_historial (auditoría opcional)
```

### 2.2 Relaciones

```
ubicaciones 1───N inmuebles
tipos_inmueble 1───N inmuebles
usuarios 1───N inmuebles (asesor_id, creado_por)
inmuebles 1───N inmueble_operaciones   (venta / arriendo, precios separados)
inmuebles 1───N imagenes
inmuebles N───N caracteristicas (vía inmueble_caracteristicas)
caracteristicas N───1 categorias_caracteristica
inmuebles 1───N leads
usuarios 1───N leads (asignado_a)
```

### 2.3 DDL de referencia

```sql
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
    nombre      VARCHAR(60) NOT NULL UNIQUE,   -- apartamento, casa, apartaestudio, local, oficina, bodega, lote
    slug        VARCHAR(70) NOT NULL UNIQUE,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    orden       SMALLINT DEFAULT 0
);

CREATE TABLE categorias_caracteristica (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE,   -- "Zonas comunes", "Servicios", "Interior", "Seguridad"
    orden       SMALLINT DEFAULT 0
);

CREATE TABLE caracteristicas (
    id              SERIAL PRIMARY KEY,
    categoria_id    INT NOT NULL REFERENCES categorias_caracteristica(id),
    nombre          VARCHAR(100) NOT NULL,      -- "Piscina", "Amoblado", "Calentador", "Ascensor"
    icono           VARCHAR(60),
    tipo_valor      VARCHAR(20) NOT NULL DEFAULT 'booleano', -- booleano | numero | texto (p.ej. "Closets": numero)
    filtrable       BOOLEAN NOT NULL DEFAULT TRUE,           -- controla si aparece como filtro público
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (categoria_id, nombre)
);
-- Agregar una nueva amenidad = un INSERT aquí. Cumple RNF-011 (sin migración).

-- =========================================================
-- USUARIOS (panel administrativo)
-- =========================================================
CREATE TYPE rol_usuario AS ENUM ('admin', 'asesor');

CREATE TABLE usuarios (
    id                  BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,           -- bcrypt/Argon2 (RNF-021)
    rol                 rol_usuario NOT NULL DEFAULT 'asesor',
    telefono            VARCHAR(30),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos   SMALLINT NOT NULL DEFAULT 0,
    bloqueado_hasta     TIMESTAMPTZ,             -- RF-063
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- INMUEBLES (entidad central)
-- =========================================================
CREATE TYPE estado_inmueble AS ENUM (
    'borrador', 'publicado', 'pausado', 'archivado'   -- estado editorial (RF-075)
);

CREATE TYPE politica_mascotas AS ENUM ('permitidas', 'no_permitidas', 'con_restricciones');

CREATE TABLE inmuebles (
    id                      BIGSERIAL PRIMARY KEY,
    codigo_referencia       VARCHAR(20) NOT NULL UNIQUE,   -- generado automático (RF-074)
    slug                    VARCHAR(180) NOT NULL UNIQUE,  -- SEO (RF-074 / RNF-050)
    titulo                  VARCHAR(160) NOT NULL,
    descripcion             TEXT,

    tipo_inmueble_id        INT NOT NULL REFERENCES tipos_inmueble(id),
    ubicacion_id            BIGINT NOT NULL REFERENCES ubicaciones(id), -- barrio (nivel más específico)

    -- Dirección: pública aproximada vs. privada exacta (RF-044)
    direccion_exacta        VARCHAR(200) NOT NULL,   -- SOLO visible en panel admin
    latitud_exacta          NUMERIC(10,7),
    longitud_exacta         NUMERIC(10,7),
    latitud_aproximada      NUMERIC(10,7) NOT NULL,  -- con jitter/redondeo, visible al público
    longitud_aproximada     NUMERIC(10,7) NOT NULL,

    area_construida_m2      NUMERIC(8,2),
    area_privada_m2         NUMERIC(8,2),
    habitaciones            SMALLINT NOT NULL DEFAULT 0,
    banos                   SMALLINT NOT NULL DEFAULT 0,
    parqueaderos             SMALLINT NOT NULL DEFAULT 0,
    piso                    SMALLINT,
    pisos_edificio          SMALLINT,
    estrato                 SMALLINT CHECK (estrato BETWEEN 1 AND 6),
    antiguedad              VARCHAR(30),   -- 'nuevo' | 'sobre_planos' | 'usado_menos_5' | 'usado_mas_5'
    orientacion             VARCHAR(20),

    politica_mascotas       politica_mascotas NOT NULL DEFAULT 'no_permitidas',
    amoblado                VARCHAR(20) DEFAULT 'no',   -- 'si' | 'no' | 'semi'

    matricula_inmobiliaria  VARCHAR(60),   -- cumplimiento RNF-063

    estado                  estado_inmueble NOT NULL DEFAULT 'borrador',
    destacado               BOOLEAN NOT NULL DEFAULT FALSE,

    meta_titulo             VARCHAR(160),
    meta_descripcion        VARCHAR(320),

    asesor_id               BIGINT REFERENCES usuarios(id),
    creado_por              BIGINT REFERENCES usuarios(id),

    creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    eliminado_en            TIMESTAMPTZ,   -- borrado lógico (RF-073)

    busqueda_tsv            TSVECTOR       -- soporte de texto libre (RF-025)
);

CREATE INDEX idx_inmuebles_filtros
    ON inmuebles (estado, tipo_inmueble_id, ubicacion_id, estrato)
    WHERE eliminado_en IS NULL;
CREATE INDEX idx_inmuebles_destacado ON inmuebles(destacado) WHERE estado = 'publicado';
CREATE INDEX idx_inmuebles_tsv ON inmuebles USING GIN (busqueda_tsv);
CREATE INDEX idx_inmuebles_geo ON inmuebles (latitud_aproximada, longitud_aproximada);

-- =========================================================
-- OPERACIONES: un inmueble puede estar en venta y arriendo a la vez (RF-076)
-- =========================================================
CREATE TYPE tipo_operacion AS ENUM ('venta', 'arriendo');
CREATE TYPE estado_operacion AS ENUM ('disponible', 'reservado', 'cerrado'); -- cerrado = vendido/arrendado

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
-- CARACTERÍSTICAS DEL INMUEBLE (N:M, extensible sin migración)
-- =========================================================
CREATE TABLE inmueble_caracteristicas (
    inmueble_id         BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    caracteristica_id   INT NOT NULL REFERENCES caracteristicas(id),
    valor               VARCHAR(60),   -- ej. "3" para closets, NULL para booleanas (implica true)
    PRIMARY KEY (inmueble_id, caracteristica_id)
);
CREATE INDEX idx_inm_caract_caract ON inmueble_caracteristicas(caracteristica_id);

-- =========================================================
-- MULTIMEDIA (almacenamiento en S3/objeto, no en filesystem — RNF-013)
-- =========================================================
CREATE TABLE imagenes (
    id              BIGSERIAL PRIMARY KEY,
    inmueble_id     BIGINT NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
    storage_key     TEXT NOT NULL,          -- ruta en el bucket S3
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
-- (Opcional) Historial de estado/precio — auditoría, no bloquea MVP
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
```

### 2.4 Cómo se resuelve cada filtro

| Filtro | Resolución en el modelo |
| --- | --- |
| Ubicación (zona/localidad/barrio) | `ubicaciones` jerárquica + `inmuebles.ubicacion_id`; se sube por `padre_id` para filtrar por zona o localidad completa |
| Rango de precio | `inmueble_operaciones.precio` con índice compuesto `(tipo_operacion, precio)` |
| Categoría casa/apartamento | `tipos_inmueble` + `inmuebles.tipo_inmueble_id` |
| Compra/arriendo | `inmueble_operaciones.tipo_operacion` (permite ambas a la vez, RF-076) |
| Mascotas | `inmuebles.politica_mascotas` (enum) |
| Metros cuadrados | `area_construida_m2` / `area_privada_m2`, filtro por rango (`BETWEEN`) |
| Baños / habitaciones / parqueaderos | Columnas propias en `inmuebles` (numéricas, indexables) |
| Cocina, internet, amoblado, etc. | Catálogo `caracteristicas` + `inmueble_caracteristicas`, sin tocar el esquema al agregar nuevas (RNF-011) |
| Dirección | `direccion_exacta` (solo admin) vs. `latitud/longitud_aproximada` (público, RF-044) |

