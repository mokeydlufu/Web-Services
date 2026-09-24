-- Script para insertar categorías de ofertas si no existen
-- Ejecutar en PostgreSQL con el schema correcto

SET search_path TO schema_ofertas;

-- Insertar categoría por defecto si no existe
INSERT INTO categorias_oferta (id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion)
VALUES (
    '6982324e-9a26-4c22-9634-fd18b5d3f0c1'::uuid,
    'Tecnología',
    'Empleos en el sector de tecnología e informática',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insertar más categorías útiles
INSERT INTO categorias_oferta (id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion)
VALUES 
    (gen_random_uuid(), 'Ventas', 'Empleos en el área comercial y ventas', true, NOW(), NOW()),
    (gen_random_uuid(), 'Marketing', 'Empleos en marketing y publicidad', true, NOW(), NOW()),
    (gen_random_uuid(), 'Recursos Humanos', 'Empleos en gestión de talento y RRHH', true, NOW(), NOW()),
    (gen_random_uuid(), 'Finanzas', 'Empleos en finanzas y contabilidad', true, NOW(), NOW()),
    (gen_random_uuid(), 'Administración', 'Empleos administrativos', true, NOW(), NOW()),
    (gen_random_uuid(), 'Logística', 'Empleos en logística y cadena de suministro', true, NOW(), NOW()),
    (gen_random_uuid(), 'Salud', 'Empleos en el sector salud', true, NOW(), NOW()),
    (gen_random_uuid(), 'Educación', 'Empleos en educación y formación', true, NOW(), NOW()),
    (gen_random_uuid(), 'Otros', 'Otras áreas profesionales', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Categorías insertadas: ' || COUNT(*) FROM categorias_oferta;
