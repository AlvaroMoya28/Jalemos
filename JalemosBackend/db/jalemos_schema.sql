-- ============================================================
--  JALEMOS - Base de Datos PostgreSQL
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Provee gen_random_uuid() para los UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Alternativa: uuid_generate_v4()

-- ============================================================
-- 1. TABLA: users
-- ============================================================
CREATE TABLE users (
    user_id       UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL UNIQUE,
    password      VARCHAR(255)    NOT NULL,
    mean_rating   NUMERIC(3, 2)   NOT NULL DEFAULT 0.00
                                  CHECK (mean_rating >= 0 AND mean_rating <= 5),
    total_trips   INTEGER         NOT NULL DEFAULT 0  CHECK (total_trips >= 0),
    kms           NUMERIC(10, 2)  NOT NULL DEFAULT 0  CHECK (kms >= 0),
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users             IS 'Usuarios registrados en la plataforma Jalemos';
COMMENT ON COLUMN users.user_id     IS 'UUID generado automáticamente por gen_random_uuid()';
COMMENT ON COLUMN users.password    IS 'Hash bcrypt de la contraseña. NUNCA almacenar texto plano.';
COMMENT ON COLUMN users.mean_rating IS 'Promedio de calificaciones recibidas (0.00 - 5.00)';
COMMENT ON COLUMN users.kms         IS 'Kilómetros totales recorridos como conductor';


-- ============================================================
-- 2. TABLA: vehicles
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    model       VARCHAR(100)  NOT NULL,
    year        SMALLINT      NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
    num_plate   VARCHAR(20)   NOT NULL UNIQUE,
    color       VARCHAR(50)   NOT NULL,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  vehicles           IS 'Vehículos registrados por los conductores';
COMMENT ON COLUMN vehicles.active    IS 'FALSE si el vehículo fue dado de baja por el usuario';
COMMENT ON COLUMN vehicles.num_plate IS 'Placa del vehículo, debe ser única en el sistema';


-- ============================================================
-- 3. TABLA: trips
-- ============================================================
CREATE TYPE trip_state AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE trips (
    trip_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id   UUID          NOT NULL REFERENCES users(user_id)       ON DELETE RESTRICT,
    vehicle_id       UUID          NOT NULL REFERENCES vehicles(vehicle_id)  ON DELETE RESTRICT,
    rate             NUMERIC(8, 2) NOT NULL CHECK (rate >= 0),
    from_location    VARCHAR(255)  NOT NULL,
    to_location      VARCHAR(255)  NOT NULL,
    start_date_time  TIMESTAMPTZ   NOT NULL,
    total_seats      SMALLINT      NOT NULL CHECK (total_seats > 0),
    available_seats  SMALLINT      NOT NULL CHECK (available_seats >= 0),
    notes            TEXT,
    state            trip_state    NOT NULL DEFAULT 'scheduled',
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_seats CHECK (available_seats <= total_seats)
);

COMMENT ON TABLE  trips               IS 'Viajes publicados por conductores';
COMMENT ON COLUMN trips.rate          IS 'Costo por asiento en la moneda local';
COMMENT ON COLUMN trips.from_location IS 'Lugar de origen del viaje';
COMMENT ON COLUMN trips.to_location   IS 'Lugar de destino del viaje';
COMMENT ON COLUMN trips.state         IS 'Estado del viaje: scheduled, in_progress, completed, cancelled';


-- ============================================================
-- 4. TABLA: bookings
-- ============================================================
CREATE TYPE booking_state AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE bookings (
    booking_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id           UUID            NOT NULL REFERENCES trips(trip_id)  ON DELETE RESTRICT,
    passenger_id      UUID            NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    seats_reserved    SMALLINT        NOT NULL CHECK (seats_reserved > 0),
    estimated_amount  NUMERIC(10, 2)  NOT NULL CHECK (estimated_amount >= 0),
    state             booking_state   NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_booking_passenger_trip UNIQUE (trip_id, passenger_id)
);

COMMENT ON TABLE  bookings                  IS 'Reservas de pasajeros en viajes publicados';
COMMENT ON COLUMN bookings.estimated_amount IS 'Monto calculado al momento de la reserva (seats_reserved * rate)';


-- ============================================================
-- 5. TABLA: ratings
-- ============================================================
CREATE TABLE ratings (
    rating_id   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID          NOT NULL REFERENCES trips(trip_id)  ON DELETE CASCADE,
    rater_id    UUID          NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    rated_id    UUID          NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    rating      SMALLINT      NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_rating_per_trip  UNIQUE (trip_id, rater_id, rated_id),
    CONSTRAINT chk_no_self_rating  CHECK  (rater_id <> rated_id)
);

COMMENT ON TABLE  ratings        IS 'Calificaciones entre usuarios después de completar un viaje';
COMMENT ON COLUMN ratings.rating IS 'Puntuación de 1 a 5 estrellas';


-- ============================================================
-- 6. TABLA: favorite_places
-- ============================================================
CREATE TYPE place_type AS ENUM ('home', 'work', 'other');

CREATE TABLE favorite_places (
    favorite_place_id  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type               place_type    NOT NULL DEFAULT 'other',
    name               VARCHAR(100)  NOT NULL,
    address            VARCHAR(255)  NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  favorite_places      IS 'Lugares frecuentes guardados por el usuario';
COMMENT ON COLUMN favorite_places.type IS 'Categoría: home (casa), work (trabajo), other (otro)';


-- ============================================================
-- 7. TABLA: payment_methods
-- ============================================================
CREATE TYPE payment_type AS ENUM ('cash', 'card', 'sinpe', 'other');

CREATE TABLE payment_methods (
    payment_id  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type        payment_type  NOT NULL,
    alias       VARCHAR(100)  NOT NULL,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  payment_methods       IS 'Métodos de pago registrados por el usuario';
COMMENT ON COLUMN payment_methods.alias IS 'Nombre amigable para identificar el método de pago';


-- ============================================================
-- 8. TABLA: notifications
-- ============================================================
CREATE TYPE notification_type AS ENUM (
    'booking_received',
    'booking_confirmed',
    'booking_cancelled',
    'trip_starting',
    'trip_completed',
    'rating_received',
    'general'
);

CREATE TABLE notifications (
    notification_id  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID               NOT NULL REFERENCES users(user_id)    ON DELETE CASCADE,
    trip_id          UUID               REFERENCES trips(trip_id)             ON DELETE SET NULL,
    booking_id       UUID               REFERENCES bookings(booking_id)       ON DELETE SET NULL,
    type             notification_type  NOT NULL DEFAULT 'general',
    title            VARCHAR(200)       NOT NULL,
    read             BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notifications      IS 'Notificaciones del sistema enviadas a los usuarios';
COMMENT ON COLUMN notifications.read IS 'TRUE si el usuario ya leyó la notificación';


-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_trips_driver       ON trips(driver_user_id);
CREATE INDEX idx_trips_state        ON trips(state);
CREATE INDEX idx_trips_start_dt     ON trips(start_date_time);

CREATE INDEX idx_bookings_trip      ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);

CREATE INDEX idx_ratings_rated      ON ratings(rated_id);

CREATE INDEX idx_vehicles_user      ON vehicles(user_id);

CREATE INDEX idx_notif_user_unread  ON notifications(user_id) WHERE read = FALSE;

CREATE INDEX idx_favplaces_user     ON favorite_places(user_id);

CREATE INDEX idx_payment_user       ON payment_methods(user_id) WHERE active = TRUE;


-- ============================================================
-- FUNCIÓN Y TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- FUNCIÓN Y TRIGGER: available_seats automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_available_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.state IN ('pending', 'confirmed') THEN
        UPDATE trips
        SET available_seats = available_seats - NEW.seats_reserved
        WHERE trip_id = NEW.trip_id;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.state IN ('pending', 'confirmed') AND NEW.state = 'cancelled' THEN
            UPDATE trips
            SET available_seats = available_seats + OLD.seats_reserved
            WHERE trip_id = NEW.trip_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_seats
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_update_available_seats();


-- ============================================================
-- FUNCIÓN Y TRIGGER: mean_rating automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_mean_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET mean_rating = (
        SELECT ROUND(AVG(rating)::NUMERIC, 2)
        FROM ratings
        WHERE rated_id = NEW.rated_id
    )
    WHERE user_id = NEW.rated_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ratings_mean
    AFTER INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION fn_update_mean_rating();


-- ============================================================
-- DATOS DE PRUEBA
-- Los UUIDs se generan automáticamente con gen_random_uuid()
-- No se pasan IDs manuales en los INSERT
-- ============================================================

-- Insertar usuarios y capturar sus UUIDs en variables para usarlos luego
DO $$
DECLARE
    v_alvaro_id     UUID;
    v_sebastian_id  UUID;
	v_vehicle_id 	UUID;
BEGIN
    INSERT INTO users (name, email, password)
    VALUES ('Álvaro Moya', 'alvaro@jalemos.com', '$2b$10$exemplo_hash_alvaro')
    RETURNING user_id INTO v_alvaro_id;

    INSERT INTO users (name, email, password)
    VALUES ('Sebastián Blanco', 'sebastian@jalemos.com', '$2b$10$exemplo_hash_sebastian')
    RETURNING user_id INTO v_sebastian_id;

    INSERT INTO users (name, email, password)
    VALUES ('Emanuel García', 'emanuel@jalemos.com', '$2b$10$exemplo_hash_emanuel');

    INSERT INTO vehicles (user_id, model, year, num_plate, color)
    VALUES (v_sebastian_id, 'Toyota Corolla', 2020, 'ABC-123', 'Blanco')
    RETURNING vehicle_id INTO v_vehicle_id;

    INSERT INTO favorite_places (user_id, type, name, address) VALUES
        (v_alvaro_id, 'home', 'Mi casa',     'Barrio Los Yoses, San José'),
        (v_alvaro_id, 'work', 'Universidad', 'UCR, San Pedro, San José');

    INSERT INTO payment_methods (user_id, type, alias) VALUES
        (v_alvaro_id,    'sinpe', 'Mi SINPE personal'),
        (v_sebastian_id, 'cash',  'Efectivo');

    INSERT INTO trips (driver_user_id, vehicle_id, rate, from_location, to_location,
                       start_date_time, total_seats, available_seats, notes)
    VALUES (v_sebastian_id, v_vehicle_id, 1500.00, 'Cartago Centro', 'UCR San Pedro',
            NOW() + INTERVAL '1 day', 3, 3, 'Salgo puntual. No fumar.');
END;
$$;

-- ============================================================
-- VERIFICACIÓN DE DATOS
-- Se hace una consulta sencilla para revisar los nombres y 
-- correos de los usuarios ingresados
-- ============================================================
SELECT name, email FROM users;

