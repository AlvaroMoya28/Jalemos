-- ============================================================
--  fix_driver_vehicles.sql  (schema v2)
--  Agrega vehículos a conductores (role = 'driver') que tienen
--  una solicitud aprobada pero ningún vehículo registrado.
--
--  Schema v2: vehicles tiene columna 'model' (no 'brand').
--  Se guarda "Marca Modelo" concatenado en esa columna.
--  Seguro para ejecutar múltiples veces.
-- ============================================================

INSERT INTO vehicles (vehicle_id, user_id, model, year, num_plate, color, active, created_at)
SELECT
    gen_random_uuid(),
    da.user_id,
    da.vehicle_brand || ' ' || da.vehicle_model,
    da.vehicle_year,
    da.vehicle_plate,
    da.vehicle_color,
    TRUE,
    NOW()
FROM (
    SELECT
        user_id,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        vehicle_plate,
        vehicle_color,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY submitted_at DESC) AS rn
    FROM driver_applications
    WHERE status = 'approved'
      AND is_renewal = FALSE
) da
JOIN users u ON u.user_id = da.user_id
WHERE da.rn = 1
  AND u.role = 'driver'
  AND NOT EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.user_id = da.user_id
        AND v.active = TRUE
  );

-- Verifica el resultado
SELECT
    u.username,
    u.role,
    COUNT(v.vehicle_id) AS vehiculos_activos
FROM users u
LEFT JOIN vehicles v ON v.user_id = u.user_id AND v.active = TRUE
WHERE u.role = 'driver'
GROUP BY u.username, u.role
ORDER BY u.username;
