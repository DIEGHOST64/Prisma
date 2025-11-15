<?php

declare(strict_types=1);

use DI\Container;
use Prisma\Recruitment\Infrastructure\Database\Database;
use Prisma\Recruitment\Infrastructure\Auth\JWTService;
use Prisma\Recruitment\Infrastructure\Persistence\PostgresVacancyRepository;
use Prisma\Recruitment\Infrastructure\Persistence\PostgresApplicationRepository;
use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Domain\Repositories\IApplicationRepository;
use Prisma\Recruitment\Application\UseCases\Vacancy\CreateVacancyUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\ListVacanciesUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\GetActiveVacanciesUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\GetVacancyByUuidUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\UpdateVacancyUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\DeleteVacancyUseCase;
use Prisma\Recruitment\Application\UseCases\Application\SubmitApplicationUseCase;
use Prisma\Recruitment\Application\UseCases\Application\UpdateApplicationStatusUseCase;
use Prisma\Recruitment\Presentation\Controllers\VacancyController;
use Prisma\Recruitment\Presentation\Controllers\ApplicationController;
use Prisma\Recruitment\Presentation\Controllers\AIController;
use Prisma\Recruitment\Presentation\Middlewares\AuthMiddleware;

$container = new Container();

// Database
$container->set('db', function () {
    return Database::getConnection();
});

// Repositories
$container->set(IVacancyRepository::class, function () {
    return new PostgresVacancyRepository();
});

$container->set(IApplicationRepository::class, function () {
    return new PostgresApplicationRepository();
});

// Services
$container->set(JWTService::class, function () {
    return new JWTService();
});

// Use Cases - Vacancy
$container->set(CreateVacancyUseCase::class, function (Container $c) {
    return new CreateVacancyUseCase($c->get(IVacancyRepository::class));
});

$container->set(ListVacanciesUseCase::class, function (Container $c) {
    return new ListVacanciesUseCase($c->get(IVacancyRepository::class));
});

$container->set(GetActiveVacanciesUseCase::class, function (Container $c) {
    return new GetActiveVacanciesUseCase($c->get(IVacancyRepository::class));
});

$container->set(GetVacancyByUuidUseCase::class, function (Container $c) {
    return new GetVacancyByUuidUseCase($c->get(IVacancyRepository::class));
});

$container->set(UpdateVacancyUseCase::class, function (Container $c) {
    return new UpdateVacancyUseCase($c->get(IVacancyRepository::class));
});

$container->set(DeleteVacancyUseCase::class, function (Container $c) {
    return new DeleteVacancyUseCase($c->get(IVacancyRepository::class));
});

// Use Cases - Application
$container->set(SubmitApplicationUseCase::class, function (Container $c) {
    return new SubmitApplicationUseCase(
        $c->get(IApplicationRepository::class),
        $c->get(IVacancyRepository::class)
    );
});

$container->set(UpdateApplicationStatusUseCase::class, function (Container $c) {
    return new UpdateApplicationStatusUseCase($c->get(IApplicationRepository::class), $c->get(IVacancyRepository::class));
});

// Controllers
$container->set(VacancyController::class, function (Container $c) {
    return new VacancyController(
        $c->get(CreateVacancyUseCase::class),
        $c->get(ListVacanciesUseCase::class),
        $c->get(GetActiveVacanciesUseCase::class),
        $c->get(GetVacancyByUuidUseCase::class),
        $c->get(UpdateVacancyUseCase::class),
        $c->get(DeleteVacancyUseCase::class)
    );
});

$container->set(ApplicationController::class, function (Container $c) {
    return new ApplicationController(
        $c->get(SubmitApplicationUseCase::class),
        $c->get(UpdateApplicationStatusUseCase::class),
        $c->get(IApplicationRepository::class)
    );
});

$container->set(AIController::class, function (Container $c) {
    return new AIController();
});

// Middlewares
$container->set(AuthMiddleware::class, function (Container $c) {
    return new AuthMiddleware($c->get(JWTService::class));
});

return $container;





