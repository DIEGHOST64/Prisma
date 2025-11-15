<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Ramsey\Uuid\Uuid;
use Prisma\Recruitment\Domain\Entities\Vacancy;
use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;

class CreateVacancyUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(array $data): Vacancy
    {
        $vacancy = new Vacancy(
            uuid: Uuid::uuid4()->toString(),
            title: $data['title'],
            description: $data['description'],
            requirements: $data['requirements'],
            location: $data['location'],
            salaryRange: $data['salaryRange'] ?? '',
            employmentType: $data['employmentType'],
            status: $data['status'] ?? 'draft'
        );

        return $this->vacancyRepository->create($vacancy);
    }
}
