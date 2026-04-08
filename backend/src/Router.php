<?php
declare(strict_types=1);

/**
 * Минималистичный HTTP-роутер с поддержкой именованных сегментов (:param)
 *
 * Пример:
 *   $router->get('/api/flights/:id', fn($p) => ...);
 *   $router->dispatch('GET', '/api/flights/abc-123');
 */
class Router
{
    /** @var array<int, array{0:string, 1:string, 2:callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void
    {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    private function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [$method, $pattern, $handler];
    }

    public function dispatch(string $method, string $uri): void
    {
        // Strip query string
        $uri = strtok($uri, '?') ?: '/';

        foreach ($this->routes as [$routeMethod, $pattern, $handler]) {
            if ($routeMethod !== $method) {
                continue;
            }
            // Convert :param segments to named capture groups
            $regex = preg_replace('/\/:([a-zA-Z_][a-zA-Z0-9_]*)/', '/(?P<$1>[^/]+)', $pattern);
            if (preg_match('#^' . $regex . '$#', $uri, $matches)) {
                // Keep only string (named) keys
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $handler($params);
                return;
            }
        }

        Response::error('ROUTE_NOT_FOUND', "Cannot $method $uri", 404);
    }
}
