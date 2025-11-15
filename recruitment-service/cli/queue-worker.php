<?php

/**
 * Worker para procesar emails en cola
 * Ejecutar: php cli/queue-worker.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Prisma\Recruitment\Infrastructure\Queue\QueueService;

// Cargar variables de entorno
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$queueService = new QueueService();

echo "=== Queue Worker Iniciado ===\n";
echo "Presiona Ctrl+C para detener\n\n";

$iteration = 0;

while (true) {
    $iteration++;
    echo "[" . date('Y-m-d H:i:s') . "] Iteración #{$iteration} - Procesando cola...\n";

    try {
        // Obtener estadísticas
        $stats = $queueService->getQueueStats();
        echo "  📊 Mensajes disponibles: {$stats['messagesAvailable']}\n";
        echo "  🔄 Mensajes en proceso: {$stats['messagesInFlight']}\n";

        // Procesar mensajes
        $queueService->processQueue(10);

        echo "  ✅ Procesamiento completado\n\n";
    } catch (Exception $e) {
        echo "  ❌ Error: " . $e->getMessage() . "\n\n";
    }

    // Esperar 5 segundos antes de la siguiente iteración
    sleep(5);
}
