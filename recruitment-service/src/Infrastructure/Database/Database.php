<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Infrastructure\Database;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Database Connection - PostgreSQL
 * 
 * Maneja la conexión a PostgreSQL usando PDO
 */
class Database
{
    private static ?PDO $connection = null;

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            try {
                $host = $_ENV['DB_HOST'] ?? 'localhost';
                $port = $_ENV['DB_PORT'] ?? '5432';
                $dbname = $_ENV['DB_NAME'] ?? 'recruitment_db';
                $user = $_ENV['DB_USER'] ?? 'postgres';
                $password = $_ENV['DB_PASSWORD'] ?? 'postgres';

                $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
                
                self::$connection = new PDO($dsn, $user, $password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);

                error_log("✅ PostgreSQL connected successfully");
            } catch (PDOException $e) {
                error_log("❌ Database connection failed: " . $e->getMessage());
                throw new RuntimeException("Database connection failed: " . $e->getMessage());
            }
        }

        return self::$connection;
    }

    public static function closeConnection(): void
    {
        self::$connection = null;
    }
}
