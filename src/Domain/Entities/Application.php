<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Domain\Entities;

use DateTime;
use InvalidArgumentException;

/**
 * Application Entity - Clean Architecture
 *
 * Representa una postulación de un candidato a una vacante
 */
class Application
{
    private string $uuid;
    private string $vacancyUuid;
    private string $documentNumber;
    private string $fullName;
    private string $email;
    private string $phone;
    private string $cvPath;
    private string $coverLetter;
    private string $status;
    private ?string $reviewNotes;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        string $uuid,
        string $vacancyUuid,
        string $documentNumber,
        string $fullName,
        string $email,
        string $phone,
        string $cvPath,
        string $coverLetter = '',
        string $status = 'pending',
        ?string $reviewNotes = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null,
        ?DateTime $deletedAt = null
    ) {
        $this->validateDocumentNumber($documentNumber);
        $this->validateFullName($fullName);
        $this->validateEmail($email);
        $this->validatePhone($phone);
        $this->validateStatus($status);

        $this->uuid = $uuid;
        $this->vacancyUuid = $vacancyUuid;
        $this->documentNumber = $documentNumber;
        $this->fullName = $fullName;
        $this->email = $email;
        $this->phone = $phone;
        $this->cvPath = $cvPath;
        $this->coverLetter = $coverLetter;
        $this->status = $status;
        $this->reviewNotes = $reviewNotes;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
        $this->deletedAt = $deletedAt;
    }

    // Validations
    private function validateDocumentNumber(string $document): void
    {
        if (strlen($document) < 5 || strlen($document) > 20) {
            throw new InvalidArgumentException('Document number must be between 5 and 20 characters');
        }
    }

    private function validateFullName(string $name): void
    {
        if (strlen($name) < 3 || strlen($name) > 100) {
            throw new InvalidArgumentException('Full name must be between 3 and 100 characters');
        }
    }

    private function validateEmail(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }
    }

    private function validatePhone(string $phone): void
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleaned) < 7 || strlen($cleaned) > 15) {
            throw new InvalidArgumentException('Invalid phone number');
        }
    }

    private function validateStatus(string $status): void
    {
        $validStatuses = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];
        if (!in_array($status, $validStatuses)) {
            throw new InvalidArgumentException('Invalid application status');
        }
    }

    // Business Logic - Fully flexible transitions
    public function markAsPending(string $notes = ''): void
    {
        $this->status = 'pending';
        $this->reviewNotes = $notes;
        $this->updatedAt = new DateTime();
    }

    public function startReview(string $notes = ''): void
    {
        $this->status = 'reviewing';
        $this->reviewNotes = $notes;
        $this->updatedAt = new DateTime();
    }

    public function markAsInterviewed(string $notes): void
    {
        $this->status = 'interviewed';
        $this->reviewNotes = $notes;
        $this->updatedAt = new DateTime();
    }

    public function accept(string $notes = ''): void
    {
        $this->status = 'accepted';
        $this->reviewNotes = $notes;
        $this->updatedAt = new DateTime();
    }

    public function reject(string $reason): void
    {
        $this->status = 'rejected';
        $this->reviewNotes = $reason;
        $this->updatedAt = new DateTime();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function softDelete(): void
    {
        $this->deletedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    // Getters
    public function getUuid(): string { return $this->uuid; }
    public function getVacancyUuid(): string { return $this->vacancyUuid; }
    public function getDocumentNumber(): string { return $this->documentNumber; }
    public function getFullName(): string { return $this->fullName; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): string { return $this->phone; }
    public function getCvPath(): string { return $this->cvPath; }
    public function getCoverLetter(): string { return $this->coverLetter; }
    public function getStatus(): string { return $this->status; }
    public function getReviewNotes(): ?string { return $this->reviewNotes; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }
    public function getDeletedAt(): ?DateTime { return $this->deletedAt; }

    public function toArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'vacancyUuid' => $this->vacancyUuid,
            'documentNumber' => $this->documentNumber,
            'fullName' => $this->fullName,
            'email' => $this->email,
            'phone' => $this->phone,
            'cvPath' => $this->cvPath,
            'coverLetter' => $this->coverLetter,
            'status' => $this->status,
            'reviewNotes' => $this->reviewNotes,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s'),
            'deletedAt' => $this->deletedAt?->format('Y-m-d H:i:s'),
        ];
    }
}