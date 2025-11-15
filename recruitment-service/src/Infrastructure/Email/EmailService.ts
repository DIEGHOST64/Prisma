// Email Service - AWS SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.fromEmail = process.env.SES_FROM_EMAIL!;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: options.text || '',
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      console.log(`Email enviado exitosamente a: ${options.to}`);
    } catch (error) {
      console.error('Error al enviar email:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  // Template para confirmación de postulación
  generateApplicationConfirmationEmail(data: {
    applicantName: string;
    vacancyTitle: string;
    applicationId: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #334155 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
            .highlight { background: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Postulación Recibida!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.applicantName}</strong>,</p>
              
              <p>Hemos recibido tu postulación para la vacante:</p>
              
              <div class="highlight">
                <strong>${data.vacancyTitle}</strong>
              </div>
              
              <p>Tu número de postulación es: <strong>#${data.applicationId}</strong></p>
              
              <p>Nuestro equipo de reclutamiento revisará tu aplicación y nos pondremos en contacto contigo pronto.</p>
              
              <p><strong>¿Qué sigue?</strong></p>
              <ul>
                <li>Revisaremos tu CV y carta de presentación</li>
                <li>Si tu perfil coincide, te contactaremos para una entrevista</li>
                <li>Puedes verificar el estado de tu postulación en nuestra plataforma</li>
              </ul>
              
              <p>¡Gracias por tu interés en formar parte de nuestro equipo!</p>
              
              <p>Saludos cordiales,<br><strong>Equipo de Reclutamiento PRISMA</strong></p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
              <p>&copy; 2025 PRISMA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Template para cambio de estado
  generateStatusUpdateEmail(data: {
    applicantName: string;
    vacancyTitle: string;
    newStatus: string;
    message?: string;
  }): string {
    const statusColors: Record<string, string> = {
      'en revisión': '#f59e0b',
      'entrevista programada': '#3b82f6',
      'aceptado': '#10b981',
      'rechazado': '#ef4444',
    };

    const statusColor = statusColors[data.newStatus.toLowerCase()] || '#64748b';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #334155 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 10px 20px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Actualización de tu Postulación</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.applicantName}</strong>,</p>
              
              <p>Hay una actualización en tu postulación para:</p>
              <p><strong>${data.vacancyTitle}</strong></p>
              
              <p style="text-align: center; margin: 30px 0;">
                Estado actual: <span class="status-badge">${data.newStatus.toUpperCase()}</span>
              </p>
              
              ${data.message ? `<p>${data.message}</p>` : ''}
              
              <p>Puedes verificar más detalles en nuestra plataforma.</p>
              
              <p>Saludos cordiales,<br><strong>Equipo de Reclutamiento PRISMA</strong></p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
              <p>&copy; 2025 PRISMA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
