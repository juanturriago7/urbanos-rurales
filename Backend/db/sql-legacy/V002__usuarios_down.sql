-- ============================================================
-- V002 (rollback) — Restaura `users` y elimina `usuarios`
-- Revierte V002__usuarios.sql dejando el esquema como lo definió V001.
-- ATENCIÓN: los usuarios creados bajo el esquema nuevo se pierden;
-- la conversión de PK BIGSERIAL → UUID no es reversible sin pérdida.
-- ============================================================

DROP INDEX IF EXISTS idx_usuarios_rol;
DROP TABLE IF EXISTS usuarios;
DROP TYPE IF EXISTS rol_usuario;

CREATE TABLE IF NOT EXISTS users (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         TEXT         NOT NULL,
    full_name             VARCHAR(200) NOT NULL,
    role                  SMALLINT     NOT NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT true,
    refresh_token         TEXT,
    refresh_token_expiry  TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ,
    is_deleted            BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);

INSERT INTO roles (name, description) VALUES
    ('Editor', 'Edición de contenido y multimedia')
ON CONFLICT (name) DO NOTHING;
