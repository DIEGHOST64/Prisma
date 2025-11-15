<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Infrastructure\Persistence;

use PDO;
use DateTime;
use Prisma\Recruitment\Domain\Entities\Application;
use Prisma\Recruitment\Domain\Repositories\IApplicationRepository;
use Prisma\Recruitment\Infrastructure\Database\Database;

class PostgresApplicationRepository implements IApplicationRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(Application $application): Application
    {
        // Primero obtener el vacancy_id desde el uuid
        $sqlVacancy = "SELECT id FROM vacancies WHERE uuid = :uuid AND deleted_at IS NULL";
        $stmtVacancy = $this->db->prepare($sqlVacancy);
        $stmtVacancy->execute(['uuid' => $application->getVacancyUuid()]);
        $vacancyId = $stmtVacancy->fetchColumn();

        if (!$vacancyId) {
            throw new \RuntimeException('Vacancy not found');
        }

        $sql = "INSERT INTO applications (
            uuid, vacancy_id, vacancy_uuid, document_number, full_name,
            email, phone, cv_path, cover_letter, status, review_notes
        ) VALUES (
            :uuid, :vacancy_id, :vacancy_uuid, :document_number, :full_name,
            :email, :phone, :cv_path, :cover_letter, :status, :review_notes
        ) RETURNING id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'uuid' => $application->getUuid(),
            'vacancy_id' => $vacancyId,
            'vacancy_uuid' => $application->getVacancyUuid(),
            'document_number' => $application->getDocumentNumber(),
            'full_name' => $application->getFullName(),
            'email' => $application->getEmail(),
            'phone' => $application->getPhone(),
            'cv_path' => $application->getCvPath(),
            'cover_letter' => $application->getCoverLetter(),
            'status' => $application->getStatus(),
            'review_notes' => $application->getReviewNotes(),
        ]);

        return $application;
    }

    public function findByUuid(string $uuid): ?Application
    {
        $sql = "SELECT * FROM applications WHERE uuid = :uuid AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uuid' => $uuid]);
        
        $row = $stmt->fetch();
        
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findAll(int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM applications WHERE deleted_at IS NULL";
        
        if ($status !== null) {
            $sql .= " AND status = :status";
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        
        if ($status !== null) {
            $stmt->bindValue(':status', $status);
        }
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $applications = [];
        while ($row = $stmt->fetch()) {
            $applications[] = $this->mapToEntity($row);
        }
        
        return $applications;
    }

    public function findByVacancy(string $vacancyUuid, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM applications 
                WHERE vacancy_uuid = :vacancy_uuid AND deleted_at IS NULL
                ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':vacancy_uuid', $vacancyUuid);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $applications = [];
        while ($row = $stmt->fetch()) {
            $applications[] = $this->mapToEntity($row);
        }
        
        return $applications;
    }

    public function findByDocument(string $documentNumber): array
    {
        $sql = "SELECT * FROM applications 
                WHERE document_number = :document_number AND deleted_at IS NULL
                ORDER BY created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['document_number' => $documentNumber]);
        
        $applications = [];
        while ($row = $stmt->fetch()) {
            $applications[] = $this->mapToEntity($row);
        }
        
        return $applications;
    }

    public function checkDuplicateApplication(string $vacancyUuid, string $documentNumber): bool
    {
        $sql = "SELECT COUNT(*) FROM applications 
                WHERE vacancy_uuid = :vacancy_uuid 
                AND document_number = :document_number 
                AND deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'vacancy_uuid' => $vacancyUuid,
            'document_number' => $documentNumber,
        ]);
        
        return $stmt->fetchColumn() > 0;
    }

    public function update(Application $application): Application
    {
        $sql = "UPDATE applications SET
                status = :status,
                review_notes = :review_notes,
                updated_at = NOW()
                WHERE uuid = :uuid";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'uuid' => $application->getUuid(),
            'status' => $application->getStatus(),
            'review_notes' => $application->getReviewNotes(),
        ]);

        return $application;
    }

    public function delete(string $uuid): bool
    {
        $sql = "UPDATE applications SET deleted_at = NOW() WHERE uuid = :uuid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uuid' => $uuid]);
        
        return $stmt->rowCount() > 0;
    }

    public function countAll(?string $status = null): int
    {
        $sql = "SELECT COUNT(*) FROM applications WHERE deleted_at IS NULL";
        
        if ($status !== null) {
            $sql .= " AND status = :status";
        }
        
        $stmt = $this->db->prepare($sql);
        
        if ($status !== null) {
            $stmt->execute(['status' => $status]);
        } else {
            $stmt->execute();
        }
        
        return (int) $stmt->fetchColumn();
    }


    public function deleteByStatus(string $status): int
    {
        $sql = "DELETE FROM applications WHERE status = :status AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['status' => $status]);

        return $stmt->rowCount();
    }    public function countByVacancy(string $vacancyUuid): int
    {
        $sql = "SELECT COUNT(*) FROM applications 
                WHERE vacancy_uuid = :vacancy_uuid AND deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['vacancy_uuid' => $vacancyUuid]);
        
        return (int) $stmt->fetchColumn();
    }

    private function mapToEntity(array $row): Application
    {
        return new Application(
            uuid: $row['uuid'],
            vacancyUuid: $row['vacancy_uuid'],
            documentNumber: $row['document_number'],
            fullName: $row['full_name'],
            email: $row['email'],
            phone: $row['phone'],
            cvPath: $row['cv_path'],
            coverLetter: $row['cover_letter'] ?? '',
            status: $row['status'],
            reviewNotes: $row['review_notes'],
            createdAt: new DateTime($row['created_at']),
            updatedAt: new DateTime($row['updated_at']),
            deletedAt: $row['deleted_at'] ? new DateTime($row['deleted_at']) : null
        );
    }
}
