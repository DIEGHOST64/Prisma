<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;

class GetActiveVacanciesUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(): array
    {
        $vacancies = $this->vacancyRepository->findActiveVacancies();

        return [
            'vacancies' => array_map(fn($v) => $v->toArray(), $vacancies),
            'total' => count($vacancies),
        ];
    }
}
