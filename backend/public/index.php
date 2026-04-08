<?php
declare(strict_types=1);

// ============================================================
// CORS — разрешаем запросы от Next.js фронта
// ============================================================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================
// Autoload src classes
// ============================================================
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/Router.php';

$router = new Router();

// ============================================================
// HELPERS
// ============================================================

/** Декодировать тело запроса как JSON */
function body(): array
{
    static $parsed = null;
    if ($parsed === null) {
        $raw    = file_get_contents('php://input');
        $parsed = (array)(json_decode($raw ?: '{}', true) ?? []);
    }
    return $parsed;
}

/** UUID v4 */
function uuid(): string
{
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/** Проверить, что обязательные поля присутствуют в массиве */
function requireFields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($data[$f]) || $data[$f] === '') {
            Response::error('VALIDATION_ERROR', "Field '$f' is required", 422);
        }
    }
}

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatUser(array $u, PDO $db): array
{
    $loyalty = null;
    if (!empty($u['loyalty_account_id'])) {
        $s = $db->prepare('SELECT * FROM loyalty_accounts WHERE id = ?');
        $s->execute([$u['loyalty_account_id']]);
        $la = $s->fetch();
        if ($la) {
            $loyalty = formatLoyalty($la);
        }
    }
    return [
        'id'              => $u['id'],
        'email'           => $u['email'],
        'role'            => $u['role'],
        'firstName'       => $u['first_name'],
        'lastName'        => $u['last_name'],
        'middleName'      => $u['middle_name'] ?? null,
        'phone'           => $u['phone'],
        'dateOfBirth'     => $u['date_of_birth'],
        'nationality'     => $u['nationality'],
        'isEmailVerified' => (bool)$u['is_email_verified'],
        'isPhoneVerified' => (bool)$u['is_phone_verified'],
        'loyaltyAccount'  => $loyalty,
        'createdAt'       => $u['created_at'],
    ];
}

function formatFare(array $f): array
{
    $baggage  = is_string($f['baggage_allowance'] ?? null)
        ? (json_decode($f['baggage_allowance'], true) ?? ['cabin' => '10 кг', 'checked' => 'нет'])
        : ['cabin' => '10 кг', 'checked' => 'нет'];
    $features = is_string($f['features'] ?? null)
        ? (json_decode($f['features'], true) ?? [])
        : [];
    return [
        'id'              => $f['id'],
        'class'           => $f['class'],
        'price'           => (float)$f['base_price'],
        'currency'        => $f['currency'],
        'availableSeats'  => (int)$f['available_seats'],
        'baggage'         => $baggage,
        'isRefundable'    => (bool)$f['is_refundable'],
        'isChangeable'    => (bool)$f['is_changeable'],
        'cancellationFee' => (float)$f['cancellation_fee'],
        'changeFee'       => (float)$f['change_fee'],
        'features'        => $features,
    ];
}

function formatFlight(array $f, PDO $db): array
{
    $fareStmt = $db->prepare('SELECT * FROM fares WHERE flight_id = ? ORDER BY base_price ASC');
    $fareStmt->execute([$f['id']]);
    $fares = $fareStmt->fetchAll();

    $dep      = new DateTime($f['scheduled_departure']);
    $arr      = new DateTime($f['scheduled_arrival']);
    $duration = (int)(($arr->getTimestamp() - $dep->getTimestamp()) / 60);

    return [
        'id'                 => $f['id'],
        'flightNumber'       => $f['flight_number'],
        'aircraft'           => [
            'model'              => $f['aircraft_model'],
            'registrationNumber' => $f['aircraft_reg'],
        ],
        'origin'             => [
            'id'       => $f['dep_apt_id'],
            'code'     => $f['dep_code'],
            'name'     => $f['dep_name'],
            'city'     => $f['dep_city'],
            'country'  => $f['dep_country'],
            'timezone' => $f['dep_tz'],
        ],
        'destination'        => [
            'id'       => $f['arr_apt_id'],
            'code'     => $f['arr_code'],
            'name'     => $f['arr_name'],
            'city'     => $f['arr_city'],
            'country'  => $f['arr_country'],
            'timezone' => $f['arr_tz'],
        ],
        'scheduledDeparture' => $f['scheduled_departure'],
        'scheduledArrival'   => $f['scheduled_arrival'],
        'actualDeparture'    => $f['actual_departure'] ?? null,
        'actualArrival'      => $f['actual_arrival'] ?? null,
        'status'             => $f['status'],
        'duration'           => $duration,
        'availableSeats'     => (int)$f['available_seats'],
        'gate'               => $f['gate'] ?? null,
        'terminal'           => $f['terminal'] ?? null,
        'fares'              => array_map('formatFare', $fares),
    ];
}

function flightJoinSql(): string
{
    return '
        SELECT f.*,
               da.id   AS dep_apt_id, da.code AS dep_code, da.name AS dep_name,
               da.city AS dep_city, da.country AS dep_country, da.timezone AS dep_tz,
               aa.id   AS arr_apt_id, aa.code AS arr_code, aa.name AS arr_name,
               aa.city AS arr_city, aa.country AS arr_country, aa.timezone AS arr_tz,
               ac.model AS aircraft_model, ac.registration_number AS aircraft_reg
        FROM flights f
        JOIN airports da ON f.origin_airport_id      = da.id
        JOIN airports aa ON f.destination_airport_id = aa.id
        JOIN aircrafts ac ON f.aircraft_id            = ac.id
    ';
}

function fetchFullBooking(string $id, PDO $db): ?array
{
    $sql = flightJoinSql() . '
        JOIN bookings b ON b.flight_id = f.id
        WHERE b.id = ?
    ';
    // We'll just join via bookings
    $bStmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $bStmt->execute([$id]);
    $b = $bStmt->fetch();
    if (!$b) {
        return null;
    }

    // Flight
    $fStmt = $db->prepare(flightJoinSql() . ' WHERE f.id = ?');
    $fStmt->execute([$b['flight_id']]);
    $f = $fStmt->fetch();

    // Fare
    $fareStmt = $db->prepare('SELECT * FROM fares WHERE id = ?');
    $fareStmt->execute([$b['fare_id']]);
    $fare = $fareStmt->fetch();

    // Payment
    $payStmt = $db->prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1');
    $payStmt->execute([$id]);
    $payment = $payStmt->fetch();

    // Tickets / passengers
    $tktStmt = $db->prepare('SELECT * FROM tickets WHERE booking_id = ?');
    $tktStmt->execute([$id]);
    $tickets = $tktStmt->fetchAll();

    // Services
    $svcStmt = $db->prepare('
        SELECT bs.*, s.type, s.name, s.description
        FROM booking_services bs
        JOIN additional_services s ON bs.service_id = s.id
        WHERE bs.booking_id = ?
    ');
    $svcStmt->execute([$id]);
    $services = $svcStmt->fetchAll();

    return [
        'id'          => $b['id'],
        'userId'      => $b['user_id'],
        'pnr'         => $b['pnr'],
        'status'      => $b['status'],
        'totalAmount' => (float)$b['total_amount'],
        'currency'    => $b['currency'] ?? 'RUB',
        'createdAt'   => $b['created_at'],
        'updatedAt'   => $b['updated_at'],
        'flight'      => $f ? formatFlight($f, $db) : null,
        'fare'        => $fare ? formatFare($fare) : null,
        'passengers'  => array_map(fn($t) => [
            'ticketId'     => $t['id'],
            'ticketNumber' => $t['ticket_number'],
            'seatNumber'   => $t['seat_number'],
            'isCheckedIn'  => (bool)$t['is_checked_in'],
        ], $tickets),
        'additionalServices' => array_map(fn($s) => [
            'id'         => $s['id'],
            'service'    => [
                'id'          => $s['service_id'],
                'type'        => $s['type'],
                'name'        => $s['name'],
                'description' => $s['description'],
            ],
            'quantity'   => (int)$s['quantity'],
            'totalPrice' => (float)$s['total_price'],
            'currency'   => $s['currency'],
        ], $services),
        'payment' => $payment ? formatPayment($payment) : null,
    ];
}

function formatPayment(array $p): array
{
    return [
        'id'            => $p['id'],
        'bookingId'     => $p['booking_id'],
        'amount'        => (float)$p['amount'],
        'currency'      => $p['currency'],
        'method'        => $p['method'],
        'status'        => $p['status'],
        'transactionId' => $p['transaction_id'] ?? null,
        'paidAt'        => $p['paid_at'] ?? null,
        'createdAt'     => $p['created_at'],
    ];
}

function formatLoyalty(array $la): array
{
    return [
        'id'               => $la['id'],
        'membershipNumber' => $la['membership_number'],
        'tier'             => $la['tier'],
        'points'           => (int)$la['points'],
        'lifetimePoints'   => (int)$la['lifetime_points'],
        'tierExpiryDate'   => $la['tier_expiry_date'],
        'benefits'         => tierBenefits($la['tier']),
    ];
}

function tierBenefits(string $tier): array
{
    return match ($tier) {
        'bronze'   => ['Накопление миль за каждый полёт'],
        'silver'   => [
            'Накопление миль за каждый полёт',
            'Приоритетная регистрация',
            'Бесплатный выбор места',
        ],
        'gold'     => [
            'Накопление миль за каждый полёт',
            'Приоритетная регистрация',
            'Бесплатный выбор места',
            'Доступ в бизнес-зал',
            'Дополнительный багаж 10 кг',
        ],
        'platinum' => [
            'Накопление миль за каждый полёт',
            'Приоритетная регистрация',
            'Бесплатный выбор места',
            'Доступ в бизнес-зал',
            'Дополнительный багаж 20 кг',
            'Апгрейд класса при наличии свободных мест',
        ],
        default    => [],
    };
}

// ============================================================
// ══════════════  ROUTES  ════════════════════════════════════
// ============================================================

// ── Healthcheck ──────────────────────────────────────────────

$router->get('/api/health', fn() => Response::json(['status' => 'ok', 'timestamp' => date('c')]));

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

// POST /api/auth/login
$router->post('/api/auth/login', function () {
    $b = body();
    requireFields($b, ['email', 'password']);

    $email = strtolower(trim((string)$b['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('VALIDATION_ERROR', 'Invalid email format', 422);
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !Auth::verifyPassword((string)$b['password'], $user['password_hash'])) {
        Response::error('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    $db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);

    $payload      = ['sub' => $user['id'], 'role' => $user['role']];
    $accessToken  = Auth::generateAccessToken($payload);
    $refreshToken = Auth::generateRefreshToken($payload);

    Response::json([
        'accessToken'  => $accessToken,
        'refreshToken' => $refreshToken,
        'expiresIn'    => 3600,
        'user'         => formatUser($user, $db),
    ]);
});

// POST /api/auth/register
$router->post('/api/auth/register', function () {
    $b = body();
    requireFields($b, ['email', 'password', 'firstName', 'lastName', 'phone',
                        'dateOfBirth', 'nationality', 'documentType', 'documentNumber', 'documentExpiry']);

    $email = strtolower(trim((string)$b['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('VALIDATION_ERROR', 'Invalid email format', 422);
    }
    if (strlen((string)$b['password']) < 6) {
        Response::error('VALIDATION_ERROR', 'Password must be at least 6 characters', 422);
    }

    $db = Database::getInstance();

    $chk = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) {
        Response::error('EMAIL_TAKEN', 'Email is already registered', 409);
    }

    $id  = uuid();
    $now = date('Y-m-d H:i:s');

    $db->prepare('
        INSERT INTO users
            (id, email, password_hash, role, first_name, last_name, middle_name,
             phone, date_of_birth, nationality, document_type, document_number, document_expiry,
             is_email_verified, is_phone_verified, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?,?)
    ')->execute([
        $id, $email, Auth::hashPassword((string)$b['password']), 'passenger',
        $b['firstName'], $b['lastName'], $b['middleName'] ?? null,
        $b['phone'], $b['dateOfBirth'], $b['nationality'],
        $b['documentType'], $b['documentNumber'], $b['documentExpiry'],
        $now, $now,
    ]);

    // Create loyalty account
    $loyaltyId = uuid();
    $memberNum = 'SKY' . strtoupper(substr(md5($id), 0, 8));
    $expiry    = date('Y-m-d', strtotime('+1 year'));

    $db->prepare('
        INSERT INTO loyalty_accounts
            (id, user_id, membership_number, tier, points, lifetime_points, tier_expiry_date, joined_at, created_at, updated_at)
        VALUES (?,?,?,?,0,0,?,NOW(),?,?)
    ')->execute([$loyaltyId, $id, $memberNum, 'bronze', $expiry, $now, $now]);

    $db->prepare('UPDATE users SET loyalty_account_id = ? WHERE id = ?')->execute([$loyaltyId, $id]);

    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    Response::json(['user' => formatUser($user, $db), 'message' => 'Registration successful'], 201);
});

// POST /api/auth/refresh
$router->post('/api/auth/refresh', function () {
    $b = body();
    requireFields($b, ['refreshToken']);

    $payload = Auth::validateToken((string)$b['refreshToken']);
    if (!$payload) {
        Response::error('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }

    $newPayload  = ['sub' => $payload['sub'], 'role' => $payload['role']];
    $accessToken = Auth::generateAccessToken($newPayload);

    Response::json(['accessToken' => $accessToken, 'expiresIn' => 3600]);
});

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════

// GET /api/users/:id
$router->get('/api/users/:id', function (array $p) {
    $auth = Auth::requireAuth();
    $id   = $p['id'];

    if ($auth['sub'] !== $id && !in_array($auth['role'], ['admin', 'employee'], true)) {
        Response::forbidden();
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) {
        Response::notFound('User not found');
    }

    Response::json(formatUser($user, $db));
});

// PUT /api/users/:id
$router->put('/api/users/:id', function (array $p) {
    $auth = Auth::requireAuth();
    $id   = $p['id'];

    if ($auth['sub'] !== $id && $auth['role'] !== 'admin') {
        Response::forbidden();
    }

    $b      = body();
    $db     = Database::getInstance();
    $map    = [
        'firstName'  => 'first_name',
        'lastName'   => 'last_name',
        'middleName' => 'middle_name',
        'phone'      => 'phone',
        'email'      => 'email',
    ];
    $sets   = ['updated_at = NOW()'];
    $binds  = [];

    foreach ($map as $json => $col) {
        if (array_key_exists($json, $b)) {
            $sets[]  = "$col = ?";
            $binds[] = $b[$json];
        }
    }
    $binds[] = $id;

    $db->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($binds);

    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    Response::json(formatUser($stmt->fetch(), $db));
});

// POST /api/users/:id/change-password
$router->post('/api/users/:id/change-password', function (array $p) {
    $auth = Auth::requireAuth();
    if ($auth['sub'] !== $p['id']) {
        Response::forbidden();
    }

    $b = body();
    requireFields($b, ['currentPassword', 'newPassword']);

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$p['id']]);
    $user = $stmt->fetch();

    if (!$user || !Auth::verifyPassword((string)$b['currentPassword'], $user['password_hash'])) {
        Response::error('INVALID_PASSWORD', 'Current password is incorrect', 400);
    }

    $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?')
       ->execute([Auth::hashPassword((string)$b['newPassword']), $p['id']]);

    Response::json(['message' => 'Password changed successfully']);
});

// ════════════════════════════════════════════════════════════
// AIRPORTS
// ════════════════════════════════════════════════════════════

// GET /api/airports
$router->get('/api/airports', function () {
    $db   = Database::getInstance();
    $rows = $db->query('SELECT id, code, name, city, country, timezone FROM airports WHERE is_active = 1 ORDER BY city')->fetchAll();

    Response::json(array_map(fn($a) => [
        'id'       => $a['id'],
        'code'     => $a['code'],
        'name'     => $a['name'],
        'city'     => $a['city'],
        'country'  => $a['country'],
        'timezone' => $a['timezone'],
    ], $rows));
});

// ════════════════════════════════════════════════════════════
// FLIGHTS
// ════════════════════════════════════════════════════════════

// POST /api/flights/search  — должен быть до GET /api/flights/:id
$router->post('/api/flights/search', function () {
    $b = body();
    requireFields($b, ['originAirportCode', 'destinationAirportCode', 'departureDate']);

    $origin = strtoupper(trim((string)$b['originAirportCode']));
    $dest   = strtoupper(trim((string)$b['destinationAirportCode']));
    $date   = (string)$b['departureDate'];

    $db = Database::getInstance();

    $sql = flightJoinSql() . '
        WHERE da.code = ?
          AND aa.code = ?
          AND DATE(f.scheduled_departure) = ?
          AND f.status NOT IN (\'cancelled\')
        ORDER BY f.scheduled_departure ASC
    ';

    $stmt = $db->prepare($sql);
    $stmt->execute([$origin, $dest, $date]);
    $flights = $stmt->fetchAll();

    $result = array_map(fn($f) => formatFlight($f, $db), $flights);

    Response::json([
        'flights'      => $result,
        'totalResults' => count($result),
        'searchParams' => $b,
    ]);
});

// GET /api/flights  — список (публичный, с пагинацией)
$router->get('/api/flights', function () {
    $db     = Database::getInstance();
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $total = (int)$db->query('SELECT COUNT(*) FROM flights')->fetchColumn();

    $stmt = $db->prepare(flightJoinSql() . ' ORDER BY f.scheduled_departure DESC LIMIT ? OFFSET ?');
    $stmt->execute([$limit, $offset]);
    $flights = $stmt->fetchAll();

    Response::json([
        'data'       => array_map(fn($f) => formatFlight($f, $db), $flights),
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int)ceil($total / max(1, $limit)),
        ],
    ]);
});

// GET /api/flights/:id
$router->get('/api/flights/:id', function (array $p) {
    $db   = Database::getInstance();
    $stmt = $db->prepare(flightJoinSql() . ' WHERE f.id = ?');
    $stmt->execute([$p['id']]);
    $f = $stmt->fetch();
    if (!$f) {
        Response::notFound('Flight not found');
    }
    Response::json(formatFlight($f, $db));
});

// GET /api/flights/:id/seats
$router->get('/api/flights/:id/seats', function (array $p) {
    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT aircraft_id FROM flights WHERE id = ?');
    $stmt->execute([$p['id']]);
    $flight = $stmt->fetch();
    if (!$flight) {
        Response::notFound('Flight not found');
    }

    $class  = $_GET['fareClass'] ?? null;
    $sql    = 'SELECT * FROM seats WHERE aircraft_id = ?';
    $binds  = [$flight['aircraft_id']];

    if ($class) {
        $sql   .= ' AND class = ?';
        $binds[] = $class;
    }
    $sql .= ' ORDER BY row, `column`';

    $stmt = $db->prepare($sql);
    $stmt->execute($binds);
    $seats = $stmt->fetchAll();

    // Занятые места для данного рейса
    $occStmt = $db->prepare('
        SELECT seat_id FROM bookings
        WHERE flight_id = ? AND seat_id IS NOT NULL
          AND status NOT IN (\'cancelled\', \'refunded\')
    ');
    $occStmt->execute([$p['id']]);
    $occupied = array_column($occStmt->fetchAll(), 'seat_id');

    $formatted = array_map(fn($s) => [
        'id'              => $s['id'],
        'seatNumber'      => $s['seat_number'],
        'class'           => $s['class'],
        'row'             => (int)$s['row'],
        'column'          => $s['column'],
        'isWindow'        => (bool)$s['is_window'],
        'isAisle'         => (bool)$s['is_aisle'],
        'isEmergencyExit' => (bool)$s['is_emergency_exit'],
        'extraLegroom'    => (bool)$s['extra_legroom'],
        'status'          => in_array($s['id'], $occupied, true) ? 'occupied' : 'available',
        'price'           => $s['extra_legroom'] ? 1500.0 : null,
    ], $seats);

    $cols = array_values(array_unique(array_column($seats, 'column')));
    sort($cols);
    $rows = $seats ? max(array_column($seats, 'row')) : 0;

    Response::json([
        'seats'  => $formatted,
        'layout' => ['rows' => (int)$rows, 'columns' => $cols],
    ]);
});

// POST /api/flights  — создать рейс (employee/admin)
$router->post('/api/flights', function () {
    Auth::requireRole('employee', 'admin');
    $b = body();
    requireFields($b, ['flightNumber', 'aircraftId', 'originAirportId', 'destinationAirportId',
                        'scheduledDeparture', 'scheduledArrival']);

    $db = Database::getInstance();

    $acStmt = $db->prepare('SELECT total_seats FROM aircrafts WHERE id = ?');
    $acStmt->execute([$b['aircraftId']]);
    $ac = $acStmt->fetch();
    if (!$ac) {
        Response::error('AIRCRAFT_NOT_FOUND', 'Aircraft not found', 404);
    }

    $id  = uuid();
    $now = date('Y-m-d H:i:s');

    $db->prepare('
        INSERT INTO flights
            (id, flight_number, aircraft_id, origin_airport_id, destination_airport_id,
             scheduled_departure, scheduled_arrival, status, gate, terminal, available_seats, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ')->execute([
        $id, $b['flightNumber'], $b['aircraftId'],
        $b['originAirportId'], $b['destinationAirportId'],
        $b['scheduledDeparture'], $b['scheduledArrival'],
        'scheduled', $b['gate'] ?? null, $b['terminal'] ?? null,
        (int)$ac['total_seats'], $now, $now,
    ]);

    $stmt = $db->prepare(flightJoinSql() . ' WHERE f.id = ?');
    $stmt->execute([$id]);
    Response::json(formatFlight($stmt->fetch(), $db), 201);
});

// PATCH /api/flights/:id/status  — обновить статус рейса
$router->patch('/api/flights/:id/status', function (array $p) {
    Auth::requireRole('employee', 'admin');
    $b = body();

    $valid = ['scheduled', 'cancelled', 'delayed'];
    if (!in_array($b['status'] ?? '', $valid, true)) {
        Response::error('VALIDATION_ERROR', 'Invalid status value', 422);
    }

    $db    = Database::getInstance();
    $sets  = ['status = ?', 'updated_at = NOW()'];
    $binds = [$b['status']];

    foreach (['actualDeparture' => 'actual_departure', 'actualArrival' => 'actual_arrival',
              'gate' => 'gate', 'terminal' => 'terminal'] as $json => $col) {
        if (isset($b[$json])) {
            $sets[]  = "$col = ?";
            $binds[] = $b[$json];
        }
    }
    $binds[] = $p['id'];

    $rows = $db->prepare('UPDATE flights SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($binds);

    // Verify it exists
    $check = $db->prepare('SELECT id FROM flights WHERE id = ?');
    $check->execute([$p['id']]);
    if (!$check->fetch()) {
        Response::notFound('Flight not found');
    }

    Response::json(['message' => 'Flight status updated to ' . $b['status']]);
});

// ════════════════════════════════════════════════════════════
// BOOKINGS
// ════════════════════════════════════════════════════════════

// GET /api/bookings
$router->get('/api/bookings', function () {
    $auth    = Auth::requireAuth();
    $db      = Database::getInstance();
    $isAdmin = in_array($auth['role'], ['admin', 'employee'], true);

    $sql   = '
        SELECT b.*,
               f.flight_number, f.scheduled_departure, f.scheduled_arrival, f.status AS flight_status,
               da.code AS dep_code, da.city AS dep_city,
               aa.code AS arr_code, aa.city AS arr_city
        FROM bookings b
        JOIN flights  f  ON b.flight_id = f.id
        JOIN airports da ON f.origin_airport_id = da.id
        JOIN airports aa ON f.destination_airport_id = aa.id
    ';
    $binds = [];

    if (!$isAdmin) {
        $sql   .= ' WHERE b.user_id = ?';
        $binds[] = $auth['sub'];
    }
    $sql .= ' ORDER BY b.created_at DESC';

    $stmt     = $db->prepare($sql);
    $stmt->execute($binds);
    $bookings = $stmt->fetchAll();

    $result = array_map(fn($b) => [
        'id'          => $b['id'],
        'pnr'         => $b['pnr'],
        'status'      => $b['status'],
        'totalAmount' => (float)$b['total_amount'],
        'currency'    => $b['currency'] ?? 'RUB',
        'flight'      => [
            'flightNumber'       => $b['flight_number'],
            'scheduledDeparture' => $b['scheduled_departure'],
            'scheduledArrival'   => $b['scheduled_arrival'],
            'status'             => $b['flight_status'],
            'origin'             => ['code' => $b['dep_code'], 'city' => $b['dep_city']],
            'destination'        => ['code' => $b['arr_code'], 'city' => $b['arr_city']],
        ],
        'createdAt' => $b['created_at'],
    ], $bookings);

    Response::json($result);
});

// POST /api/bookings
$router->post('/api/bookings', function () {
    $auth = Auth::requireAuth();
    $b    = body();
    requireFields($b, ['flightId', 'fareId', 'passengers']);

    if (!is_array($b['passengers']) || count($b['passengers']) === 0) {
        Response::error('VALIDATION_ERROR', 'At least one passenger is required', 422);
    }

    $db = Database::getInstance();

    // Verify flight
    $fStmt = $db->prepare("SELECT * FROM flights WHERE id = ? AND status NOT IN ('cancelled')");
    $fStmt->execute([$b['flightId']]);
    $flight = $fStmt->fetch();
    if (!$flight) {
        Response::error('FLIGHT_NOT_FOUND', 'Flight not found or unavailable', 404);
    }

    // Verify fare
    $fareStmt = $db->prepare('SELECT * FROM fares WHERE id = ? AND flight_id = ?');
    $fareStmt->execute([$b['fareId'], $b['flightId']]);
    $fare = $fareStmt->fetch();
    if (!$fare) {
        Response::error('FARE_NOT_FOUND', 'Fare not found for this flight', 404);
    }

    if ((int)$fare['available_seats'] < count($b['passengers'])) {
        Response::error('NO_SEATS', 'Not enough available seats in this fare class', 409);
    }

    // Verify seat (optional)
    $seatId = $b['seatId'] ?? null;
    if ($seatId) {
        $seatChk = $db->prepare('SELECT id FROM seats WHERE id = ?');
        $seatChk->execute([$seatId]);
        if (!$seatChk->fetch()) {
            Response::error('SEAT_NOT_FOUND', 'Seat not found', 404);
        }
    }

    $now   = date('Y-m-d H:i:s');
    $id    = uuid();
    $pnr   = strtoupper(substr(md5(uniqid($id, true)), 0, 6));
    $qty   = count($b['passengers']);
    $total = (float)$fare['base_price'] * $qty;

    $db->prepare('
        INSERT INTO bookings
            (id, pnr, user_id, flight_id, fare_id, seat_id, status,
             total_amount, currency, booked_at, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ')->execute([
        $id, $pnr, $auth['sub'], $b['flightId'], $b['fareId'],
        $seatId, 'pending_payment', $total, 'RUB', $now, $now, $now,
    ]);

    // Create tickets for each passenger
    foreach ($b['passengers'] as $pax) {
        $ticketId  = uuid();
        $ticketNum = 'TKT' . strtoupper(substr(md5($ticketId), 0, 10));
        $db->prepare('
            INSERT INTO tickets
                (id, ticket_number, booking_id, passenger_id, flight_id, fare_id, is_checked_in, created_at, updated_at)
            VALUES (?,?,?,?,?,?,0,?,?)
        ')->execute([$ticketId, $ticketNum, $id, $auth['sub'], $b['flightId'], $b['fareId'], $now, $now]);
    }

    // Additional services
    if (!empty($b['additionalServices']) && is_array($b['additionalServices'])) {
        foreach ($b['additionalServices'] as $svc) {
            if (empty($svc['serviceId'])) {
                continue;
            }
            $svcStmt = $db->prepare('SELECT price FROM additional_services WHERE id = ? AND is_active = 1');
            $svcStmt->execute([$svc['serviceId']]);
            $service = $svcStmt->fetch();
            if (!$service) {
                continue;
            }
            $svcQty   = (int)($svc['quantity'] ?? 1);
            $svcTotal = (float)$service['price'] * $svcQty;

            $db->prepare('
                INSERT INTO booking_services (id, booking_id, service_id, quantity, total_price, currency, created_at)
                VALUES (?,?,?,?,?,?,?)
            ')->execute([uuid(), $id, $svc['serviceId'], $svcQty, $svcTotal, 'RUB', $now]);

            $total += $svcTotal;
        }
        // Update total if services were added
        $db->prepare('UPDATE bookings SET total_amount = ? WHERE id = ?')->execute([$total, $id]);
    }

    // Decrement available seats
    $db->prepare('UPDATE fares   SET available_seats = available_seats - ? WHERE id = ?')->execute([$qty, $b['fareId']]);
    $db->prepare('UPDATE flights SET available_seats = available_seats - ? WHERE id = ?')->execute([$qty, $b['flightId']]);

    Response::json(['booking' => fetchFullBooking($id, $db), 'message' => 'Booking created successfully'], 201);
});

// GET /api/bookings/:id
$router->get('/api/bookings/:id', function (array $p) {
    $auth    = Auth::requireAuth();
    $db      = Database::getInstance();
    $booking = fetchFullBooking($p['id'], $db);

    if (!$booking) {
        Response::notFound('Booking not found');
    }

    if ($booking['userId'] !== $auth['sub'] && !in_array($auth['role'], ['admin', 'employee'], true)) {
        Response::forbidden();
    }

    Response::json($booking);
});

// PUT /api/bookings/:id
$router->put('/api/bookings/:id', function (array $p) {
    $auth = Auth::requireAuth();
    $db   = Database::getInstance();

    $stmt = $db->prepare('SELECT user_id, status FROM bookings WHERE id = ?');
    $stmt->execute([$p['id']]);
    $booking = $stmt->fetch();
    if (!$booking) {
        Response::notFound('Booking not found');
    }

    if ($booking['user_id'] !== $auth['sub'] && $auth['role'] !== 'admin') {
        Response::forbidden();
    }

    if (in_array($booking['status'], ['cancelled', 'refunded', 'completed'], true)) {
        Response::error('BOOKING_IMMUTABLE', 'Cannot update a completed or cancelled booking', 400);
    }

    $db->prepare('UPDATE bookings SET updated_at = NOW() WHERE id = ?')->execute([$p['id']]);

    Response::json(['message' => 'Booking updated', 'booking' => fetchFullBooking($p['id'], $db)]);
});

// DELETE /api/bookings/:id  — отмена бронирования
$router->delete('/api/bookings/:id', function (array $p) {
    $auth = Auth::requireAuth();
    $db   = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$p['id']]);
    $booking = $stmt->fetch();
    if (!$booking) {
        Response::notFound('Booking not found');
    }

    if ($booking['user_id'] !== $auth['sub'] && $auth['role'] !== 'admin') {
        Response::forbidden();
    }

    if (in_array($booking['status'], ['cancelled', 'refunded'], true)) {
        Response::error('ALREADY_CANCELLED', 'Booking is already cancelled', 400);
    }

    $now = date('Y-m-d H:i:s');
    $db->prepare('UPDATE bookings SET status = ?, cancelled_at = ?, updated_at = ? WHERE id = ?')
       ->execute(['cancelled', $now, $now, $p['id']]);

    // Restore seats
    $db->prepare('UPDATE fares   SET available_seats = available_seats + 1 WHERE id = ?')->execute([$booking['fare_id']]);
    $db->prepare('UPDATE flights SET available_seats = available_seats + 1 WHERE id = ?')->execute([$booking['flight_id']]);

    $refund = round((float)$booking['total_amount'] * 0.9, 2); // 10% cancellation fee

    Response::json([
        'booking'      => fetchFullBooking($p['id'], $db),
        'refundAmount' => $refund,
        'message'      => 'Booking cancelled successfully',
    ]);
});

// ════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════

// POST /api/payments
$router->post('/api/payments', function () {
    $auth = Auth::requireAuth();
    $b    = body();
    requireFields($b, ['bookingId', 'method']);

    $validMethods = ['card', 'apple_pay', 'google_pay', 'bank_transfer', 'paypal'];
    if (!in_array($b['method'], $validMethods, true)) {
        Response::error('INVALID_METHOD', 'Invalid payment method', 422);
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$b['bookingId']]);
    $booking = $stmt->fetch();

    if (!$booking) {
        Response::notFound('Booking not found');
    }
    if ($booking['user_id'] !== $auth['sub'] && $auth['role'] !== 'admin') {
        Response::forbidden();
    }
    if ($booking['status'] !== 'pending_payment') {
        Response::error('INVALID_STATUS', 'Booking is not awaiting payment', 400);
    }

    $now   = date('Y-m-d H:i:s');
    $id    = uuid();
    $txnId = 'TXN' . strtoupper(substr(md5(uniqid($id, true)), 0, 12));

    $db->prepare('
        INSERT INTO payments
            (id, booking_id, amount, currency, method, status, transaction_id, paid_at, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ')->execute([
        $id, $b['bookingId'], $booking['total_amount'], 'RUB',
        $b['method'], 'completed', $txnId, $now, $now, $now,
    ]);

    $db->prepare('UPDATE bookings SET status = ?, confirmed_at = ?, payment_id = ?, updated_at = ? WHERE id = ?')
       ->execute(['confirmed', $now, $id, $now, $b['bookingId']]);

    $stmt = $db->prepare('SELECT * FROM payments WHERE id = ?');
    $stmt->execute([$id]);

    Response::json([
        'payment' => formatPayment($stmt->fetch()),
        'message' => 'Payment processed successfully',
    ], 201);
});

// GET /api/payments/:id
$router->get('/api/payments/:id', function (array $p) {
    $auth = Auth::requireAuth();
    $db   = Database::getInstance();

    $stmt = $db->prepare('SELECT pay.*, b.user_id FROM payments pay JOIN bookings b ON pay.booking_id = b.id WHERE pay.id = ?');
    $stmt->execute([$p['id']]);
    $payment = $stmt->fetch();

    if (!$payment) {
        Response::notFound('Payment not found');
    }
    if ($payment['user_id'] !== $auth['sub'] && !in_array($auth['role'], ['admin', 'employee'], true)) {
        Response::forbidden();
    }

    Response::json(formatPayment($payment));
});

// ════════════════════════════════════════════════════════════
// ADDITIONAL SERVICES
// ════════════════════════════════════════════════════════════

// GET /api/services
$router->get('/api/services', function () {
    $db   = Database::getInstance();
    $rows = $db->query('SELECT * FROM additional_services WHERE is_active = 1 ORDER BY type, price')->fetchAll();

    $class = $_GET['fareClass'] ?? null;

    $result = array_map(fn($s) => [
        'id'                => $s['id'],
        'type'              => $s['type'],
        'name'              => $s['name'],
        'description'       => $s['description'],
        'price'             => (float)$s['price'],
        'currency'          => $s['currency'],
        'applicableClasses' => json_decode($s['applicable_classes'] ?? '[]', true) ?: [],
    ], $rows);

    if ($class) {
        $result = array_values(array_filter(
            $result,
            fn($s) => empty($s['applicableClasses']) || in_array($class, $s['applicableClasses'], true)
        ));
    }

    Response::json(['services' => $result]);
});

// POST /api/bookings/:id/services
$router->post('/api/bookings/:id/services', function (array $p) {
    $auth = Auth::requireAuth();
    $db   = Database::getInstance();
    $b    = body();
    requireFields($b, ['serviceId']);

    $bStmt = $db->prepare('SELECT user_id, status FROM bookings WHERE id = ?');
    $bStmt->execute([$p['id']]);
    $booking = $bStmt->fetch();

    if (!$booking) {
        Response::notFound('Booking not found');
    }
    if ($booking['user_id'] !== $auth['sub']) {
        Response::forbidden();
    }
    if (!in_array($booking['status'], ['pending_payment', 'confirmed'], true)) {
        Response::error('INVALID_STATUS', 'Cannot add services to this booking', 400);
    }

    $svcStmt = $db->prepare('SELECT * FROM additional_services WHERE id = ? AND is_active = 1');
    $svcStmt->execute([$b['serviceId']]);
    $service = $svcStmt->fetch();
    if (!$service) {
        Response::notFound('Service not found');
    }

    $now   = date('Y-m-d H:i:s');
    $qty   = (int)($b['quantity'] ?? 1);
    $total = (float)$service['price'] * $qty;

    $db->prepare('
        INSERT INTO booking_services (id, booking_id, service_id, quantity, total_price, currency, created_at)
        VALUES (?,?,?,?,?,?,?)
    ')->execute([uuid(), $p['id'], $b['serviceId'], $qty, $total, 'RUB', $now]);

    $db->prepare('UPDATE bookings SET total_amount = total_amount + ?, updated_at = NOW() WHERE id = ?')
       ->execute([$total, $p['id']]);

    Response::json(['message' => 'Service added to booking', 'totalPrice' => $total]);
});

// ════════════════════════════════════════════════════════════
// LOYALTY
// ════════════════════════════════════════════════════════════

// GET /api/loyalty/:userId
$router->get('/api/loyalty/:userId', function (array $p) {
    $auth = Auth::requireAuth();

    if ($auth['sub'] !== $p['userId'] && !in_array($auth['role'], ['admin'], true)) {
        Response::forbidden();
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM loyalty_accounts WHERE user_id = ?');
    $stmt->execute([$p['userId']]);
    $la = $stmt->fetch();

    if (!$la) {
        Response::notFound('Loyalty account not found');
    }

    Response::json(formatLoyalty($la));
});

// POST /api/loyalty/earn-points
$router->post('/api/loyalty/earn-points', function () {
    $auth = Auth::requireAuth();
    $b    = body();
    requireFields($b, ['bookingId']);

    $db = Database::getInstance();

    $bStmt = $db->prepare("SELECT total_amount, user_id FROM bookings WHERE id = ? AND status = 'confirmed'");
    $bStmt->execute([$b['bookingId']]);
    $booking = $bStmt->fetch();

    if (!$booking) {
        Response::error('BOOKING_NOT_FOUND', 'Confirmed booking not found', 404);
    }
    if ($booking['user_id'] !== $auth['sub']) {
        Response::forbidden();
    }

    $points = (int)floor((float)$booking['total_amount'] / 100); // 1 балл за 100 RUB

    $laStmt = $db->prepare('SELECT id, points FROM loyalty_accounts WHERE user_id = ?');
    $laStmt->execute([$auth['sub']]);
    $la = $laStmt->fetch();

    if (!$la) {
        Response::notFound('Loyalty account not found');
    }

    $newBalance = $la['points'] + $points;
    $db->prepare('UPDATE loyalty_accounts SET points = ?, lifetime_points = lifetime_points + ?, updated_at = NOW() WHERE id = ?')
       ->execute([$newBalance, $points, $la['id']]);

    Response::json([
        'pointsEarned' => $points,
        'newBalance'   => $newBalance,
        'message'      => "Начислено $points баллов",
    ]);
});

// ════════════════════════════════════════════════════════════
// DASHBOARD (employee / admin)
// ════════════════════════════════════════════════════════════

// GET /api/dashboard/statistics
$router->get('/api/dashboard/statistics', function () {
    Auth::requireRole('employee', 'admin');
    $db = Database::getInstance();

    $totalFlights  = (int)$db->query('SELECT COUNT(*) FROM flights')->fetchColumn();
    $totalBookings = (int)$db->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
    $totalRevenue  = (float)$db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed'")->fetchColumn();

    $avgOcc = (float)($db->query('
        SELECT AVG((ac.total_seats - f.available_seats) / ac.total_seats * 100)
        FROM flights f JOIN aircrafts ac ON f.aircraft_id = ac.id
        WHERE ac.total_seats > 0
    ')->fetchColumn() ?? 0);

    $topRoutes = $db->query('
        SELECT CONCAT(da.code, \' → \', aa.code) AS route, COUNT(b.id) AS bookings
        FROM bookings b
        JOIN flights  f  ON b.flight_id = f.id
        JOIN airports da ON f.origin_airport_id      = da.id
        JOIN airports aa ON f.destination_airport_id = aa.id
        GROUP BY route
        ORDER BY bookings DESC
        LIMIT 5
    ')->fetchAll();

    $recentIds = $db->query('SELECT id FROM bookings ORDER BY created_at DESC LIMIT 5')->fetchAll(PDO::FETCH_COLUMN);
    $recentBookings = array_filter(array_map(fn($bid) => fetchFullBooking($bid, $db), $recentIds));

    Response::json([
        'totalFlights'     => $totalFlights,
        'totalBookings'    => $totalBookings,
        'totalRevenue'     => $totalRevenue,
        'averageOccupancy' => round($avgOcc, 2),
        'topRoutes'        => array_map(fn($r) => [
            'route'    => $r['route'],
            'bookings' => (int)$r['bookings'],
        ], $topRoutes),
        'recentBookings'   => array_values($recentBookings),
    ]);
});

// ════════════════════════════════════════════════════════════
// FARES  (CRUD для admin)
// ════════════════════════════════════════════════════════════

// GET /api/fares?flightId=xxx
$router->get('/api/fares', function () {
    $db = Database::getInstance();

    $flightId = $_GET['flightId'] ?? null;
    if ($flightId) {
        $stmt = $db->prepare('SELECT * FROM fares WHERE flight_id = ? ORDER BY base_price');
        $stmt->execute([$flightId]);
    } else {
        $stmt = $db->query('SELECT * FROM fares ORDER BY base_price');
    }

    Response::json(array_map('formatFare', $stmt->fetchAll()));
});

// POST /api/fares (admin)
$router->post('/api/fares', function () {
    Auth::requireRole('employee', 'admin');
    $b = body();
    requireFields($b, ['flightId', 'class', 'basePrice', 'availableSeats']);

    $db  = Database::getInstance();
    $id  = uuid();
    $now = date('Y-m-d H:i:s');

    $db->prepare('
        INSERT INTO fares
            (id, flight_id, class, base_price, currency, available_seats,
             baggage_allowance, is_refundable, is_changeable,
             cancellation_fee, change_fee, features, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ')->execute([
        $id, $b['flightId'], $b['class'], $b['basePrice'], $b['currency'] ?? 'RUB',
        $b['availableSeats'],
        json_encode($b['baggage'] ?? ['cabin' => '10 кг', 'checked' => 'нет']),
        (int)($b['isRefundable'] ?? 0), (int)($b['isChangeable'] ?? 1),
        $b['cancellationFee'] ?? 0, $b['changeFee'] ?? 0,
        json_encode($b['features'] ?? []),
        $now, $now,
    ]);

    $stmt = $db->prepare('SELECT * FROM fares WHERE id = ?');
    $stmt->execute([$id]);
    Response::json(formatFare($stmt->fetch()), 201);
});

// ════════════════════════════════════════════════════════════
// PASSWORD RESET
// ════════════════════════════════════════════════════════════

// POST /api/auth/forgot-password
$router->post('/api/auth/forgot-password', function () {
    $b = body();
    requireFields($b, ['email']);

    $email = strtolower(trim((string)$b['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('VALIDATION_ERROR', 'Invalid email format', 422);
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Не раскрываем, есть ли такой email
        Response::json(['message' => 'Если email зарегистрирован, токен сброса был создан', 'token' => null]);
    }

    $token   = bin2hex(random_bytes(24)); // 48 символов hex
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $db->prepare('UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = NOW() WHERE id = ?')
       ->execute([$token, $expires, $user['id']]);

    // email-отправка не реализована — токен возвращаем напрямую
    Response::json([
        'message' => 'Код для сброса пароля создан',
        'token'   => $token,
    ]);
});

// POST /api/auth/reset-password
$router->post('/api/auth/reset-password', function () {
    $b = body();
    requireFields($b, ['token', 'newPassword']);

    $token = trim((string)$b['token']);
    $newPw = (string)$b['newPassword'];

    if (strlen($newPw) < 6) {
        Response::error('VALIDATION_ERROR', 'Password must be at least 6 characters', 422);
    }

    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('INVALID_TOKEN', 'Invalid or expired reset token', 400);
    }

    $db->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = ?')
       ->execute([Auth::hashPassword($newPw), $user['id']]);

    Response::json(['message' => 'Пароль успешно изменён']);
});

// ════════════════════════════════════════════════════════════
// DISPATCH
// ════════════════════════════════════════════════════════════

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

try {
    $router->dispatch($method, $uri);
} catch (PDOException $e) {
    Response::json([
        'error'     => ['code' => 'DB_ERROR', 'message' => 'Database error: ' . $e->getMessage()],
        'timestamp' => date('c'),
    ], 500);
} catch (Throwable $e) {
    Response::json([
        'error'     => ['code' => 'SERVER_ERROR', 'message' => $e->getMessage()],
        'timestamp' => date('c'),
    ], 500);
}
