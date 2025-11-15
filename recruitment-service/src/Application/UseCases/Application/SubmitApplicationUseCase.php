<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Application;

use Ramsey\Uuid\Uuid;
use Prisma\Recruitment\Domain\Entities\Application;
use Prisma\Recruitment\Domain\Repositories\IApplicationRepository;
use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Infrastructure\Queue\QueueService;
use RuntimeException;

class SubmitApplicationUseCase
{
    private IApplicationRepository $applicationRepository;
    private IVacancyRepository $vacancyRepository;
    private QueueService $queueService;

    public function __construct(
        IApplicationRepository $applicationRepository,
        IVacancyRepository $vacancyRepository
    ) {
        $this->applicationRepository = $applicationRepository;
        $this->vacancyRepository = $vacancyRepository;
        $this->queueService = new QueueService();
    }

    public function execute(array $data): Application
    {
        // Verificar que la vacante existe y acepta postulaciones
        $vacancy = $this->vacancyRepository->findByUuid($data['vacancyUuid']);
        
        if (!$vacancy) {
            throw new RuntimeException('Vacancy not found');
        }

        if (!$vacancy->canAcceptApplications()) {
            throw new RuntimeException('This vacancy is not accepting applications');
        }

        // Verificar duplicados
        $isDuplicate = $this->applicationRepository->checkDuplicateApplication(
            $data['vacancyUuid'],
            $data['documentNumber']
        );

        if ($isDuplicate) {
            throw new RuntimeException('You have already applied to this vacancy');
        }

        // Crear la postulación
        $application = new Application(
            uuid: Uuid::uuid4()->toString(),
            vacancyUuid: $data['vacancyUuid'],
            documentNumber: $data['documentNumber'],
            fullName: $data['fullName'],
            email: $data['email'],
            phone: $data['phone'],
            cvPath: $data['cvPath'], // Será generado por el Document Service
            coverLetter: $data['coverLetter'] ?? ''
        );

        $createdApplication = $this->applicationRepository->create($application);

        // Encolar email de confirmación
        try {
            $this->queueService->enqueueEmail([
                'type' => 'application_confirmation',
                'to' => $data['email'],
                'applicantName' => $data['fullName'],
                'vacancyTitle' => $vacancy->getTitle(),
                'priority' => 1,
            ]);
        } catch (\Exception $e) {
            // Log del error pero no fallar la operación
            error_log("Error al encolar email de confirmación: " . $e->getMessage());
        }

        return $createdApplication;
    }
}
