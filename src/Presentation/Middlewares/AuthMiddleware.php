<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Prisma\Recruitment\Infrastructure\Auth\JWTService;

class AuthMiddleware
{
    private JWTService $jwtService;

    public function __construct(JWTService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            $response = new \Slim\Psr7\Response();
            $error = json_encode([
                'success' => false,
                'error' => 'Authorization header missing',
            ]);
            $response->getBody()->write($error);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = $this->jwtService->extractTokenFromHeader($authHeader);

        if (!$token) {
            $response = new \Slim\Psr7\Response();
            $error = json_encode([
                'success' => false,
                'error' => 'Invalid authorization header format',
            ]);
            $response->getBody()->write($error);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        try {
            $payload = $this->jwtService->verify($token);
            
            // Agregar el payload al request para usarlo en los controladores
            $request = $request->withAttribute('user', $payload);
            
            return $handler->handle($request);
        } catch (\Exception $e) {
            $response = new \Slim\Psr7\Response();
            $error = json_encode([
                'success' => false,
                'error' => 'Unauthorized: ' . $e->getMessage(),
            ]);
            $response->getBody()->write($error);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }
}
