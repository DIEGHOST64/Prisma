<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Application\UseCases\Application;

use Prisma\Recruitment\Domain\Repositories\IApplicationRepository;
use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Infrastructure\Queue\QueueService;
use RuntimeException;

class UpdateApplicationStatusUseCase
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

    public function execute(string $uuid, string $status, ?string $notes = null): array
    {
        $application = $this->applicationRepository->findByUuid($uuid);

        if (!$application) {
            throw new RuntimeException("Application not found");
        }

        // Obtener información de la vacante para el email
        $vacancy = $this->vacancyRepository->findByUuid($application->getVacancyUuid());
        $vacancyTitle = $vacancy ? $vacancy->getTitle() : "Vacante";

        // Map de estados para emails
        $statusMap = [
            "pending" => "Recibido",
            "reviewing" => "En revisión",
            "interviewed" => "Entrevista programada",
            "accepted" => "Aceptado",
            "rejected" => "Rechazado",
        ];

        // Actualizar según el estado
        switch ($status) {
            case "pending":
                $application->markAsPending($notes ?? "");
                break;
            case "reviewing":
                $application->startReview($notes ?? "");
                break;
            case "interviewed":
                $application->markAsInterviewed($notes ?? "");
                break;
            case "accepted":
                $application->accept($notes ?? "");
                break;
            case "rejected":
                $application->reject($notes ?? "Application rejected");
                break;
            default:
                throw new RuntimeException("Invalid status");
        }

        $updated = $this->applicationRepository->update($application);

        // Encolar email de notificaci�n de cambio de estado
        try {
            $this->queueService->enqueueEmail([
                "type" => "status_update",
                "to" => $application->getEmail(),
                "applicantName" => $application->getFullName(),
                "vacancyTitle" => $vacancyTitle,
                "newStatus" => $statusMap[$status] ?? $status,
                "priority" => 2,
            ]);
        } catch (\Exception $e) {
            error_log("Error al encolar email de actualizaci�n: " . $e->getMessage());
        }

        return $updated->toArray();
    }
}
