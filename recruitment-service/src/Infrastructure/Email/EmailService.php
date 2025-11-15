<?php

namespace Prisma\Recruitment\Infrastructure\Email;

use Aws\Ses\SesClient;
use Aws\Exception\AwsException;

class EmailService
{
    private SesClient $sesClient;
    private string $fromEmail;

    public function __construct()
    {
        $this->sesClient = new SesClient([
            'version' => 'latest',
            'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
            'credentials' => [
                'key' => $_ENV['AWS_ACCESS_KEY_ID'],
                'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'],
            ],
        ]);

        $this->fromEmail = $_ENV['SES_FROM_EMAIL'];
    }

    /**
     * Enviar email de confirmación de postulación
     */
    public function sendApplicationConfirmation(
        string $applicantEmail,
        string $applicantName,
        string $vacancyTitle
    ): bool {
        $subject = mb_convert_encoding("Confirmación de Postulación - PRISMA", 'UTF-8', 'UTF-8');
        $htmlBody = $this->getApplicationConfirmationTemplate($applicantName, $vacancyTitle);
        $textBody = $this->getApplicationConfirmationText($applicantName, $vacancyTitle);

        return $this->sendEmail($applicantEmail, $subject, $htmlBody, $textBody);
    }

    /**
     * Enviar email de cambio de estado
     */
    public function sendStatusUpdate(
        string $applicantEmail,
        string $applicantName,
        string $vacancyTitle,
        string $newStatus
    ): bool {
        $subject = mb_convert_encoding("Actualización de Estado - PRISMA", 'UTF-8', 'UTF-8');
        $htmlBody = $this->getStatusUpdateTemplate($applicantName, $vacancyTitle, $newStatus);
        $textBody = $this->getStatusUpdateText($applicantName, $vacancyTitle, $newStatus);

        return $this->sendEmail($applicantEmail, $subject, $htmlBody, $textBody);
    }

    /**
     * Método genérico para enviar emails
     */
    private function sendEmail(
        string $toEmail,
        string $subject,
        string $htmlBody,
        string $textBody
    ): bool {
        try {
            $result = $this->sesClient->sendEmail([
                'Source' => 'PRISMA Reclutamiento <' . $this->fromEmail . '>',
                'Destination' => [
                    'ToAddresses' => [$toEmail],
                ],
                'Message' => [
                    'Subject' => [
                        'Data' => $subject,
                        'Charset' => 'UTF-8',
                    ],
                    'Body' => [
                        'Html' => [
                            'Data' => $htmlBody,
                            'Charset' => 'UTF-8',
                        ],
                        'Text' => [
                            'Data' => $textBody,
                            'Charset' => 'UTF-8',
                        ],
                    ],
                ],
                'ReplyToAddresses' => [$this->fromEmail],
                'Tags' => [
                    [
                        'Name' => 'Environment',
                        'Value' => 'Production',
                    ],
                    [
                        'Name' => 'EmailType',
                        'Value' => 'Transactional',
                    ],
                ],
            ]);

            error_log("Email enviado exitosamente a {$toEmail}. MessageId: " . $result['MessageId']);
            return true;
        } catch (AwsException $e) {
            error_log("Error al enviar email a {$toEmail}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Template HTML para confirmación de postulación
     */
    private function getApplicationConfirmationTemplate(string $applicantName, string $vacancyTitle): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Confirmación de Postulación - PRISMA</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #334155 0%, #2563eb 50%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px; }
        @media only screen and (max-width: 600px) {
            .container { padding: 10px; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>&#10004; ¡Postulación Recibida!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{$applicantName}</strong>,</p>
            
            <p>Hemos recibido exitosamente tu postulación para la vacante:</p>
            
            <div class="highlight">
                <strong>&#128203; {$vacancyTitle}</strong>
            </div>
            
            <p>Tu aplicación está siendo revisada por nuestro equipo de reclutamiento. Te notificaremos por email sobre cualquier actualización en el proceso.</p>
            
            <p><strong>Próximos pasos:</strong></p>
            <ul>
                <li>Revisión de tu perfil y CV</li>
                <li>Evaluación de habilidades</li>
                <li>Contacto para entrevista (si aplica)</li>
            </ul>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p>¡Gracias por tu interés en formar parte de PRISMA!</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo de Reclutamiento PRISMA</strong></p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 PRISMA. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Versión texto plano para confirmación de postulación
     */
    private function getApplicationConfirmationText(string $applicantName, string $vacancyTitle): string
    {
        return <<<TEXT
¡Postulación Recibida!

Hola {$applicantName},

Hemos recibido exitosamente tu postulación para la vacante: {$vacancyTitle}

Tu aplicación está siendo revisada por nuestro equipo de reclutamiento. Te notificaremos por email sobre cualquier actualización en el proceso.

Próximos pasos:
- Revisión de tu perfil y CV
- Evaluación de habilidades
- Contacto para entrevista (si aplica)

Si tienes alguna pregunta, no dudes en contactarnos.

¡Gracias por tu interés en formar parte de PRISMA!

Saludos cordiales,
Equipo de Reclutamiento PRISMA

---
Este es un email automático, por favor no respondas a este mensaje.
© 2025 PRISMA. Todos los derechos reservados.
TEXT;
    }

    /**
     * Template HTML para actualización de estado
     */
    private function getStatusUpdateTemplate(string $applicantName, string $vacancyTitle, string $newStatus): string
    {
        $statusMessages = [
            'Recibido' => ['emoji' => '&#128232;', 'color' => '#3b82f6', 'message' => 'Tu postulación ha sido recibida y está en revisión.'],
            'En revisión' => ['emoji' => '&#128269;', 'color' => '#8b5cf6', 'message' => 'Estamos revisando tu perfil cuidadosamente.'],
            'Entrevista programada' => ['emoji' => '&#128197;', 'color' => '#06b6d4', 'message' => 'Queremos conocerte mejor. Pronto te contactaremos para agendar una entrevista.'],
            'Aceptado' => ['emoji' => '&#127881;', 'color' => '#10b981', 'message' => '¡Felicitaciones! Has sido seleccionado para continuar en el proceso.'],
            'Rechazado' => ['emoji' => '&#128203;', 'color' => '#ef4444', 'message' => 'Agradecemos tu interés. En esta ocasión hemos decidido continuar con otros candidatos.'],
        ];

        $statusInfo = $statusMessages[$newStatus] ?? ['emoji' => '&#128231;', 'color' => '#6b7280', 'message' => 'Tu estado ha sido actualizado.'];

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #334155 0%, #2563eb 50%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; background: {$statusInfo['color']}; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        .highlight { background: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{$statusInfo['emoji']} Actualización de Estado</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{$applicantName}</strong>,</p>
            
            <p>Te informamos que el estado de tu postulación ha sido actualizado:</p>
            
            <div class="highlight">
                <strong>&#128203; Vacante:</strong> {$vacancyTitle}<br>
                <strong>Estado:</strong> <span class="status-badge">{$newStatus}</span>
            </div>
            
            <p>{$statusInfo['message']}</p>
            
            <p>Gracias por tu paciencia y por tu interés en formar parte de PRISMA.</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo de Reclutamiento PRISMA</strong></p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 PRISMA. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Versión texto plano para actualización de estado
     */
    private function getStatusUpdateText(string $applicantName, string $vacancyTitle, string $newStatus): string
    {
        return <<<TEXT
Actualización de Estado

Hola {$applicantName},

Te informamos que el estado de tu postulación ha sido actualizado:

Vacante: {$vacancyTitle}
Nuevo Estado: {$newStatus}

Gracias por tu paciencia y por tu interés en formar parte de PRISMA.

Saludos cordiales,
Equipo de Reclutamiento PRISMA

---
Este es un email automático, por favor no respondas a este mensaje.
© 2025 PRISMA. Todos los derechos reservados.
TEXT;
    }
}
