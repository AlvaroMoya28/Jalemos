-- ============================================================
--  JALEMOS — Full schema v3
--  Crea la base de datos desde cero con datos completos.
--
--  Cambios respecto a v2:
--    · Tabla vehicles: columna `brand` separada de `model`
--    · Seed completo: todos los conductores tienen vehículos,
--      vencimientos de documentos y solicitud aprobada
--    · Pasajero con lugares favoritos y método de pago
--    · Segundo usuario pasajero de prueba
--    · José: Dekra vencida a propósito → prueba del banner de advertencia
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
    total_trips      INTEGER         NOT NULL DEFAULT 0 CHECK (total_trips >= 0),
    driver_trips     INTEGER         NOT NULL DEFAULT 0 CHECK (driver_trips >= 0),
    kms              NUMERIC(10, 2)  NOT NULL DEFAULT 0 CHECK (kms >= 0),
    suspended_until      TIMESTAMPTZ,
    is_active            BOOLEAN   NOT NULL DEFAULT TRUE,
    profile_photo_url    TEXT,
    profile_photo_locked BOOLEAN   NOT NULL DEFAULT FALSE,
    -- Vencimientos copiados al aprobar la solicitud de conductor
    license_expiry_month SMALLINT  CHECK (license_expiry_month BETWEEN 1 AND 12),
    license_expiry_year  SMALLINT  CHECK (license_expiry_year >= 2020),
    dekra_expiry_month   SMALLINT  CHECK (dekra_expiry_month BETWEEN 1 AND 12),
    dekra_expiry_year    SMALLINT  CHECK (dekra_expiry_year >= 2020),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.suspended_until IS 'NULL = activo; fecha futura = suspendido hasta esa fecha';
COMMENT ON COLUMN users.is_active        IS 'FALSE cuando el admin desactiva la cuenta';
COMMENT ON COLUMN users.role             IS 'driver en DB → passenger+driver en el JWT (AuthService.BuildResponse)';


-- ============================================================
-- 2. TABLE: vehicles
--    brand  = marca  (Toyota, Honda, …)
--    model  = modelo (Corolla, Civic, …)
--    NOTA: el EF Core mapping debe actualizarse para incluir `brand`.
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    brand       VARCHAR(60)  NOT NULL,
    model       VARCHAR(100) NOT NULL,
    year        SMALLINT     NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
    num_plate   VARCHAR(20)  NOT NULL UNIQUE,
    color       VARCHAR(50)  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  vehicles       IS 'Vehículos registrados por conductores aprobados';
COMMENT ON COLUMN vehicles.brand IS 'Marca del vehículo (Toyota, Honda, Kia, …)';
COMMENT ON COLUMN vehicles.model IS 'Modelo del vehículo (Corolla, Civic, Sportage, …)';


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
    user_id          UUID               NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    trip_id          UUID               REFERENCES trips(trip_id)            ON DELETE SET NULL,
    booking_id       UUID               REFERENCES bookings(booking_id)      ON DELETE SET NULL,
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

COMMENT ON TABLE  driver_applications                IS 'Solicitudes de registro como conductor';
COMMENT ON COLUMN driver_applications.cedula          IS 'Número de cédula del solicitante';
COMMENT ON COLUMN driver_applications.admin_issue_ids IS 'IDs de problemas predefinidos marcados por el admin';


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

COMMENT ON TABLE user_reports IS 'Reportes de conducta gestionados por admins';


-- ============================================================
-- INDEXES
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
CREATE INDEX idx_driver_app_user    ON driver_applications(user_id);
CREATE INDEX idx_driver_app_status  ON driver_applications(status);
CREATE INDEX idx_reports_reported   ON user_reports(reported_user_id);
CREATE INDEX idx_reports_pending    ON user_reports(status) WHERE status = 'pending';


-- ============================================================
-- FUNCTION: updated_at automático
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
-- FUNCTION: recalcular available_seats en bookings
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
-- FUNCTION: recalcular mean_rating después de cada calificación
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_mean_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET mean_rating = COALESCE(
        (SELECT ROUND(AVG(rating)::NUMERIC, 2)
         FROM ratings WHERE rated_id = NEW.rated_id),
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
    -- Usuarios
    v_admin_id    UUID;
    v_alvaro_id   UUID;
    v_laura_id    UUID;
    v_carlos_id   UUID;
    v_maria_id    UUID;
    v_jose_id     UUID;
    v_ana_id      UUID;

    -- Vehículos (para viajes de prueba)
    v_car_carlos  UUID;
    v_car_maria   UUID;
    v_car_jose    UUID;
    v_car_ana     UUID;

    -- Viajes
    v_trip1       UUID;
    v_trip2       UUID;
BEGIN

    -- ----------------------------------------------------------
    -- ADMIN
    -- ----------------------------------------------------------
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips)
    VALUES ('admin', 'admin@jalemos.cr',
            crypt('admin123', gen_salt('bf', 10)),
            'Admin', 'Jalemos', 'admin', 5.00, 0, 0)
    RETURNING user_id INTO v_admin_id;

    -- ----------------------------------------------------------
    -- PASAJEROS
    -- ----------------------------------------------------------
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips)
    VALUES ('pasajero', 'pasajero@jalemos.cr',
            crypt('pass123', gen_salt('bf', 10)),
            'Álvaro', 'Moya', 'passenger', 4.80, 38, 0)
    RETURNING user_id INTO v_alvaro_id;

    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips)
    VALUES ('laura.s', 'laura@jalemos.cr',
            crypt('laura123', gen_salt('bf', 10)),
            'Laura', 'Solís', 'passenger', 4.60, 12, 0)
    RETURNING user_id INTO v_laura_id;

    -- ----------------------------------------------------------
    -- CONDUCTORES  (role = 'driver' → JWT envía 'passenger+driver')
    -- ----------------------------------------------------------

    -- Carlos Monestel — licencia y Dekra vigentes
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year)
    VALUES ('carlos.m', 'carlos@jalemos.cr',
            crypt('carlos123', gen_salt('bf', 10)),
            'Carlos', 'Monestel', 'driver', 4.80, 15, 52, 1240.50,
            8, 2027, 11, 2026)
    RETURNING user_id INTO v_carlos_id;

    -- María Rodríguez — todo vigente
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year)
    VALUES ('maria.r', 'maria@jalemos.cr',
            crypt('maria123', gen_salt('bf', 10)),
            'María', 'Rodríguez', 'driver', 4.90, 22, 91, 3105.75,
            3, 2028, 5, 2027)
    RETURNING user_id INTO v_maria_id;

    -- José Ledezma — Dekra VENCIDA (prueba del banner de advertencia en perfil)
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year)
    VALUES ('jose.l', 'jose@jalemos.cr',
            crypt('jose123', gen_salt('bf', 10)),
            'José', 'Ledezma', 'driver', 4.70, 10, 38, 890.00,
            6, 2026, 2, 2025)
    RETURNING user_id INTO v_jose_id;

    -- Ana Picado — todo vigente, rating perfecto
    INSERT INTO users (username, email, password_hash, first_name, last_name, role,
                       mean_rating, total_trips, driver_trips, kms,
                       license_expiry_month, license_expiry_year,
                       dekra_expiry_month,   dekra_expiry_year)
    VALUES ('ana.p', 'ana@jalemos.cr',
            crypt('ana123', gen_salt('bf', 10)),
            'Ana', 'Picado', 'driver', 5.00, 8, 30, 620.25,
            12, 2027, 9, 2026)
    RETURNING user_id INTO v_ana_id;

    -- ----------------------------------------------------------
    -- VEHÍCULOS
    -- brand + model por separado desde v3
    -- ----------------------------------------------------------

    -- Carlos: Corolla (principal) + Accent (segundo)
    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_carlos_id, 'Toyota', 'Corolla', 2020, 'ABC-123', 'Blanco')
    RETURNING vehicle_id INTO v_car_carlos;

    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_carlos_id, 'Hyundai', 'Accent', 2022, 'JBN-882', 'Gris');

    -- María: Civic (único)
    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_maria_id, 'Honda', 'Civic', 2019, 'PKL-445', 'Plata')
    RETURNING vehicle_id INTO v_car_maria;

    -- José: Tucson (único)
    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_jose_id, 'Hyundai', 'Tucson', 2021, 'TDR-773', 'Negro')
    RETURNING vehicle_id INTO v_car_jose;

    -- Ana: Sportage (único)
    INSERT INTO vehicles (user_id, brand, model, year, num_plate, color)
    VALUES (v_ana_id, 'Kia', 'Sportage', 2022, 'SFM-118', 'Blanco')
    RETURNING vehicle_id INTO v_car_ana;

    -- ----------------------------------------------------------
    -- SOLICITUDES DE CONDUCTOR (aprobadas)
    -- Los conductores seeded no subieron fotos → NULL en campos de foto
    -- ----------------------------------------------------------

    INSERT INTO driver_applications (
        user_id, status, attempts,
        vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color,
        cedula, address,
        license_expiry_month, license_expiry_year,
        dekra_expiry_month,   dekra_expiry_year,
        is_renewal, reviewed_at, submitted_at, updated_at
    ) VALUES
    (
        v_carlos_id, 'approved', 1,
        'Toyota', 'Corolla', 2020, 'ABC-123', 'Blanco',
        '106340567', 'Barrio Escalante, San José',
        8, 2027, 11, 2026,
        FALSE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '45 days'
    ),
    (
        v_maria_id, 'approved', 1,
        'Honda', 'Civic', 2019, 'PKL-445', 'Plata',
        '207891234', 'Alajuela Centro, Alajuela',
        3, 2028, 5, 2027,
        FALSE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '60 days'
    ),
    (
        v_jose_id, 'approved', 2,
        'Hyundai', 'Tucson', 2021, 'TDR-773', 'Negro',
        '302346789', 'San Pedro, San José',
        6, 2026, 2, 2025,
        FALSE, NOW() - INTERVAL '90 days', NOW() - INTERVAL '95 days', NOW() - INTERVAL '90 days'
    ),
    (
        v_ana_id, 'approved', 1,
        'Kia', 'Sportage', 2022, 'SFM-118', 'Blanco',
        '401237890', 'Heredia Centro, Heredia',
        12, 2027, 9, 2026,
        FALSE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'
    );

    -- ----------------------------------------------------------
    -- LUGARES FAVORITOS (pasajeros)
    -- ----------------------------------------------------------
    INSERT INTO favorite_places (user_id, type, name, address) VALUES
        (v_alvaro_id, 'home', 'Mi casa',     'Barrio Los Yoses, San José'),
        (v_alvaro_id, 'work', 'Universidad', 'UCR, San Pedro, San José'),
        (v_laura_id,  'home', 'Mi casa',     'Moravia, San José'),
        (v_laura_id,  'work', 'Trabajo',     'Escazú, San José');

    -- ----------------------------------------------------------
    -- MÉTODOS DE PAGO
    -- ----------------------------------------------------------
    INSERT INTO payment_methods (user_id, type, alias) VALUES
        (v_alvaro_id, 'sinpe', 'Mi SINPE'),
        (v_alvaro_id, 'cash',  'Efectivo'),
        (v_laura_id,  'sinpe', 'SINPE personal'),
        (v_carlos_id, 'cash',  'Efectivo'),
        (v_maria_id,  'cash',  'Efectivo'),
        (v_jose_id,   'cash',  'Efectivo'),
        (v_ana_id,    'sinpe', 'Mi SINPE');

    -- ----------------------------------------------------------
    -- VIAJES DE PRUEBA
    -- ----------------------------------------------------------
    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location, start_date_time,
        total_seats, available_seats, notes, state
    ) VALUES (
        v_carlos_id, v_car_carlos, 1500.00,
        'UCR, San Pedro', 'Cartago Centro',
        NOW() + INTERVAL '2 hours',
        4, 4, 'Ruta directa por la autopista', 'scheduled'
    ) RETURNING trip_id INTO v_trip1;

    INSERT INTO trips (
        driver_user_id, vehicle_id, rate,
        from_location, to_location, start_date_time,
        total_seats, available_seats, notes, state
    ) VALUES (
        v_maria_id, v_car_maria, 1200.00,
        'Alajuela Centro', 'Heredia Centro',
        NOW() + INTERVAL '4 hours',
        3, 3, NULL, 'scheduled'
    ) RETURNING trip_id INTO v_trip2;

    -- Álvaro reserva el primer viaje de Carlos
    INSERT INTO bookings (trip_id, passenger_id, seats_reserved, estimated_amount, state)
    VALUES (v_trip1, v_alvaro_id, 1, 1500.00, 'confirmed');

    -- ----------------------------------------------------------
    -- NOTIFICACIONES
    -- ----------------------------------------------------------
    INSERT INTO notifications (user_id, trip_id, type, title) VALUES
        (v_alvaro_id, v_trip1, 'booking_confirmed',
         'Tu reserva con Carlos Monestel fue confirmada'),
        (v_carlos_id, v_trip1, 'booking_received',
         'Álvaro Moya reservó un lugar en tu viaje');

END;
$$;


-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
    u.username,
    u.role,
    u.mean_rating,
    u.total_trips,
    u.driver_trips,
    u.license_expiry_month || '/' || u.license_expiry_year AS licencia,
    u.dekra_expiry_month   || '/' || u.dekra_expiry_year   AS dekra,
    (SELECT COUNT(*) FROM vehicles v WHERE v.user_id = u.user_id)          AS vehiculos,
    (SELECT COUNT(*) FROM driver_applications da WHERE da.user_id = u.user_id) AS solicitudes,
    (SELECT COUNT(*) FROM favorite_places fp WHERE fp.user_id = u.user_id) AS lugares_fav,
    (SELECT COUNT(*) FROM payment_methods pm WHERE pm.user_id = u.user_id) AS metodos_pago
FROM users u
ORDER BY
    CASE u.role WHEN 'admin' THEN 0 WHEN 'driver' THEN 1 ELSE 2 END,
    u.username;
