-- ============================================================
--  migration_v2_to_v4.sql
--  Migración incremental: aplica sobre una BD v2 existente
--  todos los cambios necesarios para llegar al schema v4.
--
--  Seguro para ejecutar múltiples veces (IF NOT EXISTS / IF EXISTS).
--  NO borra datos existentes.
-- ============================================================


-- ============================================================
-- 1. vehicles: agregar columna 'brand' separada de 'model'
--    En v2, model guardaba "Marca Modelo" concatenado.
--    Separamos: brand = primera palabra, model = el resto.
-- ============================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand VARCHAR(60) NOT NULL DEFAULT '';

UPDATE vehicles
SET
    brand = split_part(model, ' ', 1),
    model = trim(substring(model FROM position(' ' IN model) + 1))
WHERE brand = '';


-- ============================================================
-- 2. vehicles: agregar latitud/longitud a trips si faltan
--    (schema v3 agregó coordenadas)
-- ============================================================
ALTER TABLE trips ADD COLUMN IF NOT EXISTS from_latitude  NUMERIC(18,15) NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS from_longitude NUMERIC(18,15) NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS to_latitude    NUMERIC(18,15) NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS to_longitude   NUMERIC(18,15) NOT NULL DEFAULT 0;


-- ============================================================
-- 3. driver_applications: agregar columna application_type
-- ============================================================
ALTER TABLE driver_applications
    ADD COLUMN IF NOT EXISTS application_type VARCHAR(20) NOT NULL DEFAULT 'driver';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_app_type'
          AND conrelid = 'driver_applications'::regclass
    ) THEN
        ALTER TABLE driver_applications
            ADD CONSTRAINT chk_app_type
            CHECK (application_type IN ('driver', 'vehicle'));
    END IF;
END;
$$;

-- Permite cadena vacía en cedula/address para solicitudes de tipo 'vehicle'
ALTER TABLE driver_applications ALTER COLUMN cedula  SET DEFAULT '';
ALTER TABLE driver_applications ALTER COLUMN address SET DEFAULT '';


-- ============================================================
-- 4. Índices nuevos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_driver_app_type ON driver_applications(application_type);


-- ============================================================
-- 5. Verificación final
-- ============================================================
SELECT
    u.username,
    u.role,
    COUNT(v.vehicle_id) AS vehiculos
FROM users u
LEFT JOIN vehicles v ON v.user_id = u.user_id
WHERE u.role = 'driver'
GROUP BY u.username, u.role
ORDER BY u.username;
