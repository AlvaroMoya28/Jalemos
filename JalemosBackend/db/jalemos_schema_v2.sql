-- ============================================================
--  JALEMOS — Full schema v2
--  Run this file to create the database from scratch.
--  Includes all tables, enums, indexes, triggers, and seed data.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. TABLE: users
-- ============================================================
CREATE TABLE users (
    user_id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username         VARCHAR(50)     NOT NULL UNIQUE,
    email            VARCHAR(150)    NOT NULL UNIQUE,
    password_hash    VARCHAR(255)    NOT NULL,
    first_name       VARCHAR(100)    NOT NULL,
    last_name        VARCHAR(100)    NOT NULL,
    role             VARCHAR(20)     NOT NULL DEFAULT 'passenger'
                                     CHECK (role IN ('admin', 'passenger', 'driver')),
    mean_rating      NUMERIC(3, 2)   NOT NULL DEFAULT 5.00
                                     CHECK (mean_rating >= 0 AND mean_rating <= 5),
    total_trips      INTEGER         NOT NULL DEFAULT 0  CHECK (total_trips >= 0),
    driver_trips     INTEGER         NOT NULL DEFAULT 0  CHECK (driver_trips >= 0),
    kms              NUMERIC(10, 2)  NOT NULL DEFAULT 0  CHECK (kms >= 0),
    -- Moderación
    suspended_until      TIMESTAMPTZ,
    is_active            BOOLEAN   NOT NULL DEFAULT TRUE,
    -- Foto de perfil (bloqueada después de que el admin aprueba la solicitud de conductor)
    profile_photo_url    TEXT,
    profile_photo_locked BOOLEAN   NOT NULL DEFAULT FALSE,
    -- Vencimientos de documentos (copiados al aprobar solicitud de conductor)
    license_expiry_month SMALLINT  CHECK (license_expiry_month BETWEEN 1 AND 12),
    license_expiry_year  SMALLINT  CHECK (license_expiry_year >= 2020),
    dekra_expiry_month   SMALLINT  CHECK (dekra_expiry_month BETWEEN 1 AND 12),
    dekra_expiry_year    SMALLINT  CHECK (dekra_expiry_year >= 2020),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.suspended_until IS 'Date until which the user is suspended; NULL means active';
COMMENT ON COLUMN users.is_active        IS 'FALSE if the account was deactivated by an admin';


-- ============================================================
-- 2. TABLE: vehicles
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


-- ============================================================
-- 3. TABLE: trips
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


-- ============================================================
-- 4. TABLE: bookings
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


-- ============================================================
-- 5. TABLE: ratings
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


-- ============================================================
-- 6. TABLE: favorite_places
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


-- ============================================================
-- 7. TABLE: payment_methods
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


-- ============================================================
-- 8. TABLE: notifications
-- ============================================================
CREATE TYPE notification_type AS ENUM (
    'booking_received', 'booking_confirmed', 'booking_cancelled',
    'trip_starting', 'trip_completed', 'rating_received', 'general'
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


-- ============================================================
-- 9. TABLE: driver_applications
-- ============================================================
CREATE TYPE application_status AS ENUM (
    'pending', 'under_review', 'needs_correction', 'approved', 'rejected'
);

CREATE TABLE driver_applications (
    application_id       UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID               NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status               application_status NOT NULL DEFAULT 'pending',
    attempts             SMALLINT           NOT NULL DEFAULT 1 CHECK (attempts > 0),

    vehicle_brand        VARCHAR(100)       NOT NULL,
    vehicle_model        VARCHAR(100)       NOT NULL,
    vehicle_year         SMALLINT           NOT NULL CHECK (vehicle_year >= 1900),
    vehicle_plate        VARCHAR(20)        NOT NULL,
    vehicle_color        VARCHAR(50)        NOT NULL,

    cedula               VARCHAR(20)        NOT NULL,
    address              TEXT               NOT NULL,
    face_photo           TEXT,

    license_photo_front  TEXT,
    license_photo_back   TEXT,
    dekra_photo          TEXT,

    -- Fechas de vencimiento (mes y año) — verificadas por el admin en la revisión
    license_expiry_month SMALLINT           CHECK (license_expiry_month BETWEEN 1 AND 12),
    license_expiry_year  SMALLINT           CHECK (license_expiry_year >= 2020),
    dekra_expiry_month   SMALLINT           CHECK (dekra_expiry_month BETWEEN 1 AND 12),
    dekra_expiry_year    SMALLINT           CHECK (dekra_expiry_year >= 2020),

    -- TRUE cuando esta fila es una renovación de documentos (no una solicitud inicial)
    is_renewal           BOOLEAN            NOT NULL DEFAULT FALSE,

    admin_issue_ids      TEXT[],
    admin_notes          TEXT,
    reviewed_at          TIMESTAMPTZ,

    submitted_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  driver_applications                IS 'Driver registration requests submitted by passengers';
COMMENT ON COLUMN driver_applications.cedula          IS 'National ID number of the applicant, cross-checked against their license';
COMMENT ON COLUMN driver_applications.address         IS 'Home address of the applicant';
COMMENT ON COLUMN driver_applications.admin_issue_ids IS 'Array of predefined issue IDs flagged by the admin during review';


-- ============================================================
-- 10. TABLE: user_reports
-- ============================================================
CREATE TYPE report_reason AS ENUM (
    'bad_behavior', 'dangerous_driving', 'no_show',
    'late_cancellation', 'harassment', 'vehicle_condition', 'other'
);

CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TYPE admin_action_type AS ENUM ('suspended', 'deactivated', 'dismissed');

CREATE TABLE user_reports (
    report_id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_user_id    UUID              NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_by_id      UUID              NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason              report_reason     NOT NULL,
    details             TEXT,
    status              report_status     NOT NULL DEFAULT 'pending',

    admin_action        admin_action_type,
    suspension_days     SMALLINT          CHECK (suspension_days > 0),
    resolved_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_no_self_report CHECK (reported_user_id <> reported_by_id)
);

COMMENT ON TABLE user_reports IS 'User behavior reports managed by admins';


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_trips_driver          ON trips(driver_user_id);
CREATE INDEX idx_trips_state           ON trips(state);
CREATE INDEX idx_trips_start_dt        ON trips(start_date_time);
CREATE INDEX idx_bookings_trip         ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger    ON bookings(passenger_id);
CREATE INDEX idx_ratings_rated         ON ratings(rated_id);
CREATE INDEX idx_vehicles_user         ON vehicles(user_id);
CREATE INDEX idx_notif_user_unread     ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_favplaces_user        ON favorite_places(user_id);
CREATE INDEX idx_payment_user          ON payment_methods(user_id) WHERE active = TRUE;
CREATE INDEX idx_driver_app_user       ON driver_applications(user_id);
CREATE INDEX idx_driver_app_status     ON driver_applications(status);
CREATE INDEX idx_reports_reported      ON user_reports(reported_user_id);
CREATE INDEX idx_reports_status        ON user_reports(status) WHERE status = 'pending';


-- ============================================================
-- FUNCTION AND TRIGGER: auto-update updated_at
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

CREATE TRIGGER trg_driver_app_updated_at
    BEFORE UPDATE ON driver_applications
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- FUNCTION AND TRIGGER: auto-update available_seats on booking changes
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
-- FUNCTION AND TRIGGER: auto-recalculate mean_rating after each new rating
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_mean_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET mean_rating = COALESCE(
        (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM ratings WHERE rated_id = NEW.rated_id),
        5.00
    )
    WHERE user_id = NEW.rated_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ratings_mean
    AFTER INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION fn_update_mean_rating();


-- ============================================================
-- SEED DATA
-- ============================================================
DO $$
DECLARE
    v_pasajero_id  UUID;
    v_carlos_id    UUID;
    v_vehicle_id   UUID;
BEGIN
    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('admin', 'admin@jalemos.cr', crypt('admin123', gen_salt('bf', 10)), 'Admin', 'Jalemos', 'admin', 5.00, 120, 0);

    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('pasajero', 'pasajero@jalemos.cr', crypt('pass123', gen_salt('bf', 10)), 'Álvaro', 'Moya', 'passenger', 4.80, 38, 0)
    RETURNING user_id INTO v_pasajero_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('carlos.m', 'carlos@jalemos.cr', crypt('carlos123', gen_salt('bf', 10)), 'Carlos', 'Monestel', 'driver', 4.80, 15, 52)
    RETURNING user_id INTO v_carlos_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('maria.r', 'maria@jalemos.cr', crypt('maria123', gen_salt('bf', 10)), 'María', 'Rodríguez', 'driver', 4.90, 22, 91);

    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('jose.l', 'jose@jalemos.cr', crypt('jose123', gen_salt('bf', 10)), 'José', 'Ledezma', 'driver', 4.70, 10, 38);

    INSERT INTO users (username, email, password_hash, first_name, last_name, role, mean_rating, total_trips, driver_trips)
    VALUES ('ana.p', 'ana@jalemos.cr', crypt('ana123', gen_salt('bf', 10)), 'Ana', 'Picado', 'driver', 5.00, 8, 30);

    INSERT INTO vehicles (user_id, model, year, num_plate, color)
    VALUES (v_carlos_id, 'Toyota Corolla', 2020, 'ABC-123', 'Blanco')
    RETURNING vehicle_id INTO v_vehicle_id;

    INSERT INTO favorite_places (user_id, type, name, address) VALUES
        (v_pasajero_id, 'home', 'Mi casa',     'Barrio Los Yoses, San José'),
        (v_pasajero_id, 'work', 'Universidad', 'UCR, San Pedro, San José');

    INSERT INTO payment_methods (user_id, type, alias) VALUES
        (v_pasajero_id, 'sinpe', 'Mi SINPE personal'),
        (v_carlos_id,   'cash',  'Efectivo');

    
END;
$$;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT username, email, role FROM users;
