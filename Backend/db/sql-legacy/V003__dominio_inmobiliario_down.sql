-- =====================================================================
-- Rollback de V003__dominio_inmobiliario.sql
-- =====================================================================

BEGIN;

DROP TABLE IF EXISTS inmueble_historial;
DROP TABLE IF EXISTS leads;
DROP TYPE  IF EXISTS estado_lead;

DROP TABLE IF EXISTS imagenes;
DROP TABLE IF EXISTS inmueble_caracteristicas;

DROP TABLE IF EXISTS inmueble_operaciones;
DROP TYPE  IF EXISTS estado_operacion;
DROP TYPE  IF EXISTS tipo_operacion;

DROP TRIGGER  IF EXISTS trg_inmuebles_tsv ON inmuebles;
DROP TABLE    IF EXISTS inmuebles;
DROP FUNCTION IF EXISTS inmuebles_actualizar_tsv();
DROP TYPE     IF EXISTS politica_mascotas;
DROP TYPE     IF EXISTS estado_inmueble;

DROP TABLE IF EXISTS caracteristicas;
DROP TABLE IF EXISTS categorias_caracteristica;
DROP TABLE IF EXISTS tipos_inmueble;

DROP TABLE IF EXISTS ubicaciones;
DROP TYPE  IF EXISTS tipo_ubicacion;

DROP TABLE IF EXISTS password_reset_tokens;
ALTER TABLE usuarios
    DROP COLUMN IF EXISTS refresh_token_hash,
    DROP COLUMN IF EXISTS refresh_token_expira;

COMMIT;
