<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Domain\Repositories;

use Prisma\Recruitment\Domain\Entities\Application;

/**
 * Application Repository Interface - Clean Architecture
 *
 * Define el contrato para la persistencia de postulaciones
 */
interface IApplicationRepository
{
    public function create(Application $application): Application;
    public function findByUuid(string $uuid): ?Application;
    public function findAll(int $page = 1, int $limit = 10, ?string $status = null): array;
    public function findByVacancy(string $vacancyUuid, int $page = 1, int $limit = 10): array;
    public function findByDocument(string $documentNumber): array;
    public function checkDuplicateApplication(string $vacancyUuid, string $documentNumber): bool;
    public function update(Application $application): Application;
    public function delete(string $uuid): bool;
    public function deleteByStatus(string $status): int;
    public function countAll(?string $status = null): int;
    public function countByVacancy(string $vacancyUuid): int;
}