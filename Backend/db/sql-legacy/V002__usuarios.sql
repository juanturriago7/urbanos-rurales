-- ============================================================
-- V002 — Reemplaza `users` por `usuarios`
-- Alinea el esquema con el DDL de Task/BackEnd/02-modelo-de-datos.md §2.3:
--   PK BIGSERIAL, columnas en español, rol como ENUM nativo `rol_usuario`,
--   y las columnas de bloqueo por intentos fallidos que exige RF-063.
-- Rollback: V002__usuarios_down.sql
-- ============================================================

-- ============================================================
-- Tipo: rol_usuario
-- Solo 'admin' y 'asesor' — el rol 'Editor' del esquema anterior no existe
-- en el modelo de datos aprobado.
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM ('admin', 'asesor');
    END IF;
END $$;

-- ============================================================
-- Tabla: usuarios (panel administrativo)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
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

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios (rol) WHERE activo = TRUE;

-- ============================================================
-- Baja de la tabla `users` de V001
-- CASCADE elimina también sus índices; ninguna otra tabla la referencia todavía.
-- ============================================================
DROP TABLE IF EXISTS users CASCADE;

-- El catálogo `roles` se conserva (lo consume GET /api/roles), pero se elimina
-- la fila 'Editor': ese rol ya no existe en el ENUM rol_usuario.
DELETE FROM roles WHERE name = 'Editor';
