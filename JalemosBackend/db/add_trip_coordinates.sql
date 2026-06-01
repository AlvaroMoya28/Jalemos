-- ============================================================
--  JALEMOS — Migración: coordenadas para trips
-- ============================================================
--  Ejecutá este script sobre una base ya creada con jalemos_schema.sql
--  para agregar coordenadas geográficas de origen y destino a trips.
-- ============================================================

ALTER TABLE trips
    ADD COLUMN from_latitude   NUMERIC(18,15),
    ADD COLUMN from_longitude  NUMERIC(18,15),
    ADD COLUMN to_latitude     NUMERIC(18,15),
    ADD COLUMN to_longitude    NUMERIC(18,15);

ALTER TABLE trips
    ADD CONSTRAINT chk_trips_from_latitude
        CHECK (from_latitude IS NULL OR from_latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_trips_from_longitude
        CHECK (from_longitude IS NULL OR from_longitude BETWEEN -180 AND 180),
    ADD CONSTRAINT chk_trips_to_latitude
        CHECK (to_latitude IS NULL OR to_latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_trips_to_longitude
        CHECK (to_longitude IS NULL OR to_longitude BETWEEN -180 AND 180);

COMMENT ON COLUMN trips.from_latitude IS 'Latitud del punto de origen del viaje';
COMMENT ON COLUMN trips.from_longitude IS 'Longitud del punto de origen del viaje';
COMMENT ON COLUMN trips.to_latitude IS 'Latitud del punto de destino del viaje';
COMMENT ON COLUMN trips.to_longitude IS 'Longitud del punto de destino del viaje';

UPDATE trips
SET
    from_latitude = 9.865144024470927,
    from_longitude = -83.9218055651587,
    to_latitude = 9.936205625325853,
    to_longitude = -84.04873580895885
WHERE trip_id = '0bcee23d-d11d-44bf-81a3-352114210d7c';

-- Opcional: una vez que todos los registros históricos tengan coordenadas,
-- podés convertir estas columnas a NOT NULL con un segundo script de limpieza.
