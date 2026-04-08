<?php
declare(strict_types=1);

/**
 * Простая JWT-подобная аутентификация (HS256) без внешних библиотек
 *
 * Формат токена: base64(header).base64(payload).base64(signature)
 * Сигнатура: HMAC-SHA256(header.payload, SECRET)
 */
class Auth
{
    // Поменяйте на длинную случайную строку в продакшне
    private static string $secret       = 'sky-booker-super-secret-key-change-in-production-2026';
    private static int    $accessTTL    = 3600;       // 1 час
    private static int    $refreshTTL   = 2592000;    // 30 дней

    public static function generateAccessToken(array $payload): string
    {
        return self::encode($payload, self::$accessTTL);
    }

    public static function generateRefreshToken(array $payload): string
    {
        return self::encode($payload, self::$refreshTTL);
    }

    private static function encode(array $payload, int $ttl): string
    {
        $header  = self::b64(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;
        $body    = self::b64(json_encode($payload));
        $sig     = self::b64(hash_hmac('sha256', "$header.$body", self::$secret, true));
        return "$header.$body.$sig";
    }

    public static function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $sig] = $parts;
        $expected = self::b64(hash_hmac('sha256', "$header.$body", self::$secret, true));
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        $data = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
        if (!$data || ($data['exp'] ?? 0) < time()) {
            return null;
        }
        return $data;
    }

    public static function getTokenFromRequest(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
            return $m[1];
        }
        return null;
    }

    /**
     * Требует валидный токен, возвращает payload или завершает запрос с 401
     */
    public static function requireAuth(): array
    {
        $token = self::getTokenFromRequest();
        if (!$token) {
            Response::unauthorized('Authentication token required');
        }
        $payload = self::validateToken($token);
        if (!$payload) {
            Response::unauthorized('Invalid or expired token');
        }
        return $payload;
    }

    /**
     * Требует одну из перечисленных ролей, иначе 403
     */
    public static function requireRole(string ...$roles): array
    {
        $payload = self::requireAuth();
        if (!in_array($payload['role'] ?? '', $roles, true)) {
            Response::forbidden('Insufficient permissions for this action');
        }
        return $payload;
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
