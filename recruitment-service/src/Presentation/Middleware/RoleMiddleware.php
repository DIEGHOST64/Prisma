<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class RoleMiddleware implements MiddlewareInterface
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles)
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // En producción, aquí extraerías el rol del JWT y verificarías
        // Por ahora, permitimos el acceso si hay token (validado por AuthMiddleware)
        return $handler->handle($request);
    }
}