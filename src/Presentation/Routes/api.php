<?php

declare(strict_types=1);

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use Prisma\Recruitment\Presentation\Controllers\VacancyController;
use Prisma\Recruitment\Presentation\Controllers\ApplicationController;
use Prisma\Recruitment\Presentation\Controllers\AIController;
use Prisma\Recruitment\Presentation\Middleware\AuthMiddleware;
use Prisma\Recruitment\Presentation\Middleware\RoleMiddleware;

return function (App $app) {
    $container = $app->getContainer();

    $app->group('/api/v1', function (RouteCollectorProxy $group) use ($container) {
        //
        // VACANCIES - Rutas públicas
        //
        $group->get('/vacancies/active', [VacancyController::class, 'listActive']);
        $group->get('/vacancies/{uuid}', [VacancyController::class, 'getByUuid']);

        //
        // VACANCIES - Rutas protegidas (admin/recruiter)
        //
        $group->group('/vacancies', function (RouteCollectorProxy $vacancyGroup) {
            $vacancyGroup->post('', [VacancyController::class, 'create']);
            $vacancyGroup->get('', [VacancyController::class, 'listAll']);
            $vacancyGroup->put('/{uuid}', [VacancyController::class, 'update']);
            $vacancyGroup->delete('/{uuid}', [VacancyController::class, 'delete']);
        })->add(new RoleMiddleware(['admin', 'recruiter']))
          ->add(AuthMiddleware::class);

        //
        // APPLICATIONS - Rutas públicas
        //
        $group->post('/applications', [ApplicationController::class, 'submit']);
        $group->get('/applications/status/{document}', [ApplicationController::class, 'checkStatus']);

        //
        // APPLICATIONS - Rutas protegidas (admin/recruiter)
        //
        $group->group('/applications', function (RouteCollectorProxy $appGroup) {
            $appGroup->get('', [ApplicationController::class, 'listAll']);
            $appGroup->patch('/{uuid}/status', [ApplicationController::class, 'updateStatus']);
            $appGroup->delete('/{uuid}', [ApplicationController::class, 'deleteOne']);
            $appGroup->post('/bulk-delete', [ApplicationController::class, 'deleteBulk']);
        })->add(new RoleMiddleware(['admin', 'recruiter']))
          ->add(AuthMiddleware::class);

        //
        // AI - Ruta pública para mejorar textos
        //
        $group->post('/ai/improve-text', [AIController::class, 'improveText']);
    });
};