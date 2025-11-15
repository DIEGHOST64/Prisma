<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Domain\Repositories;

use Prisma\Recruitment\Domain\Entities\Vacancy;

/**
 * Vacancy Repository Interface - Clean Architecture
 * 
 * Define el contrato para la persistencia de vacantes
 */
interface IVacancyRepository
{
    public function create(Vacancy $vacancy): Vacancy;
    public function findByUuid(string $uuid): ?Vacancy;
    public function findAll(int $page = 1, int $limit = 10, ?string $status = null): array;
    public function findActiveVacancies(): array;
    public function update(Vacancy $vacancy): Vacancy;
    public function delete(string $uuid): bool;
    public function countAll(?string $status = null): int;
}
