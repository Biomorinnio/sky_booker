# Sky Booker — PHP Backend

REST API для системы бронирования авиабилетов.
Написан на чистом **PHP 8+** с использованием **PDO** для подключения к MySQL. Без фреймворков — код легко читается и расширяется.

---

## Требования

| Зависимость | Версия |
|-------------|--------|
| PHP         | ≥ 8.0  |
| MySQL       | ≥ 8.0  |
| phpMyAdmin  | любая  |

Расширения PHP: `pdo_mysql`, `json` (включены по умолчанию в большинстве сборок).

---

## Быстрый старт

### 1. Создать базу данных

Откройте **phpMyAdmin** → вкладка **SQL** → вставьте и выполните весь файл `schema.sql`.

Или через консоль:

```bash
mysql -u root -p < schema.sql
```

### 2. Настроить подключение

Откройте `config/db.php` и укажите свои параметры:

```php
return [
    'host'     => 'localhost',
    'dbname'   => 'sky_booker',
    'username' => 'root',
    'password' => '',        // ← ваш пароль MySQL
    'charset'  => 'utf8mb4',
    ...
];
```

### 3. Запустить сервер

```bash
cd backend
php -S localhost:3001 router.php
```

Фронт (Next.js на `localhost:3000`) будет обращаться к `http://localhost:3001/api/...`.

---

## Структура

```
backend/
├── config/
│   └── db.php              # Настройки подключения к MySQL
├── src/
│   ├── Database.php        # PDO Singleton
│   ├── Response.php        # JSON-ответы и коды ошибок
│   ├── Auth.php            # JWT-подобная аутентификация (HS256)
│   └── Router.php          # Простой URL-роутер с :param
├── public/
│   └── index.php           # Единая точка входа (все эндпоинты)
├── router.php              # Файл роутера для php -S
├── schema.sql              # Схема БД + тестовые данные
├── composer.json
└── README.md
```

---

## Тестовые аккаунты

| Роль      | Email                      | Пароль   |
|-----------|----------------------------|----------|
| Admin     | admin@sky-booker.ru        | password |
| Employee  | employee@sky-booker.ru     | password |
| Passenger | passenger@sky-booker.ru    | password |
| Agent     | agent@sky-booker.ru        | password |

---

## API Reference

### Формат ответа

**Успех:**
```json
{ "field": "value", ... }
```

**Ошибка:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'email' is required",
    "details": {}
  },
  "timestamp": "2026-03-01T10:00:00+03:00"
}
```

Авторизованные запросы требуют заголовка:
```
Authorization: Bearer <accessToken>
```

---

### Auth

| Метод | Путь              | Описание               | Auth |
|-------|-------------------|------------------------|------|
| POST  | /api/auth/login   | Вход по email/password | —    |
| POST  | /api/auth/register| Регистрация            | —    |
| POST  | /api/auth/refresh | Обновить access token  | —    |

**POST /api/auth/login**
```json
{ "email": "passenger@sky-booker.ru", "password": "password" }
```
→ `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "user": {...} }`

---

### Users

| Метод | Путь                          | Описание             | Auth     |
|-------|-------------------------------|----------------------|----------|
| GET   | /api/users/:id                | Профиль пользователя | ✓        |
| PUT   | /api/users/:id                | Обновить профиль     | ✓        |
| POST  | /api/users/:id/change-password| Сменить пароль       | ✓ (owner)|

---

### Airports

| Метод | Путь          | Описание             | Auth |
|-------|---------------|----------------------|------|
| GET   | /api/airports | Список аэропортов    | —    |

---

### Flights

| Метод | Путь                        | Описание                    | Auth          |
|-------|-----------------------------|-----------------------------|---------------|
| POST  | /api/flights/search         | Поиск рейсов                | —             |
| GET   | /api/flights                | Список всех рейсов          | —             |
| GET   | /api/flights/:id            | Детали рейса                | —             |
| GET   | /api/flights/:id/seats      | Места на рейс               | —             |
| POST  | /api/flights                | Создать рейс                | employee/admin|
| PATCH | /api/flights/:id/status     | Обновить статус рейса       | employee/admin|

**POST /api/flights/search**
```json
{
  "originAirportCode": "SVO",
  "destinationAirportCode": "LED",
  "departureDate": "2026-03-01",
  "passengers": { "adults": 1, "children": 0, "infants": 0 }
}
```

---

### Bookings

| Метод  | Путь                       | Описание                  | Auth |
|--------|----------------------------|---------------------------|------|
| GET    | /api/bookings              | Мои бронирования          | ✓    |
| POST   | /api/bookings              | Создать бронирование      | ✓    |
| GET    | /api/bookings/:id          | Детали бронирования       | ✓    |
| PUT    | /api/bookings/:id          | Обновить бронирование     | ✓    |
| DELETE | /api/bookings/:id          | Отменить бронирование     | ✓    |
| POST   | /api/bookings/:id/services | Добавить услугу           | ✓    |

**POST /api/bookings**
```json
{
  "flightId": "flt-001",
  "fareId": "f001-eco",
  "passengers": [
    {
      "firstName": "Иван", "lastName": "Иванов",
      "dateOfBirth": "1990-05-10", "gender": "male",
      "documentType": "passport", "documentNumber": "4520123456",
      "documentExpiry": "2030-01-01", "nationality": "RU"
    }
  ]
}
```

---

### Payments

| Метод | Путь              | Описание            | Auth |
|-------|-------------------|---------------------|------|
| POST  | /api/payments     | Оплатить бронь      | ✓    |
| GET   | /api/payments/:id | Статус платежа      | ✓    |

**POST /api/payments**
```json
{
  "bookingId": "...",
  "method": "card",
  "cardDetails": {
    "number": "4111111111111111",
    "holderName": "IVAN IVANOV",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "cvv": "123"
  }
}
```

---

### Services

| Метод | Путь          | Описание              | Auth |
|-------|---------------|-----------------------|------|
| GET   | /api/services | Список доп. услуг     | —    |

Query params: `?fareClass=economy`

---

### Loyalty

| Метод | Путь                        | Описание                   | Auth |
|-------|-----------------------------|----------------------------|------|
| GET   | /api/loyalty/:userId        | Программа лояльности       | ✓    |
| POST  | /api/loyalty/earn-points    | Начислить баллы за рейс    | ✓    |

---

### Dashboard (employee / admin)

| Метод | Путь                        | Описание             | Auth          |
|-------|-----------------------------|----------------------|---------------|
| GET   | /api/dashboard/statistics   | Статистика системы   | employee/admin|

---

### Fares

| Метод | Путь       | Описание             | Auth          |
|-------|------------|----------------------|---------------|
| GET   | /api/fares | Тарифы (по flightId) | —             |
| POST  | /api/fares | Создать тариф        | employee/admin|

---

### Health

| Метод | Путь        | Описание    |
|-------|-------------|-------------|
| GET   | /api/health | Статус API  |

---

## Коды ошибок

| Код                 | HTTP | Описание                           |
|---------------------|------|------------------------------------|
| VALIDATION_ERROR    | 422  | Отсутствует обязательное поле      |
| INVALID_CREDENTIALS | 401  | Неверный email или пароль          |
| UNAUTHORIZED        | 401  | Токен отсутствует или истёк        |
| FORBIDDEN           | 403  | Недостаточно прав                  |
| NOT_FOUND           | 404  | Ресурс не найден                   |
| EMAIL_TAKEN         | 409  | Email уже зарегистрирован          |
| NO_SEATS            | 409  | Нет свободных мест                 |
| ALREADY_CANCELLED   | 400  | Бронь уже отменена                 |
| INVALID_STATUS      | 400  | Недопустимый статус                |
| DB_ERROR            | 500  | Ошибка базы данных                 |
| SERVER_ERROR        | 500  | Внутренняя ошибка сервера          |

---

## Расширение

### Добавить новый эндпоинт

Откройте `public/index.php` и добавьте в нужном разделе:

```php
$router->get('/api/passengers', function () {
    $db   = Database::getInstance();
    $rows = $db->query('SELECT * FROM users WHERE role = \'passenger\'')->fetchAll();
    Response::json(array_map(fn($u) => formatUser($u, $db), $rows));
});
```

### Добавить таблицу

1. Добавьте `CREATE TABLE` в `schema.sql`
2. Создайте helper-функцию `formatXxx()` в `public/index.php`
3. Добавьте CRUD-маршруты

---

## Безопасность

- Пароли хранятся в виде bcrypt-хэша (`password_hash` / `password_verify`)
- JWT-токены подписаны HMAC-SHA256 — смените `$secret` в `Auth.php` в продакшне
- Все SQL-запросы используют prepared statements — защита от SQL-инъекций
- CORS разрешает запросы только с `localhost:3000`; настройте для продакшна
