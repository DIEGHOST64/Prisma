<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;

class DeleteVacancyUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(string $uuid): bool
    {
        $vacancy = $this->vacancyRepository->findByUuid($uuid);
        
        if (!$vacancy) {
            throw new \RuntimeException('Vacancy not found');
        }

        return $this->vacancyRepository->delete($uuid);
    }
}
