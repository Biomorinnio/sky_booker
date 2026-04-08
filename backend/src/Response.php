<?php
declare(strict_types=1);

/**
 * Вспомогательный класс для JSON-ответов
 * Все методы завершают выполнение скрипта через exit
 */
class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }

    public static function error(
        string  $code,
        string  $message,
        int     $status  = 400,
        ?array  $details = null
    ): never {
        $body = [
            'error' => [
                'code'    => $code,
                'message' => $message,
            ],
            'timestamp' => date('c'),
        ];
        if ($details !== null) {
            $body['error']['details'] = $details;
        }
        self::json($body, $status);
    }

    public static function notFound(string $message = 'Resource not found'): never
    {
        self::error('NOT_FOUND', $message, 404);
    }

    public static function unauthorized(string $message = 'Unauthorized'): never
    {
        self::error('UNAUTHORIZED', $message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): never
    {
        self::error('FORBIDDEN', $message, 403);
    }

    public static function serverError(string $message = 'Internal server error'): never
    {
        self::error('SERVER_ERROR', $message, 500);
    }
}
