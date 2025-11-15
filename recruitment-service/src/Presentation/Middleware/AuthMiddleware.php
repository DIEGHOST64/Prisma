<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class AuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            $response = new Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Unauthorized - No token provided'
            ]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        // En producción, aquí validarías el JWT
        // Por ahora, solo verificamos que exista el token
        return $handler->handle($request);
    }
}