<?php
/**
 * PHP Built-in Server Router
 *
 * Запуск: php -S localhost:3001 router.php
 *
 * Этот файл используется встроенным сервером PHP как точка входа.
 * Статические файлы из public/ отдаются напрямую,
 * все остальные запросы маршрутизируются через public/index.php
 */

// Путь к запрошенному файлу относительно public/
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . '/public' . $uri;

// Если это реальный статический файл — отдать как есть
if ($uri !== '/' && is_file($file)) {
    return false;
}

// Иначе — передать управление API
require __DIR__ . '/public/index.php';
