<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Vacancy;

use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Domain\Entities\Vacancy;

class UpdateVacancyUseCase
{
    private IVacancyRepository $vacancyRepository;

    public function __construct(IVacancyRepository $vacancyRepository)
    {
        $this->vacancyRepository = $vacancyRepository;
    }

    public function execute(string $uuid, array $data): ?Vacancy
    {
        $vacancy = $this->vacancyRepository->findByUuid($uuid);
        
        if (!$vacancy) {
            throw new \RuntimeException('Vacancy not found');
        }

        // Update fields if provided
        if (isset($data['title'])) {
            $vacancy->updateTitle($data['title']);
        }
        
        if (isset($data['description'])) {
            $vacancy->updateDescription($data['description']);
        }
        
        if (isset($data['location'])) {
            $vacancy->updateLocation($data['location']);
        }
        
        if (isset($data['employmentType'])) {
            $vacancy->updateEmploymentType($data['employmentType']);
        }
        
        if (isset($data['salaryRange'])) {
            $vacancy->updateSalaryRange($data['salaryRange']);
        }
        
        if (isset($data['requirements'])) {
            $vacancy->updateRequirements($data['requirements']);
        }
        
        if (isset($data['isActive'])) {
            if ($data['isActive']) {
                $vacancy->activate();
            } else {
                $vacancy->deactivate();
            }
        }

        $this->vacancyRepository->update($vacancy);

        return $vacancy;
    }
}
