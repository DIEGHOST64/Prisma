<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;

class ListVacanciesUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $vacancies = $this->vacancyRepository->findAll($page, $limit, $status);
        $total = $this->vacancyRepository->countAll($status);

        return [
            'vacancies' => array_map(fn($v) => $v->toArray(), $vacancies),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit),
            ],
        ];
    }
}
