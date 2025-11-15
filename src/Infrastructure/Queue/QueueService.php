<?php

namespace Prisma\Recruitment\Infrastructure\Queue;

use Aws\Sqs\SqsClient;
use Aws\Exception\AwsException;

class QueueService
{
    private SqsClient $sqsClient;
    private string $queueUrl;

    public function __construct()
    {
        $this->sqsClient = new SqsClient([
            'version' => 'latest',
            'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
            'credentials' => [
                'key' => $_ENV['AWS_ACCESS_KEY_ID'],
                'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'],
            ],
        ]);

        $this->queueUrl = $_ENV['SQS_QUEUE_URL'];
    }

    /**
     * Encolar un email para envío asíncrono
     */
    public function enqueueEmail(array $emailData): bool
    {
        try {
            $result = $this->sqsClient->sendMessage([
                'QueueUrl' => $this->queueUrl,
                'MessageBody' => json_encode($emailData),
                'MessageAttributes' => [
                    'Type' => [
                        'DataType' => 'String',
                        'StringValue' => $emailData['type'] ?? 'generic',
                    ],
                    'Priority' => [
                        'DataType' => 'Number',
                        'StringValue' => (string)($emailData['priority'] ?? 0),
                    ],
                ],
            ]);

            error_log("Email encolado exitosamente. MessageId: " . $result['MessageId']);
            return true;
        } catch (AwsException $e) {
            error_log("Error al encolar email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Procesar mensajes de la cola (para ejecutar en background)
     */
    public function processQueue(int $maxMessages = 10): void
    {
        try {
            $result = $this->sqsClient->receiveMessage([
                'QueueUrl' => $this->queueUrl,
                'MaxNumberOfMessages' => $maxMessages,
                'WaitTimeSeconds' => 20, // Long polling
                'MessageAttributeNames' => ['All'],
            ]);

            if (!isset($result['Messages']) || empty($result['Messages'])) {
                error_log("No hay mensajes en la cola para procesar.");
                return;
            }

            foreach ($result['Messages'] as $message) {
                $this->processMessage($message);
            }
        } catch (AwsException $e) {
            error_log("Error al procesar cola: " . $e->getMessage());
        }
    }

    /**
     * Procesar un mensaje individual
     */
    private function processMessage(array $message): void
    {
        try {
            $emailData = json_decode($message['Body'], true);
            
            // Importar EmailService aquí para evitar dependencia circular
            $emailService = new \Prisma\Recruitment\Infrastructure\Email\EmailService();
            
            $success = false;

            // Determinar qué tipo de email enviar
            switch ($emailData['type'] ?? 'generic') {
                case 'application_confirmation':
                    $success = $emailService->sendApplicationConfirmation(
                        $emailData['to'],
                        $emailData['applicantName'],
                        $emailData['vacancyTitle']
                    );
                    break;

                case 'status_update':
                    $success = $emailService->sendStatusUpdate(
                        $emailData['to'],
                        $emailData['applicantName'],
                        $emailData['vacancyTitle'],
                        $emailData['newStatus']
                    );
                    break;

                default:
                    error_log("Tipo de email desconocido: " . ($emailData['type'] ?? 'none'));
                    break;
            }

            if ($success) {
                // Eliminar mensaje de la cola si se envió exitosamente
                $this->sqsClient->deleteMessage([
                    'QueueUrl' => $this->queueUrl,
                    'ReceiptHandle' => $message['ReceiptHandle'],
                ]);
                error_log("Mensaje procesado y eliminado de la cola.");
            } else {
                error_log("Error al enviar email. El mensaje permanecerá en la cola.");
            }
        } catch (\Exception $e) {
            error_log("Error al procesar mensaje: " . $e->getMessage());
        }
    }

    /**
     * Obtener estadísticas de la cola
     */
    public function getQueueStats(): array
    {
        try {
            $result = $this->sqsClient->getQueueAttributes([
                'QueueUrl' => $this->queueUrl,
                'AttributeNames' => [
                    'ApproximateNumberOfMessages',
                    'ApproximateNumberOfMessagesNotVisible',
                    'ApproximateNumberOfMessagesDelayed',
                ],
            ]);

            return [
                'messagesAvailable' => (int)($result['Attributes']['ApproximateNumberOfMessages'] ?? 0),
                'messagesInFlight' => (int)($result['Attributes']['ApproximateNumberOfMessagesNotVisible'] ?? 0),
                'messagesDelayed' => (int)($result['Attributes']['ApproximateNumberOfMessagesDelayed'] ?? 0),
            ];
        } catch (AwsException $e) {
            error_log("Error al obtener estadísticas de la cola: " . $e->getMessage());
            return [
                'messagesAvailable' => 0,
                'messagesInFlight' => 0,
                'messagesDelayed' => 0,
            ];
        }
    }
}
