<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Domain\Entities;

use DateTime;
use InvalidArgumentException;

/**
 * Vacancy Entity - Clean Architecture
 * 
 * Representa una vacante de empleo en el sistema
 */
class Vacancy
{
    private string $uuid;
    private string $title;
    private string $description;
    private string $requirements;
    private string $location;
    private string $salaryRange;
    private string $employmentType; // full-time, part-time, contract
    private string $status; // draft, published, closed, filled
    private ?DateTime $publishedAt;
    private DateTime $expiresAt;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        string $uuid,
        string $title,
        string $description,
        string $requirements,
        string $location,
        string $salaryRange,
        string $employmentType,
        string $status = 'draft',
        ?DateTime $publishedAt = null,
        ?DateTime $expiresAt = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null,
        ?DateTime $deletedAt = null
    ) {
        $this->validateTitle($title);
        $this->validateDescription($description);
        $this->validateEmploymentType($employmentType);
        $this->validateStatus($status);

        $this->uuid = $uuid;
        $this->title = $title;
        $this->description = $description;
        $this->requirements = $requirements;
        $this->location = $location;
        $this->salaryRange = $salaryRange;
        $this->employmentType = $employmentType;
        $this->status = $status;
        $this->publishedAt = $publishedAt;
        $this->expiresAt = $expiresAt ?? new DateTime('+30 days');
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
        $this->deletedAt = $deletedAt;
    }

    // Validations
    private function validateTitle(string $title): void
    {
        if (strlen($title) < 5 || strlen($title) > 200) {
            throw new InvalidArgumentException('Title must be between 5 and 200 characters');
        }
    }

    private function validateDescription(string $description): void
    {
        if (strlen($description) < 20) {
            throw new InvalidArgumentException('Description must be at least 20 characters');
        }
    }

    private function validateEmploymentType(string $type): void
    {
        $validTypes = ['full-time', 'part-time', 'contract', 'internship'];
        if (!in_array($type, $validTypes)) {
            throw new InvalidArgumentException('Invalid employment type');
        }
    }

    private function validateStatus(string $status): void
    {
        $validStatuses = ['draft', 'published', 'closed', 'filled'];
        if (!in_array($status, $validStatuses)) {
            throw new InvalidArgumentException('Invalid status');
        }
    }

    // Business Logic
    public function publish(): void
    {
        if ($this->status === 'published') {
            throw new InvalidArgumentException('Vacancy is already published');
        }
        
        $this->status = 'published';
        $this->publishedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function close(): void
    {
        if ($this->status === 'closed' || $this->status === 'filled') {
            throw new InvalidArgumentException('Vacancy is already closed or filled');
        }
        
        $this->status = 'closed';
        $this->updatedAt = new DateTime();
    }

    public function markAsFilled(): void
    {
        $this->status = 'filled';
        $this->updatedAt = new DateTime();
    }

    public function activate(): void
    {
        $this->status = 'published';
        if (!$this->publishedAt) {
            $this->publishedAt = new DateTime();
        }
        $this->updatedAt = new DateTime();
    }

    public function deactivate(): void
    {
        $this->status = 'closed';
        $this->updatedAt = new DateTime();
    }

    public function isActive(): bool
    {
        return $this->status === 'published' 
            && $this->expiresAt > new DateTime()
            && $this->deletedAt === null;
    }

    public function isExpired(): bool
    {
        return $this->expiresAt < new DateTime();
    }

    public function canAcceptApplications(): bool
    {
        return $this->isActive() && !$this->isExpired();
    }

    public function softDelete(): void
    {
        $this->deletedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getUuid(): string { return $this->uuid; }
    public function getTitle(): string { return $this->title; }
    public function getDescription(): string { return $this->description; }
    public function getRequirements(): string { return $this->requirements; }
    public function getLocation(): string { return $this->location; }
    public function getSalaryRange(): string { return $this->salaryRange; }
    public function getEmploymentType(): string { return $this->employmentType; }
    public function getStatus(): string { return $this->status; }
    public function getPublishedAt(): ?DateTime { return $this->publishedAt; }
    public function getExpiresAt(): DateTime { return $this->expiresAt; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }
    public function getDeletedAt(): ?DateTime { return $this->deletedAt; }

    // Setters (solo para actualización)
    public function updateTitle(string $title): void
    {
        $this->validateTitle($title);
        $this->title = $title;
        $this->updatedAt = new DateTime();
    }

    public function updateDescription(string $description): void
    {
        $this->validateDescription($description);
        $this->description = $description;
        $this->updatedAt = new DateTime();
    }

    public function updateRequirements(string $requirements): void
    {
        $this->requirements = $requirements;
        $this->updatedAt = new DateTime();
    }

    public function updateLocation(string $location): void
    {
        $this->location = $location;
        $this->updatedAt = new DateTime();
    }

    public function updateSalaryRange(string $salaryRange): void
    {
        $this->salaryRange = $salaryRange;
        $this->updatedAt = new DateTime();
    }

    public function updateEmploymentType(string $employmentType): void
    {
        $this->validateEmploymentType($employmentType);
        $this->employmentType = $employmentType;
        $this->updatedAt = new DateTime();
    }

    public function updateDetails(
        string $title,
        string $description,
        string $requirements,
        string $location,
        string $salaryRange,
        string $employmentType
    ): void {
        $this->validateTitle($title);
        $this->validateDescription($description);
        $this->validateEmploymentType($employmentType);

        $this->title = $title;
        $this->description = $description;
        $this->requirements = $requirements;
        $this->location = $location;
        $this->salaryRange = $salaryRange;
        $this->employmentType = $employmentType;
        $this->updatedAt = new DateTime();
    }

    public function toArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'location' => $this->location,
            'salaryRange' => $this->salaryRange,
            'employmentType' => $this->employmentType,
            'status' => $this->status,
            'isActive' => $this->status === 'published',
            'publishedAt' => $this->publishedAt?->format('Y-m-d H:i:s'),
            'expiresAt' => $this->expiresAt->format('Y-m-d H:i:s'),
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s'),
            'deletedAt' => $this->deletedAt?->format('Y-m-d H:i:s'),
        ];
    }
}
