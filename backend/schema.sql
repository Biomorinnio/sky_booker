-- =============================================================
-- Sky Booker — Database Schema + Seed Data
-- MySQL 8.0+  |  utf8mb4
--
-- Запуск:
--   mysql -u root -p < schema.sql
-- Или вставить целиком в phpMyAdmin → SQL
-- =============================================================

CREATE DATABASE IF NOT EXISTS sky_booker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sky_booker;

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- AIRCRAFTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aircrafts (
    id                    CHAR(36)      NOT NULL PRIMARY KEY,
    registration_number   VARCHAR(20)   NOT NULL UNIQUE,
    model                 VARCHAR(100)  NOT NULL,
    manufacturer          VARCHAR(100)  NOT NULL DEFAULT 'Boeing',
    year_manufactured     SMALLINT      NOT NULL DEFAULT 2020,
    total_seats           SMALLINT      NOT NULL DEFAULT 180,
    economy_seats         SMALLINT      NOT NULL DEFAULT 150,
    comfort_seats         SMALLINT      NOT NULL DEFAULT 20,
    business_seats        SMALLINT      NOT NULL DEFAULT 10,
    first_class_seats     SMALLINT      NOT NULL DEFAULT 0,
    is_active             TINYINT(1)    NOT NULL DEFAULT 1,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- AIRPORTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS airports (
    id         CHAR(36)      NOT NULL PRIMARY KEY,
    code       VARCHAR(10)   NOT NULL UNIQUE COMMENT 'IATA code (SVO, LED, ...)',
    name       VARCHAR(200)  NOT NULL,
    city       VARCHAR(100)  NOT NULL,
    country    VARCHAR(100)  NOT NULL,
    timezone   VARCHAR(50)   NOT NULL DEFAULT 'Europe/Moscow',
    latitude   DECIMAL(9,6)  NOT NULL DEFAULT 0,
    longitude  DECIMAL(9,6)  NOT NULL DEFAULT 0,
    is_active  TINYINT(1)    NOT NULL DEFAULT 1,
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                 CHAR(36)     NOT NULL PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    role               ENUM('passenger','agent','employee','admin') NOT NULL DEFAULT 'passenger',
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    middle_name        VARCHAR(100) NULL,
    phone              VARCHAR(30)  NOT NULL,
    date_of_birth      DATE         NOT NULL,
    nationality        VARCHAR(100) NOT NULL DEFAULT 'RU',
    document_type      VARCHAR(50)  NOT NULL DEFAULT 'passport',
    document_number    VARCHAR(50)  NOT NULL,
    document_expiry    DATE         NOT NULL,
    is_email_verified  TINYINT(1)   NOT NULL DEFAULT 0,
    is_phone_verified  TINYINT(1)   NOT NULL DEFAULT 0,
    loyalty_account_id CHAR(36)     NULL,
    last_login_at      DATETIME     NULL,
    reset_token        VARCHAR(64)  NULL,
    reset_token_expires DATETIME    NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- LOYALTY ACCOUNTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    user_id           CHAR(36)     NOT NULL UNIQUE,
    membership_number VARCHAR(50)  NOT NULL UNIQUE,
    tier              ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
    points            INT          NOT NULL DEFAULT 0,
    lifetime_points   INT          NOT NULL DEFAULT 0,
    tier_expiry_date  DATE         NOT NULL,
    joined_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- FLIGHTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flights (
    id                     CHAR(36)    NOT NULL PRIMARY KEY,
    flight_number          VARCHAR(20) NOT NULL,
    aircraft_id            CHAR(36)    NOT NULL,
    origin_airport_id      CHAR(36)    NOT NULL,
    destination_airport_id CHAR(36)    NOT NULL,
    scheduled_departure    DATETIME    NOT NULL,
    scheduled_arrival      DATETIME    NOT NULL,
    actual_departure       DATETIME    NULL,
    actual_arrival         DATETIME    NULL,
    status                 ENUM('scheduled','cancelled','delayed')
                               NOT NULL DEFAULT 'scheduled',
    gate                   VARCHAR(10) NULL,
    terminal               VARCHAR(10) NULL,
    available_seats        SMALLINT    NOT NULL DEFAULT 0,
    created_at             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aircraft_id)            REFERENCES aircrafts(id),
    FOREIGN KEY (origin_airport_id)      REFERENCES airports(id),
    FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
    INDEX idx_dep_date (scheduled_departure),
    INDEX idx_origin (origin_airport_id),
    INDEX idx_dest   (destination_airport_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- FARES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fares (
    id                CHAR(36)         NOT NULL PRIMARY KEY,
    flight_id         CHAR(36)         NOT NULL,
    class             ENUM('economy','comfort','business','first') NOT NULL,
    base_price        DECIMAL(10,2)    NOT NULL,
    currency          CHAR(3)          NOT NULL DEFAULT 'RUB',
    available_seats   SMALLINT         NOT NULL DEFAULT 0,
    baggage_allowance JSON             NULL,
    is_refundable     TINYINT(1)       NOT NULL DEFAULT 0,
    is_changeable     TINYINT(1)       NOT NULL DEFAULT 1,
    cancellation_fee  DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    change_fee        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    features          JSON             NULL,
    created_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    INDEX idx_flight (flight_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- SEATS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seats (
    id               CHAR(36)   NOT NULL PRIMARY KEY,
    aircraft_id      CHAR(36)   NOT NULL,
    seat_number      VARCHAR(5) NOT NULL,
    class            ENUM('economy','comfort','business','first') NOT NULL,
    `row`              TINYINT    NOT NULL,
    `column`         CHAR(1)    NOT NULL,
    is_window        TINYINT(1) NOT NULL DEFAULT 0,
    is_aisle         TINYINT(1) NOT NULL DEFAULT 0,
    is_emergency_exit TINYINT(1) NOT NULL DEFAULT 0,
    extra_legroom    TINYINT(1) NOT NULL DEFAULT 0,
    status           ENUM('available','occupied','blocked') NOT NULL DEFAULT 'available',
    created_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aircraft_id) REFERENCES aircrafts(id) ON DELETE CASCADE,
    UNIQUE KEY uk_seat (aircraft_id, seat_number)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- ADDITIONAL SERVICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS additional_services (
    id                 CHAR(36)      NOT NULL PRIMARY KEY,
    type               ENUM('baggage','meal','seat_selection','priority_boarding','lounge_access','insurance') NOT NULL,
    name               VARCHAR(200)  NOT NULL,
    description        TEXT          NOT NULL,
    price              DECIMAL(10,2) NOT NULL,
    currency           CHAR(3)       NOT NULL DEFAULT 'RUB',
    is_active          TINYINT(1)    NOT NULL DEFAULT 1,
    applicable_classes JSON          NULL COMMENT 'Array of seat classes, null = all',
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id                  CHAR(36)      NOT NULL PRIMARY KEY,
    pnr                 VARCHAR(10)   NOT NULL UNIQUE COMMENT 'Passenger Name Record',
    user_id             CHAR(36)      NOT NULL,
    flight_id           CHAR(36)      NOT NULL,
    fare_id             CHAR(36)      NOT NULL,
    seat_id             CHAR(36)      NULL,
    status              ENUM('created','pending_payment','confirmed','checked_in','completed','cancelled','refunded')
                            NOT NULL DEFAULT 'pending_payment',
    total_amount        DECIMAL(10,2) NOT NULL,
    currency            CHAR(3)       NOT NULL DEFAULT 'RUB',
    payment_id          CHAR(36)      NULL,
    booked_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at        DATETIME      NULL,
    cancelled_at        DATETIME      NULL,
    cancellation_reason TEXT          NULL,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (fare_id)   REFERENCES fares(id),
    INDEX idx_user   (user_id),
    INDEX idx_flight (flight_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- BOOKING SERVICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_services (
    id          CHAR(36)      NOT NULL PRIMARY KEY,
    booking_id  CHAR(36)      NOT NULL,
    service_id  CHAR(36)      NOT NULL,
    quantity    TINYINT       NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    currency    CHAR(3)       NOT NULL DEFAULT 'RUB',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES additional_services(id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                CHAR(36)      NOT NULL PRIMARY KEY,
    booking_id        CHAR(36)      NOT NULL,
    amount            DECIMAL(10,2) NOT NULL,
    currency          CHAR(3)       NOT NULL DEFAULT 'RUB',
    method            ENUM('card','apple_pay','google_pay','bank_transfer','paypal') NOT NULL,
    status            ENUM('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
    transaction_id    VARCHAR(100)  NULL,
    provider_response TEXT          NULL,
    paid_at           DATETIME      NULL,
    refunded_at       DATETIME      NULL,
    refund_amount     DECIMAL(10,2) NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TICKETS (электронные билеты)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id             CHAR(36)    NOT NULL PRIMARY KEY,
    ticket_number  VARCHAR(20) NOT NULL UNIQUE,
    booking_id     CHAR(36)    NOT NULL,
    passenger_id   CHAR(36)    NOT NULL,
    flight_id      CHAR(36)    NOT NULL,
    fare_id        CHAR(36)    NOT NULL,
    seat_number    VARCHAR(10) NULL,
    boarding_group VARCHAR(5)  NULL,
    is_checked_in  TINYINT(1)  NOT NULL DEFAULT 0,
    checked_in_at  DATETIME    NULL,
    created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id)   REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES users(id),
    FOREIGN KEY (flight_id)    REFERENCES flights(id),
    FOREIGN KEY (fare_id)      REFERENCES fares(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- SEED DATA
-- =============================================================

-- ── Aircrafts ─────────────────────────────────────────────────
INSERT IGNORE INTO aircrafts
    (id, registration_number, model, manufacturer, year_manufactured,
     total_seats, economy_seats, comfort_seats, business_seats, first_class_seats)
VALUES
    ('ac-001', 'RA-73001', 'Boeing 737-800',  'Boeing', 2018, 180,  150, 20, 10, 0),
    ('ac-002', 'RA-89001', 'Superjet 100',    'Sukhoi', 2020,  98,   80, 12,  6, 0),
    ('ac-003', 'RA-73002', 'Boeing 737-900',  'Boeing', 2019, 215,  180, 25, 10, 0),
    ('ac-004', 'RA-77001', 'Boeing 777-300',  'Boeing', 2017, 396,  300, 60, 36, 0),
    ('ac-005', 'RA-95001', 'Airbus A320neo',  'Airbus', 2021, 165,  138, 18,  9, 0);

-- ── Airports ──────────────────────────────────────────────────
INSERT IGNORE INTO airports (id, code, name, city, country, timezone, latitude, longitude) VALUES
    ('apt-SVO', 'SVO', 'Шереметьево',       'Москва',           'Россия', 'Europe/Moscow',       55.972600, 37.414600),
    ('apt-DME', 'DME', 'Домодедово',        'Москва',           'Россия', 'Europe/Moscow',       55.408800, 37.906300),
    ('apt-VKO', 'VKO', 'Внуково',           'Москва',           'Россия', 'Europe/Moscow',       55.591500, 37.261500),
    ('apt-LED', 'LED', 'Пулково',           'Санкт-Петербург',  'Россия', 'Europe/Moscow',       59.800300, 30.262500),
    ('apt-AER', 'AER', 'Адлер',             'Сочи',             'Россия', 'Europe/Moscow',       43.449900, 39.956600),
    ('apt-KZN', 'KZN', 'Международный',     'Казань',           'Россия', 'Europe/Moscow',       55.606200, 49.278700),
    ('apt-SVX', 'SVX', 'Кольцово',          'Екатеринбург',     'Россия', 'Asia/Yekaterinburg',  56.843100, 60.802700),
    ('apt-OVB', 'OVB', 'Толмачево',         'Новосибирск',      'Россия', 'Asia/Novosibirsk',    54.966200, 82.650700),
    ('apt-KHV', 'KHV', 'Новый',             'Хабаровск',        'Россия', 'Asia/Vladivostok',    48.528000,135.188200),
    ('apt-VVO', 'VVO', 'Кневичи',           'Владивосток',      'Россия', 'Asia/Vladivostok',    43.399000,132.147900),
    ('apt-UFA', 'UFA', 'Уфа',               'Уфа',              'Россия', 'Asia/Yekaterinburg',  54.557500, 55.874400),
    ('apt-ROV', 'ROV', 'Платов',            'Ростов-на-Дону',   'Россия', 'Europe/Moscow',       47.493800, 39.924700),
    ('apt-KRR', 'KRR', 'Пашковский',        'Краснодар',        'Россия', 'Europe/Moscow',       45.034700, 39.170500),
    ('apt-MRV', 'MRV', 'Минеральные воды',  'Минеральные Воды', 'Россия', 'Europe/Moscow',       44.225100, 43.081900);

-- ── Users (пароль для всех: password) ────────────────────────
-- Hash = bcrypt('password', 10) = $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT IGNORE INTO users
    (id, email, password_hash, role, first_name, last_name, phone,
     date_of_birth, nationality, document_type, document_number, document_expiry,
     is_email_verified, is_phone_verified, created_at, updated_at)
VALUES
    -- Admin
    ('usr-admin', 'admin@sky-booker.ru',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'admin', 'Администратор', 'Системный',
     '+79001234567', '1985-01-01', 'RU', 'passport', '6500000001', '2030-01-01', 1, 1, NOW(), NOW()),

    -- Employee
    ('usr-emp1', 'employee@sky-booker.ru',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'employee', 'Иван', 'Петров',
     '+79007654321', '1988-06-15', 'RU', 'passport', '6512345678', '2029-06-15', 1, 1, NOW(), NOW()),

    -- Passenger
    ('usr-pass1', 'passenger@sky-booker.ru',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'passenger', 'Мария', 'Иванова',
     '+79009876543', '1995-03-20', 'RU', 'passport', '4520987654', '2028-03-20', 1, 0, NOW(), NOW()),

    -- Agent
    ('usr-agent1', 'agent@sky-booker.ru',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'agent', 'Алексей', 'Смирнов',
     '+79001112233', '1990-11-05', 'RU', 'passport', '4011223344', '2027-11-05', 1, 1, NOW(), NOW());

-- ── Loyalty accounts ─────────────────────────────────────────
INSERT IGNORE INTO loyalty_accounts
    (id, user_id, membership_number, tier, points, lifetime_points, tier_expiry_date, joined_at)
VALUES
    ('loy-admin',  'usr-admin',  'SKYADMIN001',  'platinum', 50000, 150000, '2027-12-31', NOW()),
    ('loy-emp1',   'usr-emp1',   'SKYEMP00001',  'gold',     12500,  45000, '2027-06-30', NOW()),
    ('loy-pass1',  'usr-pass1',  'SKYPASS0001',  'silver',    3500,   8500, '2026-12-31', NOW()),
    ('loy-agent1', 'usr-agent1', 'SKYAGENT001',  'bronze',     750,   1200, '2026-09-30', NOW());

UPDATE users SET loyalty_account_id = 'loy-admin'  WHERE id = 'usr-admin';
UPDATE users SET loyalty_account_id = 'loy-emp1'   WHERE id = 'usr-emp1';
UPDATE users SET loyalty_account_id = 'loy-pass1'  WHERE id = 'usr-pass1';
UPDATE users SET loyalty_account_id = 'loy-agent1' WHERE id = 'usr-agent1';

-- ── Additional Services ───────────────────────────────────────
INSERT IGNORE INTO additional_services
    (id, type, name, description, price, currency, is_active, applicable_classes)
VALUES
    ('svc-001', 'baggage',           'Багаж 23 кг',            'Дополнительное место багажа 23 кг',
     2500.00, 'RUB', 1, '["economy","comfort"]'),
    ('svc-002', 'baggage',           'Багаж 32 кг',            'Дополнительное место багажа 32 кг',
     3500.00, 'RUB', 1, '["economy","comfort","business"]'),
    ('svc-003', 'meal',              'Горячее питание',        'Горячий обед — выбор из 3 блюд',
      800.00, 'RUB', 1, '["economy","comfort"]'),
    ('svc-004', 'meal',              'Вегетарианское меню',    'Специальное вегетарианское меню',
      800.00, 'RUB', 1, '["economy","comfort","business"]'),
    ('svc-005', 'seat_selection',    'Место у окна',           'Гарантированное место у иллюминатора',
      500.00, 'RUB', 1, '["economy","comfort"]'),
    ('svc-006', 'seat_selection',    'Место с увеличенным шагом','Дополнительное пространство для ног',
     1200.00, 'RUB', 1, '["economy","comfort"]'),
    ('svc-007', 'priority_boarding', 'Приоритетная посадка',   'Посадка в самолёт в числе первых',
      700.00, 'RUB', 1, '["economy","comfort"]'),
    ('svc-008', 'lounge_access',     'Доступ в бизнес-зал',   'Комфортный отдых перед вылетом',
     3000.00, 'RUB', 1, '["economy","comfort","business"]'),
    ('svc-009', 'insurance',         'Страховка от отмены',    'Возврат 100% стоимости при отмене по уважительным причинам',
     1500.00, 'RUB', 1, NULL),
    ('svc-010', 'insurance',         'Медицинская страховка',  'Страховка от несчастных случаев в поездке',
      900.00, 'RUB', 1, NULL);

-- ── Flights ───────────────────────────────────────────────────
INSERT IGNORE INTO flights
    (id, flight_number, aircraft_id, origin_airport_id, destination_airport_id,
     scheduled_departure, scheduled_arrival, status, gate, terminal, available_seats)
VALUES
    -- ═══ Москва (SVO) ↔ Петербург (LED) ═══
    ('flt-001', 'SU 1001', 'ac-001', 'apt-SVO', 'apt-LED', '2026-03-01 06:00:00', '2026-03-01 07:25:00', 'scheduled', 'B12', 'B', 165),
    ('flt-002', 'SU 1002', 'ac-001', 'apt-LED', 'apt-SVO', '2026-03-01 09:00:00', '2026-03-01 10:25:00', 'scheduled', 'A03', 'A', 140),
    ('flt-009', 'SU 1001', 'ac-001', 'apt-SVO', 'apt-LED', '2026-03-02 06:00:00', '2026-03-02 07:25:00', 'scheduled', 'B14', 'B', 180),
    ('flt-011', 'SU 1001', 'ac-001', 'apt-SVO', 'apt-LED', '2026-03-03 06:00:00', '2026-03-03 07:25:00', 'scheduled', 'B10', 'B', 175),
    ('flt-015', 'SU 1003', 'ac-005', 'apt-SVO', 'apt-LED', '2026-03-02 12:30:00', '2026-03-02 13:55:00', 'scheduled', 'B08', 'B', 160),
    ('flt-016', 'SU 1004', 'ac-005', 'apt-LED', 'apt-SVO', '2026-03-02 15:00:00', '2026-03-02 16:25:00', 'scheduled', 'A06', 'A', 155),
    ('flt-017', 'FV 6001', 'ac-001', 'apt-SVO', 'apt-LED', '2026-03-02 18:00:00', '2026-03-02 19:25:00', 'scheduled', 'C03', 'C', 170),
    ('flt-018', 'FV 6002', 'ac-001', 'apt-LED', 'apt-SVO', '2026-03-02 21:00:00', '2026-03-02 22:25:00', 'scheduled', 'A01', 'A', 145),
    ('flt-019', 'DP 801',  'ac-003', 'apt-DME', 'apt-LED', '2026-03-02 07:00:00', '2026-03-02 08:40:00', 'scheduled', 'D01', 'D', 200),
    ('flt-020', 'DP 802',  'ac-003', 'apt-LED', 'apt-DME', '2026-03-02 10:00:00', '2026-03-02 11:40:00', 'scheduled', 'A04', 'A', 210),

    -- ═══ Москва (SVO) ↔ Сочи (AER) ═══
    ('flt-003', 'SU 2001', 'ac-002', 'apt-SVO', 'apt-AER', '2026-03-01 08:30:00', '2026-03-01 11:10:00', 'scheduled', 'C08', 'C',  85),
    ('flt-004', 'SU 2002', 'ac-002', 'apt-AER', 'apt-SVO', '2026-03-01 13:00:00', '2026-03-01 15:40:00', 'scheduled', 'A01', 'A',  90),
    ('flt-010', 'SU 2001', 'ac-002', 'apt-SVO', 'apt-AER', '2026-03-02 08:30:00', '2026-03-02 11:10:00', 'scheduled', 'C05', 'C',  98),
    ('flt-021', 'SU 2003', 'ac-001', 'apt-SVO', 'apt-AER', '2026-03-02 14:00:00', '2026-03-02 16:40:00', 'scheduled', 'B06', 'B', 170),
    ('flt-022', 'SU 2004', 'ac-001', 'apt-AER', 'apt-SVO', '2026-03-02 18:00:00', '2026-03-02 20:40:00', 'scheduled', 'A02', 'A', 165),
    ('flt-023', 'U6 261',  'ac-005', 'apt-DME', 'apt-AER', '2026-03-02 06:00:00', '2026-03-02 08:40:00', 'scheduled', 'D07', 'D', 160),
    ('flt-024', 'U6 262',  'ac-005', 'apt-AER', 'apt-DME', '2026-03-02 11:00:00', '2026-03-02 13:40:00', 'scheduled', 'A05', 'A', 155),

    -- ═══ Москва (DME) ↔ Екатеринбург (SVX) ═══
    ('flt-005', 'DP 101',  'ac-003', 'apt-DME', 'apt-SVX', '2026-03-01 07:15:00', '2026-03-01 10:30:00', 'scheduled', 'D02', 'D', 200),
    ('flt-006', 'DP 102',  'ac-003', 'apt-SVX', 'apt-DME', '2026-03-01 12:00:00', '2026-03-01 15:15:00', 'scheduled', 'A05', 'A', 215),
    ('flt-025', 'U6 001',  'ac-005', 'apt-SVX', 'apt-DME', '2026-03-02 06:30:00', '2026-03-02 08:30:00', 'scheduled', 'A01', 'A', 160),
    ('flt-026', 'U6 002',  'ac-005', 'apt-DME', 'apt-SVX', '2026-03-02 14:00:00', '2026-03-02 17:15:00', 'scheduled', 'D10', 'D', 155),
    ('flt-027', 'S7 501',  'ac-004', 'apt-DME', 'apt-SVX', '2026-03-02 19:30:00', '2026-03-02 22:45:00', 'scheduled', 'E05', 'E', 380),

    -- ═══ Москва (DME) ↔ Новосибирск (OVB) ═══
    ('flt-007', 'S7 601',  'ac-004', 'apt-DME', 'apt-OVB', '2026-03-01 09:00:00', '2026-03-01 14:20:00', 'scheduled', 'E11', 'E', 380),
    ('flt-008', 'S7 602',  'ac-004', 'apt-OVB', 'apt-DME', '2026-03-01 16:00:00', '2026-03-01 21:20:00', 'scheduled', 'A02', 'A', 396),
    ('flt-028', 'S7 603',  'ac-004', 'apt-DME', 'apt-OVB', '2026-03-02 07:30:00', '2026-03-02 12:50:00', 'scheduled', 'E09', 'E', 370),
    ('flt-029', 'S7 604',  'ac-004', 'apt-OVB', 'apt-DME', '2026-03-02 14:00:00', '2026-03-02 19:20:00', 'scheduled', 'A03', 'A', 380),

    -- ═══ Екатеринбург (SVX) ↔ Казань (KZN) — ВАЖНЫЙ МАРШРУТ ═══
    ('flt-030', 'U6 301',  'ac-002', 'apt-SVX', 'apt-KZN', '2026-03-01 08:00:00', '2026-03-01 09:30:00', 'scheduled', 'A02', 'A',  90),
    ('flt-031', 'U6 302',  'ac-002', 'apt-KZN', 'apt-SVX', '2026-03-01 12:00:00', '2026-03-01 13:30:00', 'scheduled', 'B01', 'B',  85),
    ('flt-032', 'U6 303',  'ac-005', 'apt-SVX', 'apt-KZN', '2026-03-02 10:00:00', '2026-03-02 11:30:00', 'scheduled', 'A03', 'A', 160),
    ('flt-033', 'U6 304',  'ac-005', 'apt-KZN', 'apt-SVX', '2026-03-02 14:30:00', '2026-03-02 16:00:00', 'scheduled', 'B02', 'B', 155),
    ('flt-034', 'U6 305',  'ac-002', 'apt-SVX', 'apt-KZN', '2026-03-02 18:00:00', '2026-03-02 19:30:00', 'scheduled', 'A04', 'A',  95),
    ('flt-035', 'U6 306',  'ac-002', 'apt-KZN', 'apt-SVX', '2026-03-02 21:00:00', '2026-03-02 22:30:00', 'scheduled', 'B03', 'B',  88),

    -- ═══ Москва (DME) → Казань (KZN) ═══
    ('flt-012', 'DP 201',  'ac-003', 'apt-DME', 'apt-KZN', '2026-03-01 11:00:00', '2026-03-01 13:00:00', 'scheduled', 'D05', 'D', 200),
    ('flt-036', 'S7 701',  'ac-004', 'apt-DME', 'apt-KZN', '2026-03-02 07:00:00', '2026-03-02 09:00:00', 'scheduled', 'E02', 'E', 390),
    ('flt-037', 'DP 203',  'ac-003', 'apt-DME', 'apt-KZN', '2026-03-02 15:00:00', '2026-03-02 17:00:00', 'scheduled', 'D03', 'D', 205),
    ('flt-038', 'SU 1301', 'ac-001', 'apt-SVO', 'apt-KZN', '2026-03-02 09:30:00', '2026-03-02 11:30:00', 'scheduled', 'B02', 'B', 175),
    ('flt-039', 'SU 1302', 'ac-001', 'apt-KZN', 'apt-SVO', '2026-03-02 13:00:00', '2026-03-02 15:00:00', 'scheduled', 'A01', 'A', 170),

    -- ═══ Санкт-Петербург (LED) → Сочи (AER) ═══
    ('flt-013', 'SU 3501', 'ac-005', 'apt-LED', 'apt-AER', '2026-03-01 10:15:00', '2026-03-01 13:45:00', 'scheduled', 'C02', 'C', 150),
    ('flt-040', 'FV 6301', 'ac-001', 'apt-LED', 'apt-AER', '2026-03-02 08:00:00', '2026-03-02 11:30:00', 'scheduled', 'C04', 'C', 170),
    ('flt-041', 'FV 6302', 'ac-001', 'apt-AER', 'apt-LED', '2026-03-02 13:00:00', '2026-03-02 16:30:00', 'scheduled', 'A03', 'A', 165),

    -- ═══ Москва (VKO) → Краснодар (KRR) ═══
    ('flt-014', 'UT 401',  'ac-005', 'apt-VKO', 'apt-KRR', '2026-03-01 14:00:00', '2026-03-01 16:30:00', 'scheduled', 'A07', 'A', 160),
    ('flt-042', 'UT 403',  'ac-005', 'apt-VKO', 'apt-KRR', '2026-03-02 07:30:00', '2026-03-02 10:00:00', 'scheduled', 'A02', 'A', 155),
    ('flt-043', 'UT 404',  'ac-005', 'apt-KRR', 'apt-VKO', '2026-03-02 12:00:00', '2026-03-02 14:30:00', 'scheduled', 'B01', 'B', 160),

    -- ═══ Екатеринбург (SVX) ↔ Санкт-Петербург (LED) ═══
    ('flt-044', 'U6 101',  'ac-005', 'apt-SVX', 'apt-LED', '2026-03-02 06:00:00', '2026-03-02 08:30:00', 'scheduled', 'A01', 'A', 160),
    ('flt-045', 'U6 102',  'ac-005', 'apt-LED', 'apt-SVX', '2026-03-02 11:00:00', '2026-03-02 15:30:00', 'scheduled', 'C01', 'C', 155),

    -- ═══ Екатеринбург (SVX) ↔ Сочи (AER) ═══
    ('flt-046', 'U6 401',  'ac-002', 'apt-SVX', 'apt-AER', '2026-03-02 09:00:00', '2026-03-02 12:30:00', 'scheduled', 'A02', 'A',  90),
    ('flt-047', 'U6 402',  'ac-002', 'apt-AER', 'apt-SVX', '2026-03-02 15:00:00', '2026-03-02 18:30:00', 'scheduled', 'A01', 'A',  85),

    -- ═══ Екатеринбург (SVX) ↔ Новосибирск (OVB) ═══
    ('flt-048', 'S7 801',  'ac-002', 'apt-SVX', 'apt-OVB', '2026-03-02 08:00:00', '2026-03-02 11:00:00', 'scheduled', 'A03', 'A',  95),
    ('flt-049', 'S7 802',  'ac-002', 'apt-OVB', 'apt-SVX', '2026-03-02 13:00:00', '2026-03-02 16:00:00', 'scheduled', 'A01', 'A',  90),

    -- ═══ Казань (KZN) ↔ Санкт-Петербург (LED) ═══
    ('flt-050', 'SU 1401', 'ac-002', 'apt-KZN', 'apt-LED', '2026-03-02 07:00:00', '2026-03-02 09:30:00', 'scheduled', 'B01', 'B',  90),
    ('flt-051', 'SU 1402', 'ac-002', 'apt-LED', 'apt-KZN', '2026-03-02 12:00:00', '2026-03-02 14:30:00', 'scheduled', 'C03', 'C',  85),

    -- ═══ Казань (KZN) ↔ Сочи (AER) ═══
    ('flt-052', 'DP 501',  'ac-005', 'apt-KZN', 'apt-AER', '2026-03-02 08:30:00', '2026-03-02 11:30:00', 'scheduled', 'B02', 'B', 155),
    ('flt-053', 'DP 502',  'ac-005', 'apt-AER', 'apt-KZN', '2026-03-02 14:00:00', '2026-03-02 17:00:00', 'scheduled', 'A02', 'A', 150),

    -- ═══ Новосибирск (OVB) ↔ Казань (KZN) ═══
    ('flt-054', 'S7 901',  'ac-002', 'apt-OVB', 'apt-KZN', '2026-03-02 06:30:00', '2026-03-02 09:00:00', 'scheduled', 'A01', 'A',  95),
    ('flt-055', 'S7 902',  'ac-002', 'apt-KZN', 'apt-OVB', '2026-03-02 11:00:00', '2026-03-02 15:30:00', 'scheduled', 'B01', 'B',  90),

    -- ═══ Новосибирск (OVB) ↔ Санкт-Петербург (LED) ═══
    ('flt-056', 'S7 651',  'ac-004', 'apt-OVB', 'apt-LED', '2026-03-02 07:00:00', '2026-03-02 10:30:00', 'scheduled', 'A02', 'A', 380),
    ('flt-057', 'S7 652',  'ac-004', 'apt-LED', 'apt-OVB', '2026-03-02 14:00:00', '2026-03-02 19:20:00', 'scheduled', 'C02', 'C', 370),

    -- ═══ Уфа (UFA) маршруты ═══
    ('flt-058', 'U6 501',  'ac-002', 'apt-UFA', 'apt-SVO', '2026-03-02 06:00:00', '2026-03-02 08:00:00', 'scheduled', 'A01', 'A',  90),
    ('flt-059', 'U6 502',  'ac-002', 'apt-SVO', 'apt-UFA', '2026-03-02 16:00:00', '2026-03-02 20:00:00', 'scheduled', 'B15', 'B',  85),
    ('flt-060', 'U6 503',  'ac-005', 'apt-UFA', 'apt-LED', '2026-03-02 08:00:00', '2026-03-02 10:30:00', 'scheduled', 'A02', 'A', 155),
    ('flt-061', 'U6 504',  'ac-005', 'apt-UFA', 'apt-AER', '2026-03-02 11:00:00', '2026-03-02 14:00:00', 'scheduled', 'A03', 'A', 160),

    -- ═══ Ростов-на-Дону (ROV) маршруты ═══
    ('flt-062', 'SU 1501', 'ac-002', 'apt-ROV', 'apt-SVO', '2026-03-02 07:00:00', '2026-03-02 09:00:00', 'scheduled', 'A01', 'A',  90),
    ('flt-063', 'SU 1502', 'ac-002', 'apt-SVO', 'apt-ROV', '2026-03-02 17:00:00', '2026-03-02 19:00:00', 'scheduled', 'B11', 'B',  85),
    ('flt-064', 'DP 601',  'ac-005', 'apt-ROV', 'apt-LED', '2026-03-02 08:30:00', '2026-03-02 11:00:00', 'scheduled', 'A02', 'A', 155),

    -- ═══ Хабаровск (KHV) и Владивосток (VVO) ═══
    ('flt-065', 'SU 5601', 'ac-004', 'apt-SVO', 'apt-KHV', '2026-03-02 01:00:00', '2026-03-02 09:30:00', 'scheduled', 'B01', 'B', 390),
    ('flt-066', 'SU 5602', 'ac-004', 'apt-KHV', 'apt-SVO', '2026-03-02 12:00:00', '2026-03-02 20:30:00', 'scheduled', 'A01', 'A', 385),
    ('flt-067', 'SU 5701', 'ac-004', 'apt-SVO', 'apt-VVO', '2026-03-02 02:00:00', '2026-03-02 11:00:00', 'scheduled', 'B03', 'B', 380),
    ('flt-068', 'S7 851',  'ac-002', 'apt-KHV', 'apt-VVO', '2026-03-02 10:00:00', '2026-03-02 11:30:00', 'scheduled', 'A02', 'A',  90),
    ('flt-069', 'S7 852',  'ac-002', 'apt-VVO', 'apt-KHV', '2026-03-02 14:00:00', '2026-03-02 15:30:00', 'scheduled', 'A01', 'A',  85),

    -- ═══ Минеральные Воды (MRV) маршруты ═══
    ('flt-070', 'UT 501',  'ac-005', 'apt-VKO', 'apt-MRV', '2026-03-02 09:00:00', '2026-03-02 11:30:00', 'scheduled', 'A03', 'A', 155),
    ('flt-071', 'UT 502',  'ac-005', 'apt-MRV', 'apt-VKO', '2026-03-02 14:00:00', '2026-03-02 16:30:00', 'scheduled', 'A01', 'A', 150),
    ('flt-072', 'U6 601',  'ac-002', 'apt-SVX', 'apt-MRV', '2026-03-02 07:30:00', '2026-03-02 11:00:00', 'scheduled', 'A04', 'A',  90),

    -- ═══ Краснодар (KRR) допы ═══
    ('flt-073', 'SU 1601', 'ac-001', 'apt-SVO', 'apt-KRR', '2026-03-02 10:00:00', '2026-03-02 12:30:00', 'scheduled', 'B05', 'B', 170),
    ('flt-074', 'SU 1602', 'ac-001', 'apt-KRR', 'apt-SVO', '2026-03-02 15:00:00', '2026-03-02 17:30:00', 'scheduled', 'A01', 'A', 165),
    ('flt-075', 'DP 701',  'ac-003', 'apt-DME', 'apt-KRR', '2026-03-02 13:00:00', '2026-03-02 15:30:00', 'scheduled', 'D04', 'D', 200),

    -- ═══ Ночные рейсы (для фильтра "Ночь") ═══
    ('flt-076', 'SU 1005', 'ac-001', 'apt-SVO', 'apt-LED', '2026-03-02 01:00:00', '2026-03-02 02:25:00', 'scheduled', 'B16', 'B', 168),
    ('flt-077', 'S7 605',  'ac-004', 'apt-DME', 'apt-OVB', '2026-03-02 02:30:00', '2026-03-02 07:50:00', 'scheduled', 'E03', 'E', 375),

    -- ═══ Вечерние рейсы (для фильтра "Вечер") ═══
    ('flt-078', 'SU 2005', 'ac-001', 'apt-SVO', 'apt-AER', '2026-03-02 20:00:00', '2026-03-02 22:40:00', 'scheduled', 'B07', 'B', 172),
    ('flt-079', 'DP 105',  'ac-003', 'apt-DME', 'apt-SVX', '2026-03-02 22:00:00', '2026-03-03 01:15:00', 'scheduled', 'D06', 'D', 195),

    -- ═══ Новосибирск (OVB) ↔ Сочи (AER) ═══
    ('flt-080', 'S7 851B', 'ac-004', 'apt-OVB', 'apt-AER', '2026-03-02 08:00:00', '2026-03-02 12:00:00', 'scheduled', 'A01', 'A', 380),
    ('flt-081', 'S7 852B', 'ac-004', 'apt-AER', 'apt-OVB', '2026-03-02 15:00:00', '2026-03-02 22:00:00', 'scheduled', 'A02', 'A', 375),

    -- ═══ Краснодар ↔ Казань ═══
    ('flt-082', 'DP 901',  'ac-005', 'apt-KRR', 'apt-KZN', '2026-03-02 09:00:00', '2026-03-02 12:00:00', 'scheduled', 'A01', 'A', 155),
    ('flt-083', 'DP 902',  'ac-005', 'apt-KZN', 'apt-KRR', '2026-03-02 15:00:00', '2026-03-02 18:00:00', 'scheduled', 'B01', 'B', 150),

    -- ═══ Ростов ↔ Екатеринбург ═══
    ('flt-084', 'U6 701',  'ac-002', 'apt-ROV', 'apt-SVX', '2026-03-02 07:00:00', '2026-03-02 11:00:00', 'scheduled', 'A02', 'A',  88),
    ('flt-085', 'U6 702',  'ac-002', 'apt-SVX', 'apt-ROV', '2026-03-02 14:00:00', '2026-03-02 18:00:00', 'scheduled', 'A03', 'A',  92),

    -- ═══ N4 (Нордвинд) рейсы ═══
    ('flt-086', 'N4 101',  'ac-001', 'apt-SVO', 'apt-AER', '2026-03-02 11:00:00', '2026-03-02 13:40:00', 'scheduled', 'B09', 'B', 175),
    ('flt-087', 'N4 201',  'ac-005', 'apt-SVO', 'apt-KRR', '2026-03-02 16:00:00', '2026-03-02 18:30:00', 'scheduled', 'B13', 'B', 160),
    ('flt-088', 'N4 301',  'ac-003', 'apt-DME', 'apt-MRV', '2026-03-02 09:00:00', '2026-03-02 11:30:00', 'scheduled', 'D08', 'D', 205);

-- ── Fares ─────────────────────────────────────────────────────
INSERT IGNORE INTO fares
    (id, flight_id, class, base_price, currency, available_seats,
     baggage_allowance, is_refundable, is_changeable, cancellation_fee, change_fee, features)
VALUES
    -- ═══ flt-001: SVO→LED (Аэрофлот) ═══
    ('f001-eco', 'flt-001', 'economy',  3500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f001-com', 'flt-001', 'comfort',  6000.00, 'RUB',  20,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f001-bus', 'flt-001', 'business',15000.00, 'RUB',   5,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    -- ═══ flt-002: LED→SVO ═══
    ('f002-eco', 'flt-002', 'economy',  3500.00, 'RUB', 120,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f002-com', 'flt-002', 'comfort',  6000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-003: SVO→AER ═══
    ('f003-eco', 'flt-003', 'economy',  5500.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f003-com', 'flt-003', 'comfort',  9000.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f003-bus', 'flt-003', 'business',22000.00, 'RUB',   5,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    -- ═══ flt-004: AER→SVO ═══
    ('f004-eco', 'flt-004', 'economy',  5500.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f004-com', 'flt-004', 'comfort',  9200.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-005: DME→SVX (Победа) ═══
    ('f005-eco', 'flt-005', 'economy',  7000.00, 'RUB', 180,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f005-com', 'flt-005', 'comfort', 12000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),
    ('f005-bus', 'flt-005', 'business',28000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание"]'),

    -- ═══ flt-006: SVX→DME ═══
    ('f006-eco', 'flt-006', 'economy',  6800.00, 'RUB', 190,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f006-com', 'flt-006', 'comfort', 11500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- ═══ flt-007: DME→OVB (S7) ═══
    ('f007-eco', 'flt-007', 'economy',  9500.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f007-com', 'flt-007', 'comfort', 16000.00, 'RUB',  40,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f007-bus', 'flt-007', 'business',45000.00, 'RUB',  36,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    -- ═══ flt-008: OVB→DME ═══
    ('f008-eco', 'flt-008', 'economy',  9800.00, 'RUB', 350,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f008-com', 'flt-008', 'comfort', 16500.00, 'RUB',  35,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-009: SVO→LED (day 2) ═══
    ('f009-eco', 'flt-009', 'economy',  3700.00, 'RUB', 160,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f009-com', 'flt-009', 'comfort',  6200.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f009-bus', 'flt-009', 'business',15500.00, 'RUB',   8,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Питание","Выбор места"]'),

    -- ═══ flt-010: SVO→AER (day 2) ═══
    ('f010-eco', 'flt-010', 'economy',  5800.00, 'RUB',  80,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f010-com', 'flt-010', 'comfort',  9500.00, 'RUB',  12,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-011: SVO→LED (day 3) ═══
    ('f011-eco', 'flt-011', 'economy',  3600.00, 'RUB', 155,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f011-com', 'flt-011', 'comfort',  6100.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-012: DME→KZN ═══
    ('f012-eco', 'flt-012', 'economy',  4200.00, 'RUB', 180,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f012-com', 'flt-012', 'comfort',  7500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),
    ('f012-bus', 'flt-012', 'business',18000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Питание"]'),

    -- ═══ flt-013: LED→AER ═══
    ('f013-eco', 'flt-013', 'economy',  6200.00, 'RUB', 138,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f013-com', 'flt-013', 'comfort', 10500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-014: VKO→KRR ═══
    ('f014-eco', 'flt-014', 'economy',  4800.00, 'RUB', 145,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),
    ('f014-com', 'flt-014', 'comfort',  8500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-015: SVO→LED (дневной) ═══
    ('f015-eco', 'flt-015', 'economy',  4000.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f015-com', 'flt-015', 'comfort',  6800.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-016: LED→SVO (дневной) ═══
    ('f016-eco', 'flt-016', 'economy',  3900.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f016-com', 'flt-016', 'comfort',  6500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-017: FV SVO→LED (вечер Россия) ═══
    ('f017-eco', 'flt-017', 'economy',  3200.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f017-com', 'flt-017', 'comfort',  5500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- ═══ flt-018: FV LED→SVO (ночь Россия) ═══
    ('f018-eco', 'flt-018', 'economy',  3100.00, 'RUB', 130,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),

    -- ═══ flt-019: DP DME→LED ═══
    ('f019-eco', 'flt-019', 'economy',  2800.00, 'RUB', 185,
     '{"cabin":"10 кг","checked":"нет"}', 0, 0, 2000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f019-com', 'flt-019', 'comfort',  5000.00, 'RUB',  20,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг"]'),

    -- ═══ flt-020: DP LED→DME ═══
    ('f020-eco', 'flt-020', 'economy',  2900.00, 'RUB', 190,
     '{"cabin":"10 кг","checked":"нет"}', 0, 0, 2000, 1000,
     '["Ручная кладь 10 кг"]'),

    -- ═══ flt-021: SU SVO→AER (дневной) ═══
    ('f021-eco', 'flt-021', 'economy',  6200.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f021-com', 'flt-021', 'comfort', 10000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f021-bus', 'flt-021', 'business',24000.00, 'RUB',   8,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    -- ═══ flt-022: SU AER→SVO ═══
    ('f022-eco', 'flt-022', 'economy',  6000.00, 'RUB', 148,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f022-com', 'flt-022', 'comfort',  9800.00, 'RUB',  12,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-023: U6 DME→AER ═══
    ('f023-eco', 'flt-023', 'economy',  4500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f023-com', 'flt-023', 'comfort',  7800.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- ═══ flt-024: U6 AER→DME ═══
    ('f024-eco', 'flt-024', 'economy',  4700.00, 'RUB', 138,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ flt-025: U6 SVX→DME ═══
    ('f025-eco', 'flt-025', 'economy',  6500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f025-com', 'flt-025', 'comfort', 11000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- ═══ flt-026: U6 DME→SVX ═══
    ('f026-eco', 'flt-026', 'economy',  7200.00, 'RUB', 138,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f026-com', 'flt-026', 'comfort', 12500.00, 'RUB',  12,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- ═══ flt-027: S7 DME→SVX ═══
    ('f027-eco', 'flt-027', 'economy',  7500.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг","Багаж 23 кг"]'),
    ('f027-com', 'flt-027', 'comfort', 13000.00, 'RUB',  30,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f027-bus', 'flt-027', 'business',30000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание"]'),

    -- ═══ flt-028: S7 DME→OVB (day 2) ═══
    ('f028-eco', 'flt-028', 'economy', 10200.00, 'RUB', 330,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f028-com', 'flt-028', 'comfort', 17000.00, 'RUB',  35,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ flt-029: S7 OVB→DME (day 2) ═══
    ('f029-eco', 'flt-029', 'economy',  9900.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),

    -- ═══ ЕКБ ↔ КАЗАНЬ (важно!) ═══
    -- flt-030: U6 SVX→KZN
    ('f030-eco', 'flt-030', 'economy',  3800.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f030-com', 'flt-030', 'comfort',  6500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),
    ('f030-bus', 'flt-030', 'business',14000.00, 'RUB',   5,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание"]'),

    -- flt-031: U6 KZN→SVX
    ('f031-eco', 'flt-031', 'economy',  3800.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f031-com', 'flt-031', 'comfort',  6500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- flt-032: U6 SVX→KZN (day 2)
    ('f032-eco', 'flt-032', 'economy',  4000.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f032-com', 'flt-032', 'comfort',  7000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- flt-033: U6 KZN→SVX (day 2)
    ('f033-eco', 'flt-033', 'economy',  3900.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f033-com', 'flt-033', 'comfort',  6800.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- flt-034: U6 SVX→KZN (вечер)
    ('f034-eco', 'flt-034', 'economy',  3500.00, 'RUB',  80,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f034-com', 'flt-034', 'comfort',  6200.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    -- flt-035: U6 KZN→SVX (ночь)
    ('f035-eco', 'flt-035', 'economy',  3300.00, 'RUB',  73,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),

    -- ═══ Москва → Казань (доп.) ═══
    -- flt-036: S7 DME→KZN
    ('f036-eco', 'flt-036', 'economy',  4500.00, 'RUB', 350,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг"]'),
    ('f036-com', 'flt-036', 'comfort',  8000.00, 'RUB',  30,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f036-bus', 'flt-036', 'business',19000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Питание"]'),

    -- flt-037: DP DME→KZN
    ('f037-eco', 'flt-037', 'economy',  3800.00, 'RUB', 185,
     '{"cabin":"10 кг","checked":"нет"}', 0, 0, 2000, 1000,
     '["Ручная кладь 10 кг"]'),

    -- flt-038: SU SVO→KZN
    ('f038-eco', 'flt-038', 'economy',  5000.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f038-com', 'flt-038', 'comfort',  8500.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f038-bus', 'flt-038', 'business',20000.00, 'RUB',   8,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    -- flt-039: SU KZN→SVO
    ('f039-eco', 'flt-039', 'economy',  4800.00, 'RUB', 148,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f039-com', 'flt-039', 'comfort',  8200.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ LED↔AER доп. ═══
    ('f040-eco', 'flt-040', 'economy',  6500.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f040-com', 'flt-040', 'comfort', 11000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f041-eco', 'flt-041', 'economy',  6300.00, 'RUB', 148,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f041-com', 'flt-041', 'comfort', 10800.00, 'RUB',  12,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ VKO↔KRR доп. ═══
    ('f042-eco', 'flt-042', 'economy',  4500.00, 'RUB', 138,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),
    ('f042-com', 'flt-042', 'comfort',  8000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f043-eco', 'flt-043', 'economy',  4600.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),

    -- ═══ SVX↔LED ═══
    ('f044-eco', 'flt-044', 'economy',  8500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f044-com', 'flt-044', 'comfort', 14000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f045-eco', 'flt-045', 'economy',  8800.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f045-com', 'flt-045', 'comfort', 14500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ SVX↔AER ═══
    ('f046-eco', 'flt-046', 'economy',  9000.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f046-com', 'flt-046', 'comfort', 15000.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f047-eco', 'flt-047', 'economy',  9200.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ SVX↔OVB ═══
    ('f048-eco', 'flt-048', 'economy',  7500.00, 'RUB',  80,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f048-com', 'flt-048', 'comfort', 13000.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f049-eco', 'flt-049', 'economy',  7800.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ KZN↔LED ═══
    ('f050-eco', 'flt-050', 'economy',  5500.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f050-com', 'flt-050', 'comfort',  9500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f051-eco', 'flt-051', 'economy',  5700.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f051-com', 'flt-051', 'comfort',  9800.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ KZN↔AER ═══
    ('f052-eco', 'flt-052', 'economy',  6800.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f052-com', 'flt-052', 'comfort', 11500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f053-eco', 'flt-053', 'economy',  7000.00, 'RUB', 130,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ OVB↔KZN ═══
    ('f054-eco', 'flt-054', 'economy',  8000.00, 'RUB',  80,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f054-com', 'flt-054', 'comfort', 13500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f055-eco', 'flt-055', 'economy',  8200.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ OVB↔LED ═══
    ('f056-eco', 'flt-056', 'economy', 12000.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f056-com', 'flt-056', 'comfort', 20000.00, 'RUB',  30,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),
    ('f056-bus', 'flt-056', 'business',48000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    ('f057-eco', 'flt-057', 'economy', 12500.00, 'RUB', 330,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),

    -- ═══ Уфа ═══
    ('f058-eco', 'flt-058', 'economy',  5500.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f058-com', 'flt-058', 'comfort',  9000.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f059-eco', 'flt-059', 'economy',  5800.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),

    ('f060-eco', 'flt-060', 'economy',  7000.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f060-com', 'flt-060', 'comfort', 12000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f061-eco', 'flt-061', 'economy',  8500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f061-com', 'flt-061', 'comfort', 14000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ Ростов ═══
    ('f062-eco', 'flt-062', 'economy',  5000.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),
    ('f062-com', 'flt-062', 'comfort',  8500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f063-eco', 'flt-063', 'economy',  5200.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),

    ('f064-eco', 'flt-064', 'economy',  6000.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f064-com', 'flt-064', 'comfort', 10000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ Хабаровск, Владивосток (дальнемагистральные) ═══
    ('f065-eco', 'flt-065', 'economy', 18000.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 5000, 2000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Питание"]'),
    ('f065-com', 'flt-065', 'comfort', 30000.00, 'RUB',  40,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 2000, 1000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание","Доп. багаж"]'),
    ('f065-bus', 'flt-065', 'business',65000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места","Лаунж"]'),

    ('f066-eco', 'flt-066', 'economy', 17500.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 5000, 2000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Питание"]'),
    ('f066-com', 'flt-066', 'comfort', 29000.00, 'RUB',  35,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 2000, 1000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f067-eco', 'flt-067', 'economy', 20000.00, 'RUB', 330,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 5000, 2000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Питание"]'),
    ('f067-com', 'flt-067', 'comfort', 33000.00, 'RUB',  40,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 2000, 1000,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание","Доп. багаж"]'),
    ('f067-bus', 'flt-067', 'business',70000.00, 'RUB',  10,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Приоритетная посадка","Питание","Выбор места"]'),

    ('f068-eco', 'flt-068', 'economy',  4000.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f069-eco', 'flt-069', 'economy',  4200.00, 'RUB',  70,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),

    -- ═══ Минводы ═══
    ('f070-eco', 'flt-070', 'economy',  5500.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f070-com', 'flt-070', 'comfort',  9500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f071-eco', 'flt-071', 'economy',  5300.00, 'RUB', 130,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f071-com', 'flt-071', 'comfort',  9200.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f072-eco', 'flt-072', 'economy',  8000.00, 'RUB',  75,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f072-com', 'flt-072', 'comfort', 13500.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ Краснодар доп. ═══
    ('f073-eco', 'flt-073', 'economy',  5000.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг","Онлайн-регистрация"]'),
    ('f073-com', 'flt-073', 'comfort',  8800.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f074-eco', 'flt-074', 'economy',  4800.00, 'RUB', 145,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),

    ('f075-eco', 'flt-075', 'economy',  3500.00, 'RUB', 180,
     '{"cabin":"10 кг","checked":"нет"}', 0, 0, 2000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f075-com', 'flt-075', 'comfort',  6500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг"]'),

    -- ═══ Ночные ═══
    ('f076-eco', 'flt-076', 'economy',  2500.00, 'RUB', 148,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1500, 500,
     '["Ручная кладь 10 кг"]'),
    ('f076-com', 'flt-076', 'comfort',  4500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f077-eco', 'flt-077', 'economy',  8500.00, 'RUB', 335,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 3000, 1000,
     '["Ручная кладь 10 кг"]'),
    ('f077-com', 'flt-077', 'comfort', 14500.00, 'RUB',  30,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    -- ═══ Вечерние ═══
    ('f078-eco', 'flt-078', 'economy',  6500.00, 'RUB', 152,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f078-bus', 'flt-078', 'business',25000.00, 'RUB',   8,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Питание"]'),

    ('f079-eco', 'flt-079', 'economy',  7500.00, 'RUB', 175,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ OVB↔AER ═══
    ('f080-eco', 'flt-080', 'economy', 14000.00, 'RUB', 340,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 3500, 1200,
     '["Ручная кладь 10 кг","Багаж 23 кг","Питание"]'),
    ('f080-com', 'flt-080', 'comfort', 22000.00, 'RUB',  30,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 1000, 500,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]'),

    ('f081-eco', 'flt-081', 'economy', 14500.00, 'RUB', 335,
     '{"cabin":"10 кг","checked":"23 кг"}', 0, 1, 3500, 1200,
     '["Ручная кладь 10 кг","Багаж 23 кг","Питание"]'),

    -- ═══ KRR↔KZN ═══
    ('f082-eco', 'flt-082', 'economy',  6000.00, 'RUB', 135,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f082-com', 'flt-082', 'comfort', 10000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f083-eco', 'flt-083', 'economy',  6200.00, 'RUB', 130,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),

    -- ═══ ROV↔SVX ═══
    ('f084-eco', 'flt-084', 'economy',  9500.00, 'RUB',  73,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),
    ('f084-com', 'flt-084', 'comfort', 16000.00, 'RUB',  10,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 800, 400,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f085-eco', 'flt-085', 'economy',  9800.00, 'RUB',  77,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2500, 800,
     '["Ручная кладь 10 кг"]'),

    -- ═══ Нордвинд ═══
    ('f086-eco', 'flt-086', 'economy',  5200.00, 'RUB', 150,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 800,
     '["Ручная кладь 10 кг"]'),
    ('f086-com', 'flt-086', 'comfort',  8800.00, 'RUB',  18,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),
    ('f086-bus', 'flt-086', 'business',21000.00, 'RUB',   8,
     '{"cabin":"15 кг","checked":"32 кг"}', 1, 1, 0, 0,
     '["Ручная кладь 15 кг","Багаж 32 кг","Бизнес-зал","Питание"]'),

    ('f087-eco', 'flt-087', 'economy',  4500.00, 'RUB', 140,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 1800, 600,
     '["Ручная кладь 10 кг"]'),
    ('f087-com', 'flt-087', 'comfort',  8000.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места"]'),

    ('f088-eco', 'flt-088', 'economy',  5000.00, 'RUB', 185,
     '{"cabin":"10 кг","checked":"нет"}', 0, 1, 2000, 700,
     '["Ручная кладь 10 кг"]'),
    ('f088-com', 'flt-088', 'comfort',  8500.00, 'RUB',  15,
     '{"cabin":"10 кг","checked":"23 кг"}', 1, 1, 500, 300,
     '["Ручная кладь 10 кг","Багаж 23 кг","Выбор места","Питание"]');

-- ── Seats for ac-001 (Boeing 737-800) ────────────────────────
INSERT IGNORE INTO seats
    (id, aircraft_id, seat_number, class, `row`, `column`, is_window, is_aisle, is_emergency_exit, extra_legroom)
VALUES
    -- Business: `row`s 1–2 (4 seats/`row`: A,C,D,F — 2+2 config)
    ('s1-1A','ac-001','1A','business',1,'A',1,0,0,1), ('s1-1C','ac-001','1C','business',1,'C',0,1,0,1),
    ('s1-1D','ac-001','1D','business',1,'D',0,1,0,1), ('s1-1F','ac-001','1F','business',1,'F',1,0,0,1),
    ('s1-2A','ac-001','2A','business',2,'A',1,0,0,1), ('s1-2C','ac-001','2C','business',2,'C',0,1,0,1),
    ('s1-2D','ac-001','2D','business',2,'D',0,1,0,1), ('s1-2F','ac-001','2F','business',2,'F',1,0,0,1),
    -- Comfort: `row`s 3–7 (6 seats/`row`: A,B,C,D,E,F — 3+3 config)
    ('s1-3A','ac-001','3A','comfort',3,'A',1,0,0,1), ('s1-3B','ac-001','3B','comfort',3,'B',0,0,0,1),
    ('s1-3C','ac-001','3C','comfort',3,'C',0,1,0,1), ('s1-3D','ac-001','3D','comfort',3,'D',0,1,0,1),
    ('s1-3E','ac-001','3E','comfort',3,'E',0,0,0,1), ('s1-3F','ac-001','3F','comfort',3,'F',1,0,0,1),
    ('s1-4A','ac-001','4A','comfort',4,'A',1,0,0,0), ('s1-4B','ac-001','4B','comfort',4,'B',0,0,0,0),
    ('s1-4C','ac-001','4C','comfort',4,'C',0,1,0,0), ('s1-4D','ac-001','4D','comfort',4,'D',0,1,0,0),
    ('s1-4E','ac-001','4E','comfort',4,'E',0,0,0,0), ('s1-4F','ac-001','4F','comfort',4,'F',1,0,0,0),
    -- Economy: `row`s 8–30 (6 seats/`row`) — показаны ключевые
    ('s1-8A','ac-001', '8A','economy', 8,'A',1,0,0,0), ('s1-8B','ac-001', '8B','economy', 8,'B',0,0,0,0),
    ('s1-8C','ac-001', '8C','economy', 8,'C',0,1,0,0), ('s1-8D','ac-001', '8D','economy', 8,'D',0,1,0,0),
    ('s1-8E','ac-001', '8E','economy', 8,'E',0,0,0,0), ('s1-8F','ac-001', '8F','economy', 8,'F',1,0,0,0),
    ('s1-15A','ac-001','15A','economy',15,'A',1,0,1,1), ('s1-15B','ac-001','15B','economy',15,'B',0,0,1,1),
    ('s1-15C','ac-001','15C','economy',15,'C',0,1,1,1), ('s1-15D','ac-001','15D','economy',15,'D',0,1,1,1),
    ('s1-15E','ac-001','15E','economy',15,'E',0,0,1,1), ('s1-15F','ac-001','15F','economy',15,'F',1,0,1,1),
    ('s1-20A','ac-001','20A','economy',20,'A',1,0,0,0), ('s1-20B','ac-001','20B','economy',20,'B',0,0,0,0),
    ('s1-20C','ac-001','20C','economy',20,'C',0,1,0,0), ('s1-20D','ac-001','20D','economy',20,'D',0,1,0,0),
    ('s1-20E','ac-001','20E','economy',20,'E',0,0,0,0), ('s1-20F','ac-001','20F','economy',20,'F',1,0,0,0),
    ('s1-25A','ac-001','25A','economy',25,'A',1,0,0,0), ('s1-25F','ac-001','25F','economy',25,'F',1,0,0,0),
    ('s1-30A','ac-001','30A','economy',30,'A',1,0,0,0), ('s1-30F','ac-001','30F','economy',30,'F',1,0,0,0);

-- ── Seats for ac-002 (Superjet 100) ──────────────────────────
INSERT IGNORE INTO seats
    (id, aircraft_id, seat_number, class, `row`, `column`, is_window, is_aisle, is_emergency_exit, extra_legroom)
VALUES
    -- Business: `row`s 1–3 (A,B,C,D)
    ('s2-1A','ac-002','1A','business',1,'A',1,0,0,1), ('s2-1B','ac-002','1B','business',1,'B',0,1,0,1),
    ('s2-1C','ac-002','1C','business',1,'C',0,1,0,1), ('s2-1D','ac-002','1D','business',1,'D',1,0,0,1),
    -- Economy `row`s 4–20
    ('s2-4A','ac-002','4A','economy',4,'A',1,0,0,0), ('s2-4B','ac-002','4B','economy',4,'B',0,0,0,0),
    ('s2-4C','ac-002','4C','economy',4,'C',0,1,0,0), ('s2-4D','ac-002','4D','economy',4,'D',0,1,0,0),
    ('s2-4E','ac-002','4E','economy',4,'E',0,0,0,0), ('s2-4F','ac-002','4F','economy',4,'F',1,0,0,0),
    ('s2-10A','ac-002','10A','economy',10,'A',1,0,1,1),('s2-10F','ac-002','10F','economy',10,'F',1,0,1,1),
    ('s2-20A','ac-002','20A','economy',20,'A',1,0,0,0),('s2-20F','ac-002','20F','economy',20,'F',1,0,0,0);
