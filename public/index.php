<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Cargar contenedor de dependencias
$container = require __DIR__ . '/../src/Infrastructure/Config/container.php';

// Configurar Slim con DI
AppFactory::setContainer($container);
$app = AppFactory::create();

// CORS Middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// Add Routing Middleware
$app->addRoutingMiddleware();

// JSON Body Parsing Middleware
$app->add(function (Request $request, $handler) {
    $contentType = $request->getHeaderLine('Content-Type');
    
    if (str_contains($contentType, 'application/json')) {
        $contents = (string) $request->getBody();
        
        if (!empty($contents)) {
            $parsedBody = json_decode($contents, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                $request = $request->withParsedBody($parsedBody);
            }
        }
    }
    
    return $handler->handle($request);
});

// Cargar rutas
$routes = require __DIR__ . '/../src/Presentation/Routes/api.php';
$routes($app);

// Error Middleware
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

$app->run();
