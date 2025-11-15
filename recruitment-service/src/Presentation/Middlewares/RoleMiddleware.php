<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class RoleMiddleware
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles)
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user || !isset($user->role)) {
            $response = new \Slim\Psr7\Response();
            $error = json_encode([
                'success' => false,
                'error' => 'User information not found',
            ]);
            $response->getBody()->write($error);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        if (!in_array($user->role, $this->allowedRoles)) {
            $response = new \Slim\Psr7\Response();
            $error = json_encode([
                'success' => false,
                'error' => 'Insufficient permissions',
            ]);
            $response->getBody()->write($error);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        return $handler->handle($request);
    }
}
