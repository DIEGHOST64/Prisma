<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Infrastructure\Persistence;

use PDO;
use DateTime;
use Prisma\Recruitment\Domain\Entities\Vacancy;
use Prisma\Recruitment\Domain\Repositories\IVacancyRepository;
use Prisma\Recruitment\Infrastructure\Database\Database;

class PostgresVacancyRepository implements IVacancyRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(Vacancy $vacancy): Vacancy
    {
        $sql = "INSERT INTO vacancies (
            uuid, title, description, requirements, location, 
            salary_range, employment_type, status, published_at, expires_at
        ) VALUES (
            :uuid, :title, :description, :requirements, :location,
            :salary_range, :employment_type, :status, :published_at, :expires_at
        ) RETURNING id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'uuid' => $vacancy->getUuid(),
            'title' => $vacancy->getTitle(),
            'description' => $vacancy->getDescription(),
            'requirements' => $vacancy->getRequirements(),
            'location' => $vacancy->getLocation(),
            'salary_range' => $vacancy->getSalaryRange(),
            'employment_type' => $vacancy->getEmploymentType(),
            'status' => $vacancy->getStatus(),
            'published_at' => $vacancy->getPublishedAt()?->format('Y-m-d H:i:s'),
            'expires_at' => $vacancy->getExpiresAt()->format('Y-m-d H:i:s'),
        ]);

        return $vacancy;
    }

    public function findByUuid(string $uuid): ?Vacancy
    {
        $sql = "SELECT * FROM vacancies WHERE uuid = :uuid AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uuid' => $uuid]);
        
        $row = $stmt->fetch();
        
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findAll(int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM vacancies WHERE deleted_at IS NULL";
        
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
        
        $vacancies = [];
        while ($row = $stmt->fetch()) {
            $vacancies[] = $this->mapToEntity($row);
        }
        
        return $vacancies;
    }

    public function findActiveVacancies(): array
    {
        $sql = "SELECT * FROM vacancies 
                WHERE status = 'published' 
                AND expires_at > NOW() 
                AND deleted_at IS NULL 
                ORDER BY published_at DESC";
        
        $stmt = $this->db->query($sql);
        
        $vacancies = [];
        while ($row = $stmt->fetch()) {
            $vacancies[] = $this->mapToEntity($row);
        }
        
        return $vacancies;
    }

    public function update(Vacancy $vacancy): Vacancy
    {
        $sql = "UPDATE vacancies SET
                title = :title,
                description = :description,
                requirements = :requirements,
                location = :location,
                salary_range = :salary_range,
                employment_type = :employment_type,
                status = :status,
                published_at = :published_at,
                expires_at = :expires_at,
                updated_at = NOW()
                WHERE uuid = :uuid";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'uuid' => $vacancy->getUuid(),
            'title' => $vacancy->getTitle(),
            'description' => $vacancy->getDescription(),
            'requirements' => $vacancy->getRequirements(),
            'location' => $vacancy->getLocation(),
            'salary_range' => $vacancy->getSalaryRange(),
            'employment_type' => $vacancy->getEmploymentType(),
            'status' => $vacancy->getStatus(),
            'published_at' => $vacancy->getPublishedAt()?->format('Y-m-d H:i:s'),
            'expires_at' => $vacancy->getExpiresAt()->format('Y-m-d H:i:s'),
        ]);

        return $vacancy;
    }

    public function delete(string $uuid): bool
    {
        $sql = "UPDATE vacancies SET deleted_at = NOW() WHERE uuid = :uuid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uuid' => $uuid]);
        
        return $stmt->rowCount() > 0;
    }

    public function countAll(?string $status = null): int
    {
        $sql = "SELECT COUNT(*) FROM vacancies WHERE deleted_at IS NULL";
        
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

    private function mapToEntity(array $row): Vacancy
    {
        return new Vacancy(
            uuid: $row['uuid'],
            title: $row['title'],
            description: $row['description'],
            requirements: $row['requirements'],
            location: $row['location'],
            salaryRange: $row['salary_range'],
            employmentType: $row['employment_type'],
            status: $row['status'],
            publishedAt: $row['published_at'] ? new DateTime($row['published_at']) : null,
            expiresAt: new DateTime($row['expires_at']),
            createdAt: new DateTime($row['created_at']),
            updatedAt: new DateTime($row['updated_at']),
            deletedAt: $row['deleted_at'] ? new DateTime($row['deleted_at']) : null
        );
    }
}
