<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Prisma\Recruitment\Application\UseCases\Vacancy\CreateVacancyUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\ListVacanciesUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\GetActiveVacanciesUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\GetVacancyByUuidUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\UpdateVacancyUseCase;
use Prisma\Recruitment\Application\UseCases\Vacancy\DeleteVacancyUseCase;

class VacancyController
{
    private CreateVacancyUseCase $createVacancyUseCase;
    private ListVacanciesUseCase $listVacanciesUseCase;
    private GetActiveVacanciesUseCase $getActiveVacanciesUseCase;
    private GetVacancyByUuidUseCase $getVacancyByUuidUseCase;
    private UpdateVacancyUseCase $updateVacancyUseCase;
    private DeleteVacancyUseCase $deleteVacancyUseCase;

    public function __construct(
        CreateVacancyUseCase $createVacancyUseCase,
        ListVacanciesUseCase $listVacanciesUseCase,
        GetActiveVacanciesUseCase $getActiveVacanciesUseCase,
        GetVacancyByUuidUseCase $getVacancyByUuidUseCase,
        UpdateVacancyUseCase $updateVacancyUseCase,
        DeleteVacancyUseCase $deleteVacancyUseCase
    ) {
        $this->createVacancyUseCase = $createVacancyUseCase;
        $this->listVacanciesUseCase = $listVacanciesUseCase;
        $this->getActiveVacanciesUseCase = $getActiveVacanciesUseCase;
        $this->getVacancyByUuidUseCase = $getVacancyByUuidUseCase;
        $this->updateVacancyUseCase = $updateVacancyUseCase;
        $this->deleteVacancyUseCase = $deleteVacancyUseCase;
    }

    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Fallback: si getParsedBody() retorna null, parsear manualmente
            if ($data === null) {
                $body = (string) $request->getBody();
                $data = json_decode($body, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \RuntimeException('Invalid JSON body');
                }
            }

            $vacancy = $this->createVacancyUseCase->execute($data);

            $result = [
                'success' => true,
                'data' => $vacancy->toArray(),
                'message' => 'Vacancy created successfully',
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

            $result = $this->listVacanciesUseCase->execute($page, $limit, $status);

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

    public function listActive(Request $request, Response $response): Response
    {
        try {
            $result = $this->getActiveVacanciesUseCase->execute();

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


    public function getByUuid(Request $request, Response $response, array $args): Response
    {
        try {
            $uuid = $args['uuid'] ?? null;

            if (!$uuid) {
                throw new \InvalidArgumentException('UUID is required');
            }

            $vacancy = $this->getVacancyByUuidUseCase->execute($uuid);

            if (!$vacancy) {
                $error = [
                    'success' => false,
                    'error' => 'Vacancy not found',
                ];
                $response->getBody()->write(json_encode($error));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $output = [
                'success' => true,
                'data' => [
                    'vacancy' => $vacancy->toArray()
                ],
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

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $uuid = $args['uuid'] ?? null;

            if (!$uuid) {
                throw new \InvalidArgumentException('UUID is required');
            }

            $data = $request->getParsedBody();

            // Fallback: si getParsedBody() retorna null, parsear manualmente
            if ($data === null) {
                $body = (string) $request->getBody();
                $data = json_decode($body, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \RuntimeException('Invalid JSON body');
                }
            }

            $vacancy = $this->updateVacancyUseCase->execute($uuid, $data);

            $output = [
                'success' => true,
                'data' => [
                    'vacancy' => $vacancy->toArray()
                ],
                'message' => 'Vacancy updated successfully',
            ];

            $response->getBody()->write(json_encode($output));
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

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $uuid = $args['uuid'] ?? null;

            if (!$uuid) {
                throw new \InvalidArgumentException('UUID is required');
            }

            $this->deleteVacancyUseCase->execute($uuid);

            $output = [
                'success' => true,
                'message' => 'Vacancy deleted successfully',
            ];

            $response->getBody()->write(json_encode($output));
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


