-- =====================================================================
-- Rollback de V004__seeds_catalogos.sql
-- =====================================================================

BEGIN;

DELETE FROM usuarios WHERE correo = 'admin@portal.local';

DELETE FROM caracteristicas;
DELETE FROM categorias_caracteristica;
DELETE FROM tipos_inmueble;

-- Ubicaciones: de hoja a raíz por la FK autorreferenciada
DELETE FROM ubicaciones WHERE tipo = 'barrio';
DELETE FROM ubicaciones WHERE tipo = 'upz';
DELETE FROM ubicaciones WHERE tipo = 'localidad';
DELETE FROM ubicaciones WHERE tipo = 'zona';

COMMIT;
