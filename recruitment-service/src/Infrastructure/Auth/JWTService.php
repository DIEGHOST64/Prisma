<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Infrastructure\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;

/**
 * JWT Service - Verificación de tokens
 * 
 * Verifica tokens JWT emitidos por el Auth Service
 */
class JWTService
{
    private string $secret;

    public function __construct()
    {
        $this->secret = $_ENV['JWT_SECRET'] ?? throw new RuntimeException('JWT_SECRET not configured');
    }

    /**
     * Verificar y decodificar un token JWT
     * 
     * @param string $token Token JWT a verificar
     * @return object Payload del token decodificado
     * @throws RuntimeException Si el token es inválido
     */
    public function verify(string $token): object
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return $decoded;
        } catch (\Exception $e) {
            throw new RuntimeException('Invalid or expired token: ' . $e->getMessage());
        }
    }

    /**
     * Extraer token del header Authorization
     * 
     * @param string $authHeader Header de autorización
     * @return string|null Token extraído o null
     */
    public function extractTokenFromHeader(string $authHeader): ?string
    {
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Verificar si el usuario tiene un rol específico
     * 
     * @param object $payload Payload del token
     * @param string $requiredRole Rol requerido
     * @return bool
     */
    public function hasRole(object $payload, string $requiredRole): bool
    {
        return isset($payload->role) && $payload->role === $requiredRole;
    }

    /**
     * Verificar si el usuario tiene uno de varios roles
     * 
     * @param object $payload Payload del token
     * @param array $allowedRoles Roles permitidos
     * @return bool
     */
    public function hasAnyRole(object $payload, array $allowedRoles): bool
    {
        return isset($payload->role) && in_array($payload->role, $allowedRoles);
    }
}
