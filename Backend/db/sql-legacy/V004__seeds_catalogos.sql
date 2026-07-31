-- =====================================================================
-- V004: Datos semilla (backlog: Infraestructura de datos)
--   - Ubicaciones de Bogotá: zonas -> localidades -> UPZ/barrios de ejemplo
--   - Tipos de inmueble
--   - Catálogo inicial de características agrupadas (pendiente validar
--     con patrocinador, ver 05-proximos-pasos.md #1 — ampliar con INSERTs)
--   - Usuario admin SOLO PARA DESARROLLO (cambiar/eliminar en producción)
-- Rollback: V004__seeds_catalogos_down.sql
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- para crypt()/gen_salt() (seed admin dev)

-- =========================================================
-- UBICACIONES: zonas de Bogotá
-- =========================================================
INSERT INTO ubicaciones (tipo, nombre, slug) VALUES
    ('zona', 'Norte',         'norte'),
    ('zona', 'Noroccidente',  'noroccidente'),
    ('zona', 'Occidente',     'occidente'),
    ('zona', 'Centro',        'centro'),
    ('zona', 'Sur',           'sur'),
    ('zona', 'Suroccidente',  'suroccidente');

-- Localidades (padre = zona)
INSERT INTO ubicaciones (tipo, nombre, slug, padre_id) VALUES
    ('localidad', 'Usaquén',            'usaquen',            (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'norte')),
    ('localidad', 'Chapinero',          'chapinero',          (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'norte')),
    ('localidad', 'Suba',               'suba',               (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'noroccidente')),
    ('localidad', 'Engativá',           'engativa',           (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'noroccidente')),
    ('localidad', 'Barrios Unidos',     'barrios-unidos',     (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'noroccidente')),
    ('localidad', 'Fontibón',           'fontibon',           (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'occidente')),
    ('localidad', 'Teusaquillo',        'teusaquillo',        (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'centro')),
    ('localidad', 'Santa Fe',           'santa-fe',           (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'centro')),
    ('localidad', 'La Candelaria',      'la-candelaria',      (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'centro')),
    ('localidad', 'Los Mártires',       'los-martires',       (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'centro')),
    ('localidad', 'Puente Aranda',      'puente-aranda',      (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'suroccidente')),
    ('localidad', 'Kennedy',            'kennedy',            (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'suroccidente')),
    ('localidad', 'Bosa',               'bosa',               (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'suroccidente')),
    ('localidad', 'Antonio Nariño',     'antonio-narino',     (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur')),
    ('localidad', 'Rafael Uribe Uribe', 'rafael-uribe-uribe', (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur')),
    ('localidad', 'Tunjuelito',         'tunjuelito',         (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur')),
    ('localidad', 'San Cristóbal',      'san-cristobal',      (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur')),
    ('localidad', 'Usme',               'usme',               (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur')),
    ('localidad', 'Ciudad Bolívar',     'ciudad-bolivar',     (SELECT id FROM ubicaciones WHERE tipo = 'zona' AND slug = 'sur'));

-- UPZ de ejemplo (padre = localidad)
INSERT INTO ubicaciones (tipo, nombre, slug, padre_id) VALUES
    ('upz', 'Santa Bárbara',   'santa-barbara',   (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'usaquen')),
    ('upz', 'Country Club',    'country-club',    (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'usaquen')),
    ('upz', 'Chicó Lago',      'chico-lago',      (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'chapinero')),
    ('upz', 'Chapinero Norte', 'chapinero-norte', (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'chapinero')),
    ('upz', 'Niza',            'niza',            (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'suba')),
    ('upz', 'El Prado',        'el-prado',        (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'suba')),
    ('upz', 'Castilla',        'castilla',        (SELECT id FROM ubicaciones WHERE tipo = 'localidad' AND slug = 'kennedy'));

-- Barrios de ejemplo (padre = UPZ)
INSERT INTO ubicaciones (tipo, nombre, slug, padre_id) VALUES
    ('barrio', 'Santa Bárbara Occidental', 'santa-barbara-occidental', (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'santa-barbara')),
    ('barrio', 'Molinos Norte',            'molinos-norte',            (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'santa-barbara')),
    ('barrio', 'Chicó Norte',              'chico-norte',              (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'chico-lago')),
    ('barrio', 'El Retiro',                'el-retiro',                (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'chico-lago')),
    ('barrio', 'Quinta Camacho',           'quinta-camacho',           (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'chapinero-norte')),
    ('barrio', 'Niza Sur',                 'niza-sur',                 (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'niza')),
    ('barrio', 'Colina Campestre',         'colina-campestre',         (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'niza')),
    ('barrio', 'Prado Veraniego',          'prado-veraniego',          (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'el-prado')),
    ('barrio', 'Castilla Central',         'castilla-central',         (SELECT id FROM ubicaciones WHERE tipo = 'upz' AND slug = 'castilla'));

-- =========================================================
-- TIPOS DE INMUEBLE
-- =========================================================
INSERT INTO tipos_inmueble (nombre, slug, orden) VALUES
    ('Apartamento',    'apartamento',    1),
    ('Casa',           'casa',           2),
    ('Apartaestudio',  'apartaestudio',  3),
    ('Local',          'local',          4),
    ('Oficina',        'oficina',        5),
    ('Bodega',         'bodega',         6),
    ('Lote',           'lote',           7);

-- =========================================================
-- CARACTERÍSTICAS agrupadas por categoría
-- =========================================================
INSERT INTO categorias_caracteristica (nombre, orden) VALUES
    ('Interior',      1),
    ('Zonas comunes', 2),
    ('Servicios',     3),
    ('Seguridad',     4);

INSERT INTO caracteristicas (categoria_id, nombre, tipo_valor, filtrable, icono) VALUES
    -- Interior
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Cocina integral',    'booleano', TRUE,  'kitchen'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Calentador',         'booleano', TRUE,  'water-heater'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Closets',            'numero',   FALSE, 'closet'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Balcón',             'booleano', TRUE,  'balcony'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Terraza',            'booleano', TRUE,  'terrace'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Estudio',            'booleano', FALSE, 'study'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Depósito',           'booleano', FALSE, 'storage'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Interior'), 'Chimenea',           'booleano', FALSE, 'fireplace'),
    -- Zonas comunes
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Ascensor',        'booleano', TRUE,  'elevator'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Piscina',         'booleano', TRUE,  'pool'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Gimnasio',        'booleano', TRUE,  'gym'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Salón comunal',   'booleano', FALSE, 'community-room'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Parque infantil', 'booleano', FALSE, 'playground'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Zona BBQ',        'booleano', FALSE, 'bbq'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Zonas comunes'), 'Cancha múltiple', 'booleano', FALSE, 'court'),
    -- Servicios
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Servicios'), 'Internet incluido', 'booleano', TRUE,  'wifi'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Servicios'), 'Gas natural',       'booleano', TRUE,  'gas'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Servicios'), 'Aire acondicionado','booleano', FALSE, 'ac'),
    -- Seguridad
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Seguridad'), 'Vigilancia 24h',    'booleano', TRUE,  'security'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Seguridad'), 'Portería',          'booleano', TRUE,  'doorman'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Seguridad'), 'CCTV',              'booleano', FALSE, 'cctv'),
    ((SELECT id FROM categorias_caracteristica WHERE nombre = 'Seguridad'), 'Alarma',            'booleano', FALSE, 'alarm');

-- =========================================================
-- USUARIO ADMIN — SOLO DESARROLLO
-- Credenciales dev: admin@portal.local / Admin123*
-- ⚠ En producción: eliminar este usuario o cambiar la contraseña de inmediato.
-- =========================================================
INSERT INTO usuarios (nombre, correo, password_hash, rol)
VALUES (
    'Administrador Dev',
    'admin@portal.local',
    crypt('Admin123*', gen_salt('bf', 11)),   -- bcrypt $2a$, compatible con BCrypt.Net
    'admin'
);

COMMIT;
