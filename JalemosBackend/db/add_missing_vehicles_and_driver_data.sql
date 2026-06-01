-- ============================================================
--  PATCH: completa datos faltantes en una BD con schema v2
--
--  Aplica sobre la BD existente (no recrea tablas).
--  Agrega:
--    · Vehículos para conductores que no tienen ninguno
--    · Fechas de vencimiento de licencia y Dekra en users
--    · Solicitudes de conductor aprobadas (driver_applications)
--    · Segundo vehículo para carlos.m (variedad de prueba)
--  Ejecutar UNA sola vez.
-- ============================================================

DO $$
DECLARE
    v_carlos_id UUID;
    v_maria_id  UUID;
    v_jose_id   UUID;
    v_ana_id    UUID;
BEGIN

    SELECT user_id INTO v_carlos_id FROM users WHERE username = 'carlos.m';
    SELECT user_id INTO v_maria_id  FROM users WHERE username = 'maria.r';
    SELECT user_id INTO v_jose_id   FROM users WHERE username = 'jose.l';
    SELECT user_id INTO v_ana_id    FROM users WHERE username = 'ana.p';

    -- -------------------------------------------------------
    -- VEHÍCULOS
    -- -------------------------------------------------------

    -- Carlos ya tiene ABC-123 (Toyota Corolla 2020). Se le agrega un segundo.
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE num_plate = 'JBN-882') THEN
        INSERT INTO vehicles (user_id, model, year, num_plate, color)
        VALUES (v_carlos_id, 'Hyundai Accent', 2022, 'JBN-882', 'Gris');
    END IF;

    -- María — Honda Civic 2019
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE num_plate = 'PKL-445') THEN
        INSERT INTO vehicles (user_id, model, year, num_plate, color)
        VALUES (v_maria_id, 'Honda Civic', 2019, 'PKL-445', 'Plata');
    END IF;

    -- José — Hyundai Tucson 2021
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE num_plate = 'TDR-773') THEN
        INSERT INTO vehicles (user_id, model, year, num_plate, color)
        VALUES (v_jose_id, 'Hyundai Tucson', 2021, 'TDR-773', 'Negro');
    END IF;

    -- Ana — Kia Sportage 2022
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE num_plate = 'SFM-118') THEN
        INSERT INTO vehicles (user_id, model, year, num_plate, color)
        VALUES (v_ana_id, 'Kia Sportage', 2022, 'SFM-118', 'Blanco');
    END IF;

    -- -------------------------------------------------------
    -- VENCIMIENTOS DE DOCUMENTOS (users)
    -- -------------------------------------------------------

    UPDATE users SET
        license_expiry_month = 8,  license_expiry_year  = 2027,
        dekra_expiry_month   = 11, dekra_expiry_year    = 2026
    WHERE username = 'carlos.m';

    UPDATE users SET
        license_expiry_month = 3,  license_expiry_year  = 2028,
        dekra_expiry_month   = 5,  dekra_expiry_year    = 2027
    WHERE username = 'maria.r';

    -- José tiene la Dekra vencida a propósito → activa el banner de advertencia en perfil
    UPDATE users SET
        license_expiry_month = 6,  license_expiry_year  = 2026,
        dekra_expiry_month   = 2,  dekra_expiry_year    = 2025
    WHERE username = 'jose.l';

    UPDATE users SET
        license_expiry_month = 12, license_expiry_year  = 2027,
        dekra_expiry_month   = 9,  dekra_expiry_year    = 2026
    WHERE username = 'ana.p';

    -- -------------------------------------------------------
    -- DRIVER APPLICATIONS (aprobadas)
    -- -------------------------------------------------------

    IF NOT EXISTS (SELECT 1 FROM driver_applications WHERE user_id = v_carlos_id) THEN
        INSERT INTO driver_applications (
            user_id, status, attempts,
            vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
            cedula, address,
            license_expiry_month, license_expiry_year,
            dekra_expiry_month,   dekra_expiry_year,
            is_renewal, reviewed_at, submitted_at, updated_at
        ) VALUES (
            v_carlos_id, 'approved', 1,
            'Toyota', 'Corolla', 2020, 'ABC-123', 'Blanco',
            '106340567', 'Barrio Escalante, San José',
            8, 2027, 11, 2026,
            FALSE,
            NOW() - INTERVAL '45 days',
            NOW() - INTERVAL '50 days',
            NOW() - INTERVAL '45 days'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM driver_applications WHERE user_id = v_maria_id) THEN
        INSERT INTO driver_applications (
            user_id, status, attempts,
            vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
            cedula, address,
            license_expiry_month, license_expiry_year,
            dekra_expiry_month,   dekra_expiry_year,
            is_renewal, reviewed_at, submitted_at, updated_at
        ) VALUES (
            v_maria_id, 'approved', 1,
            'Honda', 'Civic', 2019, 'PKL-445', 'Plata',
            '207891234', 'Alajuela Centro, Alajuela',
            3, 2028, 5, 2027,
            FALSE,
            NOW() - INTERVAL '60 days',
            NOW() - INTERVAL '65 days',
            NOW() - INTERVAL '60 days'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM driver_applications WHERE user_id = v_jose_id) THEN
        INSERT INTO driver_applications (
            user_id, status, attempts,
            vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
            cedula, address,
            license_expiry_month, license_expiry_year,
            dekra_expiry_month,   dekra_expiry_year,
            is_renewal, reviewed_at, submitted_at, updated_at
        ) VALUES (
            v_jose_id, 'approved', 2,
            'Hyundai', 'Tucson', 2021, 'TDR-773', 'Negro',
            '302346789', 'San Pedro, San José',
            6, 2026, 2, 2025,
            FALSE,
            NOW() - INTERVAL '90 days',
            NOW() - INTERVAL '95 days',
            NOW() - INTERVAL '90 days'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM driver_applications WHERE user_id = v_ana_id) THEN
        INSERT INTO driver_applications (
            user_id, status, attempts,
            vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
            cedula, address,
            license_expiry_month, license_expiry_year,
            dekra_expiry_month,   dekra_expiry_year,
            is_renewal, reviewed_at, submitted_at, updated_at
        ) VALUES (
            v_ana_id, 'approved', 1,
            'Kia', 'Sportage', 2022, 'SFM-118', 'Blanco',
            '401237890', 'Heredia Centro, Heredia',
            12, 2027, 9, 2026,
            FALSE,
            NOW() - INTERVAL '20 days',
            NOW() - INTERVAL '25 days',
            NOW() - INTERVAL '20 days'
        );
    END IF;

END;
$$;

-- Verificación
SELECT u.username, u.role,
       u.license_expiry_month, u.license_expiry_year,
       u.dekra_expiry_month,   u.dekra_expiry_year,
       COUNT(v.vehicle_id) AS vehiculos,
       COUNT(da.application_id) AS solicitudes
FROM users u
LEFT JOIN vehicles          v  ON v.user_id = u.user_id
LEFT JOIN driver_applications da ON da.user_id = u.user_id
WHERE u.role = 'driver'
GROUP BY u.user_id
ORDER BY u.username;
