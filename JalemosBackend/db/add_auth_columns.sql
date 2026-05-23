-- ============================================================
--  JALEMOS — Migración: soporte de autenticación
-- ============================================================
--  Ejecutá este script en pgAdmin si ya tenés la base de datos
--  jalemos creada con el schema original.
--  Si estás creando la base desde cero, usá jalemos_schema.sql
--  directamente (ya incluye estos cambios).
-- ============================================================

-- 1. Agregar columnas nuevas (nullable temporalmente para migrar datos)
ALTER TABLE users
    ADD COLUMN username    VARCHAR(50),
    ADD COLUMN first_name  VARCHAR(100),
    ADD COLUMN last_name   VARCHAR(100),
    ADD COLUMN role        VARCHAR(20) NOT NULL DEFAULT 'passenger'
                           CHECK (role IN ('admin', 'passenger', 'driver'));

-- 3. Migrar datos existentes: separar name en first_name + last_name
--    y derivar username del prefijo del email
UPDATE users
SET
    first_name = SPLIT_PART(name, ' ', 1),
    last_name  = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1)),
    username   = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- 4. Hacer columnas NOT NULL ahora que tienen datos
ALTER TABLE users
    ALTER COLUMN username   SET NOT NULL,
    ALTER COLUMN first_name SET NOT NULL,
    ALTER COLUMN last_name  SET NOT NULL;

-- 5. Unique constraint en username
ALTER TABLE users
    ADD CONSTRAINT uq_users_username UNIQUE (username);

-- 6. Renombrar password → password_hash
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- 7. Eliminar columna name (reemplazada por first_name + last_name)
ALTER TABLE users DROP COLUMN name;

-- ============================================================
--  Reemplazar datos de prueba con usuarios reales del mock
--  (las contraseñas anteriores eran hashes falsos)
--  Se borran en orden para respetar las foreign keys.
-- ============================================================
DELETE FROM notifications;
DELETE FROM ratings;
DELETE FROM bookings;
DELETE FROM trips;
DELETE FROM vehicles;
DELETE FROM payment_methods;
DELETE FROM favorite_places;
DELETE FROM users;

INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips) VALUES
    ('admin',    'admin@jalemos.cr',    crypt('admin123',  gen_salt('bf', 10)), 'Admin',  'Jalemos',    'admin',     5.00, 120),
    ('pasajero', 'pasajero@jalemos.cr', crypt('pass123',   gen_salt('bf', 10)), 'Álvaro', 'Moya',       'passenger', 4.80,  38),
    ('carlos.m', 'carlos@jalemos.cr',   crypt('carlos123', gen_salt('bf', 10)), 'Carlos', 'Monestel',   'driver',    4.80,  52),
    ('maria.r',  'maria@jalemos.cr',    crypt('maria123',  gen_salt('bf', 10)), 'María',  'Rodríguez',  'driver',    4.90,  91),
    ('jose.l',   'jose@jalemos.cr',     crypt('jose123',   gen_salt('bf', 10)), 'José',   'Ledezma',    'driver',    4.70,  38),
    ('ana.p',    'ana@jalemos.cr',      crypt('ana123',    gen_salt('bf', 10)), 'Ana',    'Picado',     'driver',    5.00,  30);

-- Verificación
SELECT username, email, role FROM users;
