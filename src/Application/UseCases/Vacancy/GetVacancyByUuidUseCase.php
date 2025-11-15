<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Domain\Entities\Vacancy;

class GetVacancyByUuidUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(string $uuid): ?Vacancy
    {
        return $this->vacancyRepository->findByUuid($uuid);
    }
}
