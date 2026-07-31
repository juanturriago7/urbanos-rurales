-- ============================================================
-- V001 — Schema inicial
-- Convención: snake_case en PostgreSQL, PascalCase en C#
-- Ejecutar manualmente o mediante runner de migraciones (ej: Flyway, DbUp)
-- ============================================================

-- Extensiones requeridas (se habilitan en el docker-compose)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- Tabla: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed inicial de roles
INSERT INTO roles (name, description) VALUES
    ('Admin',  'Acceso total al sistema'),
    ('Asesor', 'Gestión de propiedades y leads asignados'),
    ('Editor', 'Edición de contenido y multimedia')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Tabla: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         TEXT         NOT NULL,
    full_name             VARCHAR(200) NOT NULL,
    role                  SMALLINT     NOT NULL,  -- mapeado a UserRole enum en C#
    is_active             BOOLEAN      NOT NULL DEFAULT true,
    refresh_token         TEXT,
    refresh_token_expiry  TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ,
    is_deleted            BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);
