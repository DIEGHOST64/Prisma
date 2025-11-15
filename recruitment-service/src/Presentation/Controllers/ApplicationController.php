<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Prisma\Recruitment\Application\UseCases\Application\SubmitApplicationUseCase;
use Prisma\Recruitment\Application\UseCases\Application\UpdateApplicationStatusUseCase;
use Prisma\Recruitment\Domain\Repositories\IApplicationRepository;

class ApplicationController
{
    private SubmitApplicationUseCase $submitApplicationUseCase;
    private UpdateApplicationStatusUseCase $updateApplicationStatusUseCase;
    private IApplicationRepository $applicationRepository;

    public function __construct(
        SubmitApplicationUseCase $submitApplicationUseCase,
        UpdateApplicationStatusUseCase $updateApplicationStatusUseCase,
        IApplicationRepository $applicationRepository
    ) {
        $this->submitApplicationUseCase = $submitApplicationUseCase;
        $this->updateApplicationStatusUseCase = $updateApplicationStatusUseCase;
        $this->applicationRepository = $applicationRepository;
    }

    public function submit(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if ($data === null) {
                $body = (string) $request->getBody();
                $data = json_decode($body, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \RuntimeException('Invalid JSON body');
                }
            }

            $application = $this->submitApplicationUseCase->execute($data);

            $result = [
                'success' => true,
                'data' => $application->toArray(),
                'message' => 'Application submitted successfully',
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function listAll(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $page = (int) ($params['page'] ?? 1);
            $limit = (int) ($params['limit'] ?? 10);
            $status = $params['status'] ?? null;

            $applications = $this->applicationRepository->findAll($page, $limit, $status);
            $total = $this->applicationRepository->countAll($status);

            $result = [
                'applications' => array_map(fn($a) => $a->toArray(), $applications),
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit),
                ],
            ];

            $output = [
                'success' => true,
                'data' => $result,
            ];

            $response->getBody()->write(json_encode($output));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function checkStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $documentNumber = $args['document'];

            $applications = $this->applicationRepository->findByDocument($documentNumber);

            $result = [
                'applications' => array_map(fn($a) => $a->toArray(), $applications),
                'total' => count($applications),
            ];

            $output = [
                'success' => true,
                'data' => $result,
            ];

            $response->getBody()->write(json_encode($output));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updateStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $uuid = $args['uuid'];
            $data = $request->getParsedBody();

            error_log("=== UPDATE STATUS DEBUG ===");
            error_log("UUID: " . $uuid);
            error_log("Data received: " . json_encode($data));

            if (!isset($data['status'])) {
                throw new \RuntimeException('Status is required');
            }

            $updated = $this->updateApplicationStatusUseCase->execute(
                $uuid,
                $data['status'],
                $data['notes'] ?? null
            );

            $result = [
                'success' => true,
                'data' => $updated,
                'message' => 'Application status updated successfully',
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            error_log("ERROR in updateStatus: " . $e->getMessage());
            error_log("Exception class: " . get_class($e));
            error_log("Stack trace: " . $e->getTraceAsString());

            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function deleteOne(Request $request, Response $response, array $args): Response
    {
        try {
            $uuid = $args['uuid'];

            $application = $this->applicationRepository->findByUuid($uuid);
            if (!$application) {
                throw new \RuntimeException('Application not found');
            }

            $this->applicationRepository->delete($uuid);

            $result = [
                'success' => true,
                'message' => 'Application deleted successfully',
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function deleteBulk(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if (!isset($data['status'])) {
                throw new \RuntimeException('Status is required');
            }

            $status = $data['status'];
            $validStatuses = ['accepted', 'rejected'];

            if (!in_array($status, $validStatuses)) {
                throw new \RuntimeException('Only accepted or rejected applications can be bulk deleted');
            }

            $deleted = $this->applicationRepository->deleteByStatus($status);

            $result = [
                'success' => true,
                'message' => "Deleted {$deleted} applications with status {$status}",
                'deleted' => $deleted,
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $error = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }
}