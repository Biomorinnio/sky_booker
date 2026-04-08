<?php
/**
 * Database configuration for Sky Booker backend
 * Adjust host/dbname/username/password to match your phpMyAdmin setup
 */
return [
    'host'     => 'localhost',
    'dbname'   => 'sky_booker',
    'username' => 'root',
    'password' => '',          
    'charset'  => 'utf8mb4',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],
];
