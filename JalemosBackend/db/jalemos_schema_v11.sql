-- ============================================================
--  JALEMOS — Full schema v11 (create from scratch)
--
--  Use this file to spin up a clean database with all tables,
--  enums, triggers, and seed data up to and including E3.
--
--  Changes accumulated from v5 → v11:
--    v6  · notification_type 'admin_broadcast'
--        · users: expo_push_token, notification_prefs
--        · notifications: audience
--    v7  · payment_status enum
--        · payment_methods: card metadata + stripe_payment_method_id
--        · users: stripe_customer_id, last_used_payment_method_id
--        · payments table
--    v8  · users: email_verification_code/expires_at, is_email_verified,
--                 qr_email_last_sent_at
--    v9  · bookings: drop uq_booking_passenger_trip, add partial index
--    v10 · bookings: is_late_cancel
--        · notification_type 'passenger_cancelled_late'
--        · notifications: passenger_id
--    v11 · trip_report_type enum  (emergency | driver_report)
--        · trip_report_status enum (open | verified | dismissed | action_taken)
--        · notification_type 'emergency_report'
--        · trip_reports table
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE trip_state AS ENUM (
    'scheduled', 'boarding', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE booking_state AS ENUM (
    'pending', 'confirmed', 'boarded', 'no_show', 'cancelled', 'completed'
);

CREATE TYPE payment_type AS ENUM ('cash', 'card', 'sinpe', 'other');

CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');

CREATE TYPE place_type AS ENUM ('home', 'work', 'other');

CREATE TYPE application_status AS ENUM (
    'pending', 'under_review', 'needs_correction', 'approved', 'rejected'
);

CREATE TYPE report_reason AS ENUM (
    'bad_behavior', 'dangerous_driving', 'no_show',
    'late_cancellation', 'harassment', 'vehicle_condition', 'other'
);

CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TYPE admin_action_type AS ENUM ('suspended', 'deactivated', 'dismissed');

CREATE TYPE notification_type AS ENUM (
    'booking_received', 'booking_confirmed', 'booking_cancelled',
    'trip_starting', 'trip_completed', 'rating_received', 'general',
    'trip_boarding', 'qr_scanned', 'trip_started',
    'driver_cancelled', 'passenger_cancelled',
    'no_show_marked', 'payment_reminder', 'rating_reminder',
    'admin_broadcast',
    'passenger_cancelled_late',
    'emergency_report'
);

-- v11 trip reports
CREATE TYPE trip_report_type   AS ENUM ('emergency', 'driver_report');
CREATE TYPE trip_report_status AS ENUM ('open', 'verified', 'dismissed', 'action_taken');


-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    user_id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username                     VARCHAR(50)     NOT NULL UNIQUE,
    email                        VARCHAR(150)    NOT NULL UNIQUE,
    password_hash                VARCHAR(255)    NOT NULL,
    first_name                   VARCHAR(100)    NOT NULL,
    last_name                    VARCHAR(100)    NOT NULL,
    role                         VARCHAR(20)     NOT NULL DEFAULT 'passenger'
                                                  CHECK (role IN ('admin', 'passenger', 'driver')),
    mean_rating                  NUMERIC(3, 2)   NOT NULL DEFAULT 5.00
                                                  CHECK (mean_rating >= 0 AND mean_rating <= 5),
    total_trips                  INTEGER         NOT NULL DEFAULT 0 CHECK (total_trips >= 0),
    driver_trips                 INTEGER         NOT NULL DEFAULT 0 CHECK (driver_trips >= 0),
    kms                          NUMERIC(10, 2)  NOT NULL DEFAULT 0 CHECK (kms >= 0),
    suspended_until              TIMESTAMPTZ,
    is_active                    BOOLEAN         NOT NULL DEFAULT TRUE,
    profile_photo_url            TEXT,
    profile_photo_locked         BOOLEAN         NOT NULL DEFAULT FALSE,
    license_expiry_month         SMALLINT        CHECK (license_expiry_month BETWEEN 1 AND 12),
    license_expiry_year          SMALLINT        CHECK (license_expiry_year >= 2020),
    dekra_expiry_month           SMALLINT        CHECK (dekra_expiry_month BETWEEN 1 AND 12),
    dekra_expiry_year            SMALLINT        CHECK (dekra_expiry_year >= 2020),
    qr_token                     UUID            NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    expo_push_token              TEXT,
    notification_prefs           JSONB           NOT NULL DEFAULT '{}'::jsonb,
    stripe_customer_id           TEXT,
    last_used_payment_method_id  UUID,
    email_verification_code      TEXT,
    email_verification_expires_at TIMESTAMPTZ,
    is_email_verified            BOOLEAN         NOT NULL DEFAULT FALSE,
    qr_email_last_sent_at        TIMESTAMPTZ,
    created_at                   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.qr_token IS 'Stable UUID used as QR code payload for trip boarding identification';


-- ============================================================
-- 2. vehicles
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    brand       VARCHAR(60)  NOT NULL,
    model       VARCHAR(100) NOT NULL,
    year        SMALLINT     NOT NULL CHECK (year >= 1900),
    num_plate   VARCHAR(20)  NOT NULL UNIQUE,
    color       VARCHAR(50)  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. trips
-- ============================================================
CREATE TABLE trips (
    trip_id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id       UUID            NOT NULL REFERENCES users(user_id)       ON DELETE RESTRICT,
    vehicle_id           UUID            NOT NULL REFERENCES vehicles(vehicle_id)  ON DELETE RESTRICT,
    rate                 NUMERIC(8, 2)   NOT NULL CHECK (rate >= 0),
    from_location        VARCHAR(255)    NOT NULL,
    to_location          VARCHAR(255)    NOT NULL,
    from_latitude        NUMERIC(18, 15) NOT NULL DEFAULT 0,
    from_longitude       NUMERIC(18, 15) NOT NULL DEFAULT 0,
    to_latitude          NUMERIC(18, 15) NOT NULL DEFAULT 0,
    to_longitude         NUMERIC(18, 15) NOT NULL DEFAULT 0,
    start_date_time      TIMESTAMPTZ     NOT NULL,
    total_seats          SMALLINT        NOT NULL CHECK (total_seats > 0),
    available_seats      SMALLINT        NOT NULL CHECK (available_seats >= 0),
    notes                TEXT,
    state                trip_state      NOT NULL DEFAULT 'scheduled',
    boarding_started_at  TIMESTAMPTZ,
    journey_started_at   TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    cancel_reason        VARCHAR(60),
    cancel_details       TEXT,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_seats CHECK (available_seats <= total_seats)
);


-- ============================================================
-- 4. bookings
-- ============================================================
CREATE TABLE bookings (
    booking_id        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id           UUID            NOT NULL REFERENCES trips(trip_id)  ON DELETE RESTRICT,
    passenger_id      UUID            NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    seats_reserved    SMALLINT        NOT NULL CHECK (seats_reserved > 0),
    estimated_amount  NUMERIC(10, 2)  NOT NULL CHECK (estimated_amount >= 0),
    state             booking_state   NOT NULL DEFAULT 'pending',
    boarded_at        TIMESTAMPTZ,
    cancel_reason     VARCHAR(60),
    cancel_details    TEXT,
    is_late_cancel    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Partial unique: a passenger can re-book after cancelling.
CREATE UNIQUE INDEX uq_booking_passenger_trip_active
    ON bookings (trip_id, passenger_id)
    WHERE state != 'cancelled';


-- ============================================================
-- 5. ratings
-- ============================================================
CREATE TABLE ratings (
    rating_id   UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID      NOT NULL REFERENCES trips(trip_id)  ON DELETE CASCADE,
    rater_id    UUID      NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    rated_id    UUID      NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    rating      SMALLINT  NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_rating_per_trip UNIQUE (trip_id, rater_id, rated_id),
    CONSTRAINT chk_no_self_rating CHECK (rater_id <> rated_id)
);


-- ============================================================
-- 6. favorite_places
-- ============================================================
CREATE TABLE favorite_places (
    favorite_place_id  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type               place_type    NOT NULL DEFAULT 'other',
    name               VARCHAR(100)  NOT NULL,
    address            VARCHAR(255)  NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. payment_methods
-- ============================================================
CREATE TABLE payment_methods (
    payment_id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type                      payment_type  NOT NULL,
    alias                     VARCHAR(100)  NOT NULL,
    active                    BOOLEAN       NOT NULL DEFAULT TRUE,
    last_four_digits          CHAR(4),
    brand                     VARCHAR(20),
    expiry_month              SMALLINT,
    expiry_year               SMALLINT,
    is_favorite               BOOLEAN       NOT NULL DEFAULT FALSE,
    stripe_payment_method_id  TEXT,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Forward-reference FK deferred until payment_methods exists
ALTER TABLE users
    ADD CONSTRAINT fk_users_last_pm
    FOREIGN KEY (last_used_payment_method_id)
    REFERENCES payment_methods(payment_id) ON DELETE SET NULL;


-- ============================================================
-- 8. payments
-- ============================================================
CREATE TABLE payments (
    payment_id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id                UUID            NOT NULL REFERENCES bookings(booking_id)       ON DELETE RESTRICT,
    payer_id                  UUID            NOT NULL REFERENCES users(user_id)             ON DELETE RESTRICT,
    amount                    NUMERIC(10,2)   NOT NULL,
    method                    payment_type    NOT NULL,
    status                    payment_status  NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id  TEXT,
    payment_method_id         UUID            REFERENCES payment_methods(payment_id)         ON DELETE SET NULL,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. notifications
-- ============================================================
CREATE TABLE notifications (
    notification_id  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID               NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    trip_id          UUID               REFERENCES trips(trip_id)            ON DELETE SET NULL,
    booking_id       UUID               REFERENCES bookings(booking_id)      ON DELETE SET NULL,
    passenger_id     UUID               REFERENCES users(user_id)            ON DELETE SET NULL,
    type             notification_type  NOT NULL DEFAULT 'general',
    title            VARCHAR(200)       NOT NULL,
    body             TEXT,
    audience         TEXT               NOT NULL DEFAULT 'all',
    read             BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. driver_applications
-- ============================================================
CREATE TABLE driver_applications (
    application_id       UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID               NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status               application_status NOT NULL DEFAULT 'pending',
    attempts             SMALLINT           NOT NULL DEFAULT 1 CHECK (attempts > 0),
    application_type     VARCHAR(20)        NOT NULL DEFAULT 'driver'
                                            CHECK (application_type IN ('driver', 'vehicle')),

    vehicle_brand        VARCHAR(100)       NOT NULL,
    vehicle_model        VARCHAR(100)       NOT NULL,
    vehicle_year         SMALLINT           NOT NULL CHECK (vehicle_year >= 1900),
    vehicle_plate        VARCHAR(20)        NOT NULL,
    vehicle_color        VARCHAR(50)        NOT NULL,

    cedula               VARCHAR(20)        NOT NULL DEFAULT '',
    address              TEXT               NOT NULL DEFAULT '',
    face_photo           TEXT,
    license_photo_front  TEXT,
    license_photo_back   TEXT,
    dekra_photo          TEXT,

    license_expiry_month SMALLINT  CHECK (license_expiry_month BETWEEN 1 AND 12),
    license_expiry_year  SMALLINT  CHECK (license_expiry_year >= 2020),
    dekra_expiry_month   SMALLINT  CHECK (dekra_expiry_month BETWEEN 1 AND 12),
    dekra_expiry_year    SMALLINT  CHECK (dekra_expiry_year >= 2020),

    is_renewal    BOOLEAN     NOT NULL DEFAULT FALSE,
    admin_issue_ids TEXT[],
    admin_notes   TEXT,
    reviewed_at   TIMESTAMPTZ,

    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. user_reports  (mock-driven frontend tab, kept for history)
-- ============================================================
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


-- ============================================================
-- 12. trip_reports  (E3-1 / v11)
-- ============================================================
CREATE TABLE trip_reports (
    report_id    UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID               NOT NULL REFERENCES trips(trip_id)  ON DELETE RESTRICT,
    driver_id    UUID               NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    reporter_id  UUID               NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    type         trip_report_type   NOT NULL,
    status       trip_report_status NOT NULL DEFAULT 'open',
    description  TEXT               NOT NULL,
    admin_notes  TEXT,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_trips_driver          ON trips(driver_user_id);
CREATE INDEX idx_trips_state           ON trips(state);
CREATE INDEX idx_trips_start_dt        ON trips(start_date_time);
CREATE INDEX idx_bookings_trip         ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger    ON bookings(passenger_id);
CREATE INDEX idx_ratings_rated         ON ratings(rated_id);
CREATE INDEX idx_ratings_score         ON ratings(rating);        -- E3-5 low-rating queries
CREATE INDEX idx_vehicles_user         ON vehicles(user_id);
CREATE INDEX idx_notif_user_unread     ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_favplaces_user        ON favorite_places(user_id);
CREATE INDEX idx_payment_user          ON payment_methods(user_id) WHERE active = TRUE;
CREATE INDEX idx_driver_app_user       ON driver_applications(user_id);
CREATE INDEX idx_driver_app_status     ON driver_applications(status);
CREATE INDEX idx_driver_app_type       ON driver_applications(application_type);
CREATE INDEX idx_reports_reported      ON user_reports(reported_user_id);
CREATE INDEX idx_reports_pending       ON user_reports(status) WHERE status = 'pending';
CREATE UNIQUE INDEX idx_users_qr_token ON users(qr_token);
CREATE INDEX idx_payments_booking      ON payments(booking_id);
CREATE INDEX idx_payments_payer        ON payments(payer_id);
-- trip_reports
CREATE INDEX idx_trip_reports_trip     ON trip_reports(trip_id);
CREATE INDEX idx_trip_reports_driver   ON trip_reports(driver_id);
CREATE INDEX idx_trip_reports_reporter ON trip_reports(reporter_id);
CREATE INDEX idx_trip_reports_status   ON trip_reports(status);


-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_driver_app_updated_at
    BEFORE UPDATE ON driver_applications FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON user_reports FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_trip_reports_updated_at
    BEFORE UPDATE ON trip_reports FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- TRIGGER: recalcular available_seats en bookings
--   pending/confirmed → cancelled libera asientos.
--   boarded → cancelled NO libera (pasajero ya iba en el vehículo).
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
            SET available_seats = LEAST(total_seats, available_seats + OLD.seats_reserved)
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
-- TRIGGER: recalcular mean_rating después de cada calificación
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
    AFTER INSERT ON ratings FOR EACH ROW EXECUTE FUNCTION fn_update_mean_rating();


-- ============================================================
-- SEED DATA
-- ============================================================
DO $$
DECLARE
    -- usuarios
    v_admin_id   UUID;
    v_alvaro_id  UUID;
    v_laura_id   UUID;
    v_roberto_id UUID;
    v_carlos_id  UUID;
    v_maria_id   UUID;
    v_jose_id    UUID;
    v_ana_id     UUID;

    -- vehículos
    v_car_carlos UUID;
    v_car_maria  UUID;
    v_car_jose   UUID;
    v_car_ana    UUID;

    -- viajes
    v_trip_sched1   UUID;   -- programado futuro (Carlos → Cartago)
    v_trip_sched2   UUID;   -- programado futuro (María → Heredia)
    v_trip_active   UUID;   -- en curso ahora    (José  → Alajuela)
    v_trip_done1    UUID;   -- completado (Ana → San Pedro)
    v_trip_done2    UUID;   -- completado (Carlos → Escazú)
    v_trip_cancel   UUID;   -- cancelado  (María → Heredia)

    -- reservas
    v_bk_active  UUID;
    v_bk_done1   UUID;
    v_bk_done2   UUID;
    v_bk_done2b  UUID;

BEGIN

    -- ─────────────────────────────────────────────────────────
    -- USUARIOS
    -- ─────────────────────────────────────────────────────────

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, is_email_verified)
    VALUES ('admin', 'admin@jalemos.cr',
            crypt('admin123', gen_salt('bf', 10)),
            'Admin', 'Jalemos', 'admin', 5.00, 0, 0, TRUE)
    RETURNING user_id INTO v_admin_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, is_email_verified)
    VALUES ('pasajero', 'pasajero@jalemos.cr',
            crypt('pass123', gen_salt('bf', 10)),
            'Álvaro', 'Moya', 'passenger', 4.80, 38, 0, TRUE)
    RETURNING user_id INTO v_alvaro_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, is_email_verified)
    VALUES ('laura.s', 'laura@jalemos.cr',
            crypt('laura123', gen_salt('bf', 10)),
            'Laura', 'Solís', 'passenger', 4.60, 12, 0, TRUE)
    RETURNING user_id INTO v_laura_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, is_email_verified)
    VALUES ('roberto.g', 'roberto@jalemos.cr',
            crypt('roberto123', gen_salt('bf', 10)),
            'Roberto', 'García', 'passenger', 4.30, 7, 0, TRUE)
    RETURNING user_id INTO v_roberto_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year,
                       is_email_verified)
    VALUES ('carlos.m', 'carlos@jalemos.cr',
            crypt('carlos123', gen_salt('bf', 10)),
            'Carlos', 'Monestel', 'driver', 4.80, 15, 52, 1240.50,
            8, 2027, 11, 2026, TRUE)
    RETURNING user_id INTO v_carlos_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year,
                       is_email_verified)
    VALUES ('maria.r', 'maria@jalemos.cr',
            crypt('maria123', gen_salt('bf', 10)),
            'María', 'Rodríguez', 'driver', 4.90, 22, 91, 3105.75,
            3, 2028, 5, 2027, TRUE)
    RETURNING user_id INTO v_maria_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year,
                       is_email_verified)
    VALUES ('jose.l', 'jose@jalemos.cr',
            crypt('jose123', gen_salt('bf', 10)),
            'José', 'Ledezma', 'driver', 3.20, 10, 38, 890.00,
            6, 2026, 2, 2025, TRUE)
    RETURNING user_id INTO v_jose_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year,
                       is_email_verified)
    VALUES ('ana.p', 'ana@jalemos.cr',
            crypt('ana123', gen_salt('bf', 10)),
            'Ana', 'Picado', 'driver', 4.70, 8, 30, 620.25,
            12, 2027, 9, 2026, TRUE)
    RETURNING user_id INTO v_ana_id;


    -- ─────────────────────────────────────────────────────────
    -- VEHÍCULOS
    -- ─────────────────────────────────────────────────────────

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_carlos_id, 'Toyota', 'Corolla', 2020, 'ABC-123', 'Blanco')
    RETURNING vehicle_id INTO v_car_carlos;

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_carlos_id, 'Hyundai', 'Accent', 2022, 'JBN-882', 'Gris');

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_maria_id, 'Honda', 'Civic', 2019, 'PKL-445', 'Plata')
    RETURNING vehicle_id INTO v_car_maria;

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_jose_id, 'Hyundai', 'Tucson', 2021, 'TDR-773', 'Negro')
    RETURNING vehicle_id INTO v_car_jose;

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_ana_id, 'Kia', 'Sportage', 2022, 'SFM-118', 'Blanco')
    RETURNING vehicle_id INTO v_car_ana;


    -- ─────────────────────────────────────────────────────────
    -- SOLICITUDES DE CONDUCTOR (aprobadas)
    -- ─────────────────────────────────────────────────────────

    INSERT INTO driver_applications (
        user_id, status, attempts, application_type,
        vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
        cedula, address,
        license_expiry_month, license_expiry_year,
        dekra_expiry_month,   dekra_expiry_year,
        is_renewal, reviewed_at, submitted_at, updated_at
    ) VALUES
    (v_carlos_id, 'approved', 1, 'driver',
     'Toyota', 'Corolla', 2020, 'ABC-123', 'Blanco',
     '106340567', 'Barrio Escalante, San José',
     8, 2027, 11, 2026,
     FALSE, NOW()-'45 days'::interval, NOW()-'50 days'::interval, NOW()-'45 days'::interval),
    (v_maria_id,  'approved', 1, 'driver',
     'Honda', 'Civic', 2019, 'PKL-445', 'Plata',
     '207891234', 'Alajuela Centro, Alajuela',
     3, 2028, 5, 2027,
     FALSE, NOW()-'60 days'::interval, NOW()-'65 days'::interval, NOW()-'60 days'::interval),
    (v_jose_id,   'approved', 2, 'driver',
     'Hyundai', 'Tucson', 2021, 'TDR-773', 'Negro',
     '302346789', 'San Pedro, San José',
     6, 2026, 2, 2025,
     FALSE, NOW()-'90 days'::interval, NOW()-'95 days'::interval, NOW()-'90 days'::interval),
    (v_ana_id,    'approved', 1, 'driver',
     'Kia', 'Sportage', 2022, 'SFM-118', 'Blanco',
     '401237890', 'Heredia Centro, Heredia',
     12, 2027, 9, 2026,
     FALSE, NOW()-'20 days'::interval, NOW()-'25 days'::interval, NOW()-'20 days'::interval);

    -- Solicitud adicional de vehículo (pendiente de revisión)
    INSERT INTO driver_applications (
        user_id, status, attempts, application_type,
        vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
        cedula, address, is_renewal, submitted_at, updated_at
    ) VALUES (
        v_carlos_id, 'pending', 1, 'vehicle',
        'Suzuki', 'Swift', 2023, 'ZZZ-999', 'Rojo',
        '', '', FALSE, NOW()-'1 day'::interval, NOW()-'1 day'::interval
    );


    -- ─────────────────────────────────────────────────────────
    -- LUGARES FAVORITOS
    -- ─────────────────────────────────────────────────────────

    INSERT INTO favorite_places (user_id, type, name, address) VALUES
        (v_alvaro_id,  'home', 'Mi casa',     'Barrio Los Yoses, San José'),
        (v_alvaro_id,  'work', 'Universidad', 'UCR, San Pedro, San José'),
        (v_laura_id,   'home', 'Mi casa',     'Moravia, San José'),
        (v_laura_id,   'work', 'Trabajo',     'Escazú, San José'),
        (v_roberto_id, 'home', 'Casa',        'Tibás, San José'),
        (v_roberto_id, 'work', 'Oficina',     'La Sabana, San José');


    -- ─────────────────────────────────────────────────────────
    -- MÉTODOS DE PAGO
    -- ─────────────────────────────────────────────────────────

    INSERT INTO payment_methods (user_id, type, alias, is_favorite) VALUES
        (v_alvaro_id,  'sinpe', 'Mi SINPE',       TRUE),
        (v_alvaro_id,  'cash',  'Efectivo',        FALSE),
        (v_laura_id,   'sinpe', 'SINPE personal',  TRUE),
        (v_roberto_id, 'cash',  'Efectivo',        TRUE),
        (v_carlos_id,  'cash',  'Efectivo',        TRUE),
        (v_maria_id,   'cash',  'Efectivo',        TRUE),
        (v_jose_id,    'cash',  'Efectivo',        TRUE),
        (v_ana_id,     'sinpe', 'Mi SINPE',        TRUE);


    -- ─────────────────────────────────────────────────────────
    -- VIAJES
    -- ─────────────────────────────────────────────────────────

    -- Programado 1: Carlos UCR → Cartago (en 2 horas)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats, notes, state
    ) VALUES (
        v_carlos_id, v_car_carlos, 1500.00,
        'UCR, San Pedro', 'Cartago Centro',
        9.9351, -84.0511, 9.8631, -83.9196,
        NOW() + '2 hours'::interval,
        4, 3, 'Ruta directa por la autopista', 'scheduled'
    ) RETURNING trip_id INTO v_trip_sched1;

    -- Programado 2: María Alajuela → Heredia (en 4 horas)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats, notes, state
    ) VALUES (
        v_maria_id, v_car_maria, 1200.00,
        'Alajuela Centro', 'Heredia Centro',
        10.0162, -84.2144, 9.9980, -84.1170,
        NOW() + '4 hours'::interval,
        3, 3, NULL, 'scheduled'
    ) RETURNING trip_id INTO v_trip_sched2;

    -- En curso: José San José → Alajuela (journey_started_at = hace 30 min)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats,
        state, boarding_started_at, journey_started_at
    ) VALUES (
        v_jose_id, v_car_jose, 1000.00,
        'San José Centro', 'Alajuela Centro',
        9.9355, -84.0840, 10.0162, -84.2144,
        NOW() - '1 hour'::interval,
        3, 1,
        'in_progress',
        NOW() - '50 minutes'::interval,
        NOW() - '30 minutes'::interval
    ) RETURNING trip_id INTO v_trip_active;

    -- Completado 1: Ana UCR → San Pedro (ayer)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats,
        state, boarding_started_at, journey_started_at, completed_at
    ) VALUES (
        v_ana_id, v_car_ana, 800.00,
        'UCR, San Pedro', 'San Pedro Mall',
        9.9351, -84.0511, 9.9337, -84.0494,
        NOW() - '1 day'::interval,
        3, 1,
        'completed',
        NOW() - '1 day'::interval + '5 minutes'::interval,
        NOW() - '1 day'::interval + '10 minutes'::interval,
        NOW() - '1 day'::interval + '30 minutes'::interval
    ) RETURNING trip_id INTO v_trip_done1;

    -- Completado 2: Carlos La Sabana → Escazú (hace 3 días)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats,
        state, boarding_started_at, journey_started_at, completed_at
    ) VALUES (
        v_carlos_id, v_car_carlos, 1800.00,
        'La Sabana, San José', 'Escazú Centro',
        9.9355, -84.1100, 9.9224, -84.1364,
        NOW() - '3 days'::interval,
        4, 2,
        'completed',
        NOW() - '3 days'::interval + '5 minutes'::interval,
        NOW() - '3 days'::interval + '10 minutes'::interval,
        NOW() - '3 days'::interval + '45 minutes'::interval
    ) RETURNING trip_id INTO v_trip_done2;

    -- Cancelado: María Heredia → Alajuela (ayer, cancelado por la conductora)
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location,
        from_latitude, from_longitude, to_latitude, to_longitude,
        start_date_time, total_seats, available_seats,
        state, cancelled_at, cancel_reason, cancel_details
    ) VALUES (
        v_maria_id, v_car_maria, 1100.00,
        'Heredia Centro', 'Alajuela Centro',
        9.9980, -84.1170, 10.0162, -84.2144,
        NOW() - '1 day'::interval,
        3, 3,
        'cancelled',
        NOW() - '1 day'::interval - '2 hours'::interval,
        'personal_emergency', 'Emergencia familiar imprevista'
    ) RETURNING trip_id INTO v_trip_cancel;


    -- ─────────────────────────────────────────────────────────
    -- RESERVAS
    -- ─────────────────────────────────────────────────────────

    -- Álvaro reserva en el viaje programado 1 (Carlos)
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state)
    VALUES (v_trip_sched1, v_alvaro_id, 1, 1500.00, 'confirmed');

    -- Laura y Roberto en el viaje en curso de José
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state, boarded_at)
    VALUES (v_trip_active, v_laura_id, 1, 1000.00, 'boarded', NOW()-'28 minutes'::interval)
    RETURNING booking_id INTO v_bk_active;

    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state, boarded_at)
    VALUES (v_trip_active, v_roberto_id, 1, 1000.00, 'boarded', NOW()-'27 minutes'::interval);

    -- Álvaro en el viaje completado de Ana (ayer)
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state)
    VALUES (v_trip_done1, v_alvaro_id, 1, 800.00, 'completed')
    RETURNING booking_id INTO v_bk_done1;

    -- Laura y Roberto en el viaje completado de Carlos
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state)
    VALUES (v_trip_done2, v_laura_id, 1, 1800.00, 'completed')
    RETURNING booking_id INTO v_bk_done2;

    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state)
    VALUES (v_trip_done2, v_roberto_id, 1, 1800.00, 'completed')
    RETURNING booking_id INTO v_bk_done2b;

    -- Álvaro tenía reserva en el viaje cancelado de María (cancelada por la conductora)
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount,
                          state, cancel_reason)
    VALUES (v_trip_cancel, v_alvaro_id, 1, 1100.00, 'cancelled', 'driver_cancelled');


    -- ─────────────────────────────────────────────────────────
    -- CALIFICACIONES
    -- Mezcla de buenas y malas para poblar E3-5
    -- ─────────────────────────────────────────────────────────

    -- Álvaro califica a Ana (viaje completado 1) → 4 estrellas
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done1, v_alvaro_id, v_ana_id, 4,
            'Buen viaje, puntual y amable. El carro estaba limpio.');

    -- Laura califica a Carlos (viaje completado 2) → 2 estrellas ⭐⭐ (E3-5)
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done2, v_laura_id, v_carlos_id, 2,
            'Conducción agresiva en la autopista y el auto tenía olor desagradable.');

    -- Roberto califica a Carlos (viaje completado 2) → 1 estrella ⭐ (E3-5)
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done2, v_roberto_id, v_carlos_id, 1,
            'Llegó tarde, frenó de golpe varias veces. No recomendable.');

    -- Carlos califica a Laura (pasajera) → 5 estrellas
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done2, v_carlos_id, v_laura_id, 5,
            'Pasajera puntual y muy respetuosa. Un placer llevarla.');

    -- Carlos califica a Roberto → 3 estrellas
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done2, v_carlos_id, v_roberto_id, 3,
            'Llegó a tiempo pero estuvo en el teléfono todo el trayecto.');

    -- Ana califica a Álvaro (pasajero) → 5 estrellas
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done1, v_ana_id, v_alvaro_id, 5, 'Excelente pasajero, muy puntual y educado.');

    -- Calificación histórica adicional de José → 1 estrella ⭐ (E3-5)
    -- Re-usa v_trip_done1 con nuevo par rater/rated permitido
    INSERT INTO ratings (trip_id, rater_id, rated_id, rating, comment)
    VALUES (v_trip_done1, v_laura_id, v_jose_id, 1,
            'Manejo descuidado. Me sentí en peligro durante todo el trayecto.');


    -- ─────────────────────────────────────────────────────────
    -- TRIP REPORTS (E3-1 / E3-3)
    -- ─────────────────────────────────────────────────────────

    -- 1. Emergencia durante el viaje en curso de José (abierto)
    INSERT INTO trip_reports (trip_id, driver_id, reporter_id, type, status, description)
    VALUES (
        v_trip_active, v_jose_id, v_laura_id,
        'emergency', 'open',
        'El conductor está acelerando de forma extrema y no responde cuando le pedimos que reduzca la velocidad. Me siento en peligro.'
    );

    -- 2. Reporte al conductor del viaje en curso (abierto, de Roberto)
    INSERT INTO trip_reports (trip_id, driver_id, reporter_id, type, status, description)
    VALUES (
        v_trip_active, v_jose_id, v_roberto_id,
        'driver_report', 'open',
        'El conductor habla por teléfono mientras maneja y no usa el cinturón de seguridad.'
    );

    -- 3. Reporte post-viaje al conductor Carlos (verificado por el admin)
    INSERT INTO trip_reports (trip_id, driver_id, reporter_id, type, status, description, admin_notes, resolved_at)
    VALUES (
        v_trip_done2, v_carlos_id, v_laura_id,
        'driver_report', 'verified',
        'Conducción agresiva y actitud irrespetuosa cuando le pedimos que disminuyera la velocidad.',
        'Revisado. Se confirman los hechos según calificaciones coincidentes del mismo viaje.',
        NOW() - '1 day'::interval
    );

    -- 4. Reporte post-viaje al conductor Carlos (acción tomada)
    INSERT INTO trip_reports (trip_id, driver_id, reporter_id, type, status, description, admin_notes, resolved_at)
    VALUES (
        v_trip_done2, v_carlos_id, v_roberto_id,
        'driver_report', 'action_taken',
        'El conductor frenó de golpe varias veces de forma deliberada y condujo en exceso de velocidad.',
        'Conductor suspendido 7 días por conducción peligrosa reiterada.',
        NOW() - '2 hours'::interval
    );

    -- 5. Reporte desestimado (viaje de Ana, alegación no sustentada)
    INSERT INTO trip_reports (trip_id, driver_id, reporter_id, type, status, description, admin_notes, resolved_at)
    VALUES (
        v_trip_done1, v_ana_id, v_alvaro_id,
        'driver_report', 'dismissed',
        'Creo que la conductora tomó una ruta más larga a propósito.',
        'Ruta verificada. Desvío por cierre vial en Circunvalación. Reporte sin fundamento.',
        NOW() - '12 hours'::interval
    );


    -- ─────────────────────────────────────────────────────────
    -- NOTIFICACIONES
    -- ─────────────────────────────────────────────────────────

    -- Reserva confirmada → Álvaro
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_alvaro_id, v_trip_sched1, 'booking_confirmed',
         'Tu reserva con Carlos Monestel fue confirmada',
         'Tienes un lugar reservado para el viaje UCR → Cartago. ¡Buena ruta!',
         'passenger');

    -- Nueva reserva → Carlos
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_carlos_id, v_trip_sched1, 'booking_received',
         'Álvaro Moya reservó un lugar en tu viaje',
         'Revisa la pantalla de abordaje cuando llegue la hora.',
         'driver');

    -- Viaje completado → Álvaro (Ana)
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_alvaro_id, v_trip_done1, 'trip_completed',
         '¡Viaje completado!',
         'Tu viaje con Ana Picado llegó a su destino. ¿Cómo estuvo la experiencia?',
         'all');

    -- Viaje cancelado → Álvaro (María)
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_alvaro_id, v_trip_cancel, 'driver_cancelled',
         'Tu viaje fue cancelado',
         'María Rodríguez canceló el viaje Heredia → Alajuela. Tu reserva fue anulada.',
         'passenger');

    -- Emergencia → Admin
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_admin_id, v_trip_active, 'emergency_report',
         'EMERGENCIA en viaje — Laura Solís',
         'El conductor está acelerando de forma extrema y no responde cuando le pedimos que reduzca la velocidad.',
         'all');

    -- Reporte al conductor → Admin
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_admin_id, v_trip_active, 'emergency_report',
         'Reporte al conductor — Roberto García',
         'El conductor habla por teléfono mientras maneja y no usa el cinturón de seguridad.',
         'all');

    -- Calificación recibida → Ana
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_ana_id, v_trip_done1, 'rating_received',
         'Recibiste una calificación',
         '4 estrellas. "Buen viaje, puntual y amable. El carro estaba limpio."',
         'all');

    -- Calificación recibida → Carlos (baja)
    INSERT INTO notifications (user_id, trip_id, type, title, body, audience) VALUES
        (v_carlos_id, v_trip_done2, 'rating_received',
         'Recibiste una calificación',
         '2 estrellas. "Conducción agresiva en la autopista y el auto tenía olor desagradable."',
         'all');

END;
$$;


-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT
    u.username,
    u.role,
    u.mean_rating,
    u.total_trips,
    u.driver_trips,
    LEFT(u.qr_token::TEXT, 8) || '...' AS qr_preview,
    (SELECT COUNT(*) FROM vehicles v WHERE v.user_id = u.user_id) AS vehiculos
FROM users u
ORDER BY
    CASE u.role WHEN 'admin' THEN 0 WHEN 'driver' THEN 1 ELSE 2 END,
    u.username;

SELECT
    tr.type,
    tr.status,
    LEFT(tr.description, 60) || '...' AS descripcion,
    u_d.first_name || ' ' || u_d.last_name AS conductor,
    u_r.first_name || ' ' || u_r.last_name AS reportante
FROM trip_reports tr
JOIN users u_d ON u_d.user_id = tr.driver_id
JOIN users u_r ON u_r.user_id = tr.reporter_id
ORDER BY tr.created_at;

SELECT
    r.rating AS estrellas,
    u_r.first_name || ' ' || u_r.last_name AS de,
    u_d.first_name || ' ' || u_d.last_name AS para,
    LEFT(r.comment, 60) AS comentario
FROM ratings r
JOIN users u_r ON u_r.user_id = r.rater_id
JOIN users u_d ON u_d.user_id = r.rated_id
ORDER BY r.rating, r.created_at;
