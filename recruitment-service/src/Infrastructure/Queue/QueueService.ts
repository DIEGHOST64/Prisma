// Queue Service - AWS SQS
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { emailService } from '../Email/EmailService';

export interface EmailQueueMessage {
  type: 'application_confirmation' | 'status_update';
  to: string;
  data: any;
}

export class QueueService {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private isProcessing: boolean = false;

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.queueUrl = process.env.SQS_QUEUE_URL!;
  }

  // Encolar un email
  async enqueueEmail(message: EmailQueueMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        DelaySeconds: 0,
      });

      await this.sqsClient.send(command);
      console.log(`Email encolado exitosamente: ${message.type} para ${message.to}`);
    } catch (error) {
      console.error('Error al encolar email:', error);
      throw new Error(`Failed to enqueue email: ${error}`);
    }
  }

  // Procesar la cola de emails (se ejecuta en background)
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Evitar procesamiento concurrente
    }

    this.isProcessing = true;

    try {
      while (true) {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10, // Procesar hasta 10 mensajes a la vez
          WaitTimeSeconds: 20, // Long polling
          VisibilityTimeout: 60, // Tiempo para procesar el mensaje
        });

        const response = await this.sqsClient.send(command);

        if (!response.Messages || response.Messages.length === 0) {
          // No hay mensajes, esperar un poco antes de volver a consultar
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        // Procesar cada mensaje
        for (const message of response.Messages) {
          try {
            const emailMessage: EmailQueueMessage = JSON.parse(message.Body!);
            await this.sendEmailFromQueue(emailMessage);

            // Eliminar mensaje de la cola después de procesarlo exitosamente
            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              })
            );

            console.log(`Mensaje procesado y eliminado de la cola: ${emailMessage.type}`);
          } catch (error) {
            console.error('Error al procesar mensaje:', error);
            // El mensaje volverá a estar disponible después del VisibilityTimeout
            // Si falla 3 veces, irá automáticamente a la DLQ (Dead Letter Queue)
          }
        }
      }
    } catch (error) {
      console.error('Error en el procesamiento de la cola:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Enviar email basado en el tipo de mensaje
  private async sendEmailFromQueue(message: EmailQueueMessage): Promise<void> {
    let subject: string;
    let html: string;

    switch (message.type) {
      case 'application_confirmation':
        subject = `Confirmación de Postulación - ${message.data.vacancyTitle}`;
        html = emailService.generateApplicationConfirmationEmail(message.data);
        break;

      case 'status_update':
        subject = `Actualización de Postulación - ${message.data.vacancyTitle}`;
        html = emailService.generateStatusUpdateEmail(message.data);
        break;

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }

    await emailService.sendEmail({
      to: message.to,
      subject,
      html,
    });
  }

  // Iniciar el worker de procesamiento de cola
  startQueueWorker(): void {
    console.log('🚀 Queue Worker iniciado...');
    this.processQueue().catch((error) => {
      console.error('Queue Worker falló:', error);
      // Reintentar después de 30 segundos
      setTimeout(() => this.startQueueWorker(), 30000);
    });
  }
}

export const queueService = new QueueService();
