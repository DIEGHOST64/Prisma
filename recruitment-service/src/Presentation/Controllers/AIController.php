<?php

declare(strict_types=1);

namespace Prisma\Recruitment\Presentation\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AIController
{
    public function improveText(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if ($data === null) {
                $body = (string) $request->getBody();
                $data = json_decode($body, true);
            }

            $text = $data['text'] ?? '';
            $context = $data['context'] ?? 'descripcion';

            if (empty($text)) {
                throw new \InvalidArgumentException('Text is required');
            }

            // Construir prompt según contexto
            $prompt = $this->buildPrompt($text, $context);

            // Llamar a Hugging Face API
            $improvedText = $this->callHuggingFace($prompt);

            $result = [
                'success' => true,
                'data' => [
                    'originalText' => $text,
                    'improvedText' => $improvedText,
                ],
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

    private function buildPrompt(string $text, string $context): string
    {
        switch ($context) {
            case 'titulo':
                return "Mejora este título de vacante laboral. Corrígelo ortográficamente, usa mayúsculas apropiadas y hazlo más profesional y atractivo. RESPONDE SOLO CON EL TÍTULO MEJORADO, SIN EXPLICACIONES:\n\n$text";
            
            case 'descripcion':
                return "Mejora esta descripción de vacante laboral. Corrige ortografía, tildes, puntuación y mejora la redacción para que sea clara, profesional y atractiva para candidatos. Expande si es muy breve. RESPONDE SOLO CON LA DESCRIPCIÓN MEJORADA, SIN EXPLICACIONES:\n\n$text";
            
            case 'requisitos':
                return "Mejora estos requisitos de vacante laboral. Corrige ortografía, tildes y puntuación. Organiza en formato claro y profesional. RESPONDE SOLO CON LOS REQUISITOS MEJORADOS, SIN EXPLICACIONES:\n\n$text";
            
            default:
                return "Mejora este texto corrigiendo ortografía, tildes y puntuación, y haciéndolo más profesional:\n\n$text";
        }
    }

    private function callHuggingFace(string $prompt): string
    {
        // Intentar primero con Google Gemini (gratuito y muy potente)
        $geminiResult = $this->callGemini($prompt);
        if ($geminiResult !== null) {
            return $geminiResult;
        }

        // Fallback: corrección local mejorada
        return $this->localImprovement($prompt);
    }

    private function callGemini(string $prompt): ?string
    {
        // Google Gemini API - Gratis con límites generosos
        // No requiere API key para uso básico desde servidor
        $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        $data = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'text' => $prompt
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 500,
            ]
        ];

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $responseBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Gemini error: HTTP $httpCode - Response: $responseBody");
            // Intentar con un modelo de texto simple más potente
            return $this->callAdvancedLocal($prompt);
        }

        $result = json_decode($responseBody, true);

        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return trim($result['candidates'][0]['content']['parts'][0]['text']);
        }

        return null;
    }

    private function callAdvancedLocal(string $prompt): ?string
    {
        // Mejora avanzada local con reglas más sofisticadas
        $parts = explode("\n\n", $prompt);
        $originalText = end($parts);
        $context = '';
        
        if (str_contains($prompt, 'título')) {
            $context = 'titulo';
        } elseif (str_contains($prompt, 'requisitos')) {
            $context = 'requisitos';
        } else {
            $context = 'descripcion';
        }

        return $this->advancedLocalImprovement($originalText, $context);
    }

    private function advancedLocalImprovement(string $text, string $context): string
    {
        $improved = trim($text);
        
        // 1. Capitalizar primera letra
        if (!empty($improved)) {
            $improved = ucfirst($improved);
        }

        // 2. Correcciones ortográficas y gramaticales exhaustivas
        $corrections = [
            // Tildes comunes
            '/\b(esta|Esta)\s+(buscando|en|trabajando|ubicado|ubicada|requiere)/i' => 'Está $2',
            '/\bmas\s+(de|que|importante|experiencia|conocimientos)/i' => 'más $1',
            '/\btambien\b/i' => 'también',
            '/\bsera\b/i' => 'será',
            '/\bsolo\s+/i' => 'sólo ',
            '/\basi\s+como/i' => 'así como',
            '/\b(despues|Despues)\b/i' => 'después',
            '/\b(ademas|Ademas)\b/i' => 'además',
            
            // Errores ortográficos comunes
            '/\bdesarollador/i' => 'desarrollador',
            '/\bdesarrollo\s+web/i' => 'desarrollo web',
            '/\bexperiecia/i' => 'experiencia',
            '/\bcompania/i' => 'compañía',
            '/\bhaver\b/i' => 'haber',
            '/\ba\s+sido\b/i' => 'ha sido',
            '/\bahi\b/i' => 'ahí',
            '/\bprogramacion/i' => 'programación',
            '/\bcomunicacion/i' => 'comunicación',
            '/\bsolucion/i' => 'solución',
            
            // Mejoras profesionales
            '/\bbases?\s+datos?\b/i' => 'bases de datos',
            '/\bbase?\s+datos?\b/i' => 'base de datos',
            '/\bMySQL/i' => 'MySQL',
            '/\bPHP/i' => 'PHP',
            '/\bJavaScript/i' => 'JavaScript',
            '/\bHTML/i' => 'HTML',
            '/\bCSS/i' => 'CSS',
            '/\btrabajar\s+equipo/i' => 'trabajar en equipo',
            '/\bexperiencia\s+en\s+(.+?)\s+y\s+/i' => 'experiencia en $1, ',
        ];

        foreach ($corrections as $pattern => $replacement) {
            $improved = preg_replace($pattern, $replacement, $improved);
        }

        // 3. Mejorar estructura según contexto
        if ($context === 'titulo') {
            // Títulos profesionales
            $improved = $this->improveTitulo($improved);
            
        } elseif ($context === 'descripcion') {
            // Descripciones más completas
            $improved = $this->improveDescripcion($improved);
            
        } elseif ($context === 'requisitos') {
            // Formatear requisitos
            $improved = $this->improveRequisitos($improved);
        }

        // 4. Mejorar puntuación
        $improved = preg_replace('/\s+([.,;:!?])/', '$1', $improved);
        $improved = preg_replace('/([.,;])([A-Za-z])/', '$1 $2', $improved);
        $improved = preg_replace('/\s+/', ' ', $improved);

        // 5. Asegurar punto final (si no es lista)
        if (!preg_match('/[.!?:]$/', $improved) && !str_contains($improved, "\n")) {
            $improved .= '.';
        }

        // 6. Capitalizar después de punto
        $improved = preg_replace_callback('/\.\s+([a-z])/', function($matches) {
            return '. ' . strtoupper($matches[1]);
        }, $improved);

        return $improved;
    }

    private function improveTitulo(string $text): string
    {
        // Expandir títulos muy simples
        $improved = $text;
        
        // Detectar nivel si existe
        $nivel = '';
        if (preg_match('/\b(junior|jr)\b/i', $improved)) {
            $nivel = 'Junior';
        } elseif (preg_match('/\b(senior|sr)\b/i', $improved)) {
            $nivel = 'Senior';
        } elseif (preg_match('/\b(semi senior|semi-senior|semisenior)\b/i', $improved)) {
            $nivel = 'Semi Senior';
        }
        
        // Si es muy simple, expandir
        if (strlen($improved) < 30 && preg_match('/\b(programador|desarrollador|developer)\b/i', $improved)) {
            $tecnologia = '';
            if (preg_match('/\bphp\b/i', $improved)) $tecnologia = 'PHP';
            elseif (preg_match('/\bjavascript\b/i', $improved)) $tecnologia = 'JavaScript';
            elseif (preg_match('/\bpython\b/i', $improved)) $tecnologia = 'Python';
            elseif (preg_match('/\bjava\b/i', $improved)) $tecnologia = 'Java';
            
            if ($tecnologia && $nivel) {
                $improved = "Desarrollador $tecnologia $nivel";
            } elseif ($tecnologia) {
                $improved = "Desarrollador $tecnologia Full Stack";
            }
        }
        
        // Capitalizar palabras importantes en títulos
        $words = preg_split('/\s+/', $improved);
        $lowercase = ['de', 'la', 'el', 'en', 'con', 'por', 'para', 'y', 'o', 'a', 'un', 'una'];
        
        $improved = array_map(function($word, $index) use ($lowercase) {
            if ($index === 0 || !in_array(strtolower($word), $lowercase)) {
                return ucfirst(strtolower($word));
            }
            return strtolower($word);
        }, $words, array_keys($words));
        
        return implode(' ', $improved);
    }

    private function improveDescripcion(string $text): string
    {
        $improved = $text;
        $originalLength = strlen($improved);
        
        // Expandir significativamente si es muy corta (menos de 200 caracteres)
        if ($originalLength < 200) {
            // Detectar tipo de posición por palabras clave
            $categoria = $this->detectarCategoria($improved);
            
            // Detectar requisitos o habilidades mencionadas
            $habilidades = $this->extraerHabilidades($improved);
            
            // Generar descripción expandida según categoría
            $expandida = $this->generarDescripcionExpandida($categoria, $habilidades, $improved);
            
            $improved = $expandida;
        } else {
            // Para textos más largos, solo mejorar estructura
            if (!preg_match('/^(Buscamos|Estamos buscando|Necesitamos|Requerimos|Se requiere|Se busca)/i', $improved)) {
                $improved = 'Buscamos ' . lcfirst($improved);
            }
        }
        
        return $improved;
    }

    private function detectarCategoria(string $text): string
    {
        $categorias = [
            'tecnologia' => '/\b(programador|desarrollador|developer|ingeniero de software|analista de sistemas|php|java|python|javascript|frontend|backend|fullstack|full stack)\b/i',
            'ventas' => '/\b(vendedor|ventas|comercial|ejecutivo de ventas|asesor comercial|representante de ventas)\b/i',
            'marketing' => '/\b(marketing|mercadeo|community manager|social media|publicidad|seo|sem|content)\b/i',
            'administracion' => '/\b(administrador|administrativo|asistente administrativo|secretari|recepcion|recursos humanos|rrhh)\b/i',
            'contabilidad' => '/\b(contador|contable|auditor|financiero|tesorero)\b/i',
            'diseño' => '/\b(diseñador|diseño grafico|ux|ui|creativo)\b/i',
            'operaciones' => '/\b(operario|operador|produccion|logistica|almacen|bodega)\b/i',
            'atencion_cliente' => '/\b(atencion al cliente|servicio al cliente|call center|soporte|mesa de ayuda)\b/i',
            'salud' => '/\b(medico|enfermero|auxiliar de enfermeria|terapeuta|psicologo)\b/i',
            'educacion' => '/\b(docente|profesor|maestro|instructor|tutor|capacitador)\b/i',
            'ingenieria' => '/\b(ingeniero|tecnico|mecanico|electrico|civil|industrial)\b/i',
            'gerencia' => '/\b(gerente|director|jefe|coordinador|lider|supervisor)\b/i',
        ];
        
        foreach ($categorias as $categoria => $pattern) {
            if (preg_match($pattern, $text)) {
                return $categoria;
            }
        }
        
        return 'general';
    }

    private function extraerHabilidades(string $text): array
    {
        $habilidades = [];
        
        // Buscar palabras clave en el texto
        if (preg_match_all('/\b(experiencia|conocimiento|dominio|manejo) (en|de) ([a-zA-Z\s,]+)/i', $text, $matches)) {
            $habilidades = array_merge($habilidades, explode(',', $matches[3][0]));
        }
        
        // Detectar tecnologías o herramientas específicas
        $palabrasClave = preg_split('/[\s,]+/', $text);
        foreach ($palabrasClave as $palabra) {
            if (strlen($palabra) > 3 && preg_match('/^[A-Z][a-zA-Z]*$/', $palabra)) {
                $habilidades[] = $palabra;
            }
        }
        
        return array_unique(array_map('trim', $habilidades));
    }

    private function generarDescripcionExpandida(string $categoria, array $habilidades, string $textoOriginal): string
    {
        $descripciones = [
            'tecnologia' => [
                'intro' => 'Estamos en búsqueda de un profesional altamente motivado en el área de tecnología para unirse a nuestro equipo de desarrollo. ',
                'responsabilidades' => 'Será responsable de diseñar, desarrollar y mantener soluciones tecnológicas innovadoras, trabajando en estrecha colaboración con equipos multidisciplinarios. ',
                'ambiente' => 'Ofrecemos un ambiente de trabajo dinámico, con oportunidades de crecimiento profesional y proyectos desafiantes que potenciarán tus habilidades técnicas.',
            ],
            'ventas' => [
                'intro' => 'Buscamos un profesional dinámico y orientado a resultados para nuestro equipo comercial. ',
                'responsabilidades' => 'El candidato seleccionado será responsable de gestionar la cartera de clientes, generar nuevas oportunidades de negocio y alcanzar objetivos de ventas establecidos. ',
                'ambiente' => 'Ofrecemos un excelente ambiente laboral, capacitación continua, atractivos esquemas de comisiones y oportunidades de crecimiento dentro de la organización.',
            ],
            'marketing' => [
                'intro' => 'Estamos en búsqueda de un profesional creativo y estratégico para fortalecer nuestro equipo de marketing. ',
                'responsabilidades' => 'Será responsable de desarrollar e implementar estrategias de marketing digital, gestionar redes sociales, crear contenido atractivo y analizar métricas de desempeño. ',
                'ambiente' => 'Ofrecemos un ambiente colaborativo, proyectos innovadores y la oportunidad de marcar la diferencia en el posicionamiento de nuestra marca.',
            ],
            'administracion' => [
                'intro' => 'Buscamos un profesional organizado y proactivo para apoyar las funciones administrativas de nuestra organización. ',
                'responsabilidades' => 'Será responsable de gestionar documentación, coordinar agendas, atender proveedores y clientes, y brindar soporte en las actividades diarias del área administrativa. ',
                'ambiente' => 'Ofrecemos un ambiente de trabajo estable, capacitación constante y oportunidades de desarrollo profesional.',
            ],
            'contabilidad' => [
                'intro' => 'Estamos en búsqueda de un profesional con sólidos conocimientos contables y financieros. ',
                'responsabilidades' => 'Será responsable de llevar los registros contables, preparar estados financieros, realizar conciliaciones bancarias y apoyar en los procesos tributarios de la compañía. ',
                'ambiente' => 'Ofrecemos estabilidad laboral, crecimiento profesional y la oportunidad de trabajar en una empresa en constante expansión.',
            ],
            'diseño' => [
                'intro' => 'Buscamos un profesional creativo con visión estética para nuestro equipo de diseño. ',
                'responsabilidades' => 'Será responsable de crear piezas gráficas innovadoras, desarrollar conceptos visuales y materializar ideas creativas que comuniquen efectivamente nuestro mensaje de marca. ',
                'ambiente' => 'Ofrecemos un ambiente creativo, proyectos variados y la libertad para proponer ideas innovadoras.',
            ],
            'operaciones' => [
                'intro' => 'Estamos en búsqueda de personal comprometido para nuestro equipo de operaciones. ',
                'responsabilidades' => 'Será responsable de ejecutar las actividades operativas diarias, mantener los estándares de calidad y seguridad, y contribuir al cumplimiento de los objetivos de producción. ',
                'ambiente' => 'Ofrecemos estabilidad laboral, capacitación en el puesto y un buen ambiente de trabajo.',
            ],
            'atencion_cliente' => [
                'intro' => 'Buscamos un profesional con excelentes habilidades de comunicación para nuestro equipo de servicio al cliente. ',
                'responsabilidades' => 'Será responsable de atender consultas y requerimientos de clientes, resolver inquietudes, gestionar solicitudes y garantizar una experiencia excepcional de servicio. ',
                'ambiente' => 'Ofrecemos capacitación continua, oportunidades de crecimiento y un ambiente de trabajo positivo.',
            ],
            'salud' => [
                'intro' => 'Estamos en búsqueda de un profesional de la salud comprometido con el bienestar de los pacientes. ',
                'responsabilidades' => 'Será responsable de brindar atención de calidad, realizar procedimientos según protocolos establecidos y trabajar en equipo para garantizar el mejor cuidado de nuestros pacientes. ',
                'ambiente' => 'Ofrecemos un ambiente profesional, capacitación continua y la oportunidad de crecer en el sector salud.',
            ],
            'educacion' => [
                'intro' => 'Buscamos un profesional apasionado por la enseñanza para unirse a nuestro equipo educativo. ',
                'responsabilidades' => 'Será responsable de planificar y ejecutar actividades pedagógicas, evaluar el progreso de los estudiantes y crear un ambiente de aprendizaje positivo y estimulante. ',
                'ambiente' => 'Ofrecemos un entorno educativo de calidad, recursos didácticos y oportunidades de desarrollo profesional.',
            ],
            'ingenieria' => [
                'intro' => 'Estamos en búsqueda de un profesional técnico con sólidos conocimientos en ingeniería. ',
                'responsabilidades' => 'Será responsable de diseñar, supervisar y ejecutar proyectos técnicos, garantizando el cumplimiento de estándares de calidad y normativas vigentes. ',
                'ambiente' => 'Ofrecemos proyectos desafiantes, crecimiento profesional y la oportunidad de trabajar con tecnología de punta.',
            ],
            'gerencia' => [
                'intro' => 'Buscamos un líder con amplia experiencia para dirigir nuestro equipo. ',
                'responsabilidades' => 'Será responsable de liderar al equipo, tomar decisiones estratégicas, gestionar recursos, alcanzar objetivos organizacionales y fomentar un ambiente de trabajo colaborativo y productivo. ',
                'ambiente' => 'Ofrecemos un rol estratégico, autonomía en la toma de decisiones y compensación competitiva.',
            ],
            'general' => [
                'intro' => 'Estamos en búsqueda de un profesional motivado para unirse a nuestro equipo de trabajo. ',
                'responsabilidades' => 'El candidato ideal será responsable de ejecutar las funciones del cargo con excelencia, contribuyendo al logro de los objetivos organizacionales. ',
                'ambiente' => 'Ofrecemos un excelente ambiente laboral, oportunidades de crecimiento y desarrollo profesional.',
            ],
        ];
        
        $template = $descripciones[$categoria] ?? $descripciones['general'];
        
        $descripcion = $template['intro'];
        
        // Agregar habilidades específicas si existen
        if (!empty($habilidades)) {
            $descripcion .= 'El candidato ideal debe contar con conocimientos en ' . implode(', ', array_slice($habilidades, 0, 3)) . '. ';
        }
        
        $descripcion .= $template['responsabilidades'];
        $descripcion .= $template['ambiente'];
        
        return $descripcion;
    }

    private function improveRequisitos(string $text): string
    {
        $improved = $text;
        
        // Si tiene múltiples requisitos separados por comas o "y"
        $separadores = preg_match_all('/[,y]\s+/', $improved);
        
        if ($separadores >= 2) {
            // Convertir a lista con viñetas expandida
            $items = preg_split('/[,y]\s+/', $improved);
            $items = array_map('trim', $items);
            $items = array_filter($items, function($item) {
                return strlen($item) > 2;
            });
            
            // Expandir cada requisito
            $itemsMejorados = [];
            foreach ($items as $item) {
                $itemMejorado = $this->expandirRequisitoIndividual(ucfirst($item));
                $itemsMejorados[] = $itemMejorado;
            }
            
            if (count($itemsMejorados) > 1) {
                $improved = "• " . implode("\n• ", $itemsMejorados);
            }
        } else {
            // Requisito único, expandir siempre
            $improved = $this->expandirRequisitoIndividual(ucfirst($improved));
        }
        
        return $improved;
    }

    private function expandirRequisitoIndividual(string $requisito): string
    {
        $expanded = trim($requisito);
        $original = $expanded;
        
        // Base de conocimiento ampliada - TECNOLOGÍAS
        $tecnologias = [
            // Backend Frameworks
            '/^(spring\s*boot|springboot)$/i' => 'Experiencia mínima de 2 años en desarrollo con Spring Boot para aplicaciones empresariales',
            '/^(laravel)$/i' => 'Dominio de Laravel framework, incluyendo Eloquent ORM, migrations y APIs RESTful',
            '/^(django)$/i' => 'Conocimiento sólido en Django framework para desarrollo web con Python',
            '/^(express|express\.?js)$/i' => 'Experiencia en desarrollo de APIs con Express.js y Node.js',
            '/^(nest\.?js|nestjs)$/i' => 'Experiencia en NestJS para arquitecturas escalables con TypeScript',
            '/^(symfony)$/i' => 'Conocimientos en Symfony framework para desarrollo PHP empresarial',
            
            // Frontend Frameworks
            '/^(react|reactjs|react\.?js)$/i' => 'Experiencia comprobable en React.js, hooks, y manejo de estado (Redux/Context)',
            '/^(angular)$/i' => 'Dominio de Angular framework, TypeScript, RxJS y arquitectura de componentes',
            '/^(vue|vuejs|vue\.?js)$/i' => 'Conocimiento en Vue.js 3, Composition API y Vuex para gestión de estado',
            '/^(next\.?js|nextjs)$/i' => 'Experiencia en Next.js para aplicaciones React con SSR y SSG',
            
            // Lenguajes
            '/^(php)$/i' => 'Experiencia sólida en PHP (mínimo versión 7.4), programación orientada a objetos y PSR',
            '/^(java)$/i' => 'Dominio de Java SE/EE, programación orientada a objetos y patrones de diseño',
            '/^(python)$/i' => 'Conocimiento avanzado en Python 3.x, incluyendo programación asíncrona',
            '/^(javascript|js)$/i' => 'Dominio de JavaScript ES6+, programación asíncrona y manipulación del DOM',
            '/^(typescript|ts)$/i' => 'Experiencia en TypeScript, tipos avanzados e interfaces',
            
            // Bases de Datos
            '/^(mysql)$/i' => 'Experiencia en diseño y optimización de bases de datos MySQL, queries complejas e índices',
            '/^(postgresql|postgres)$/i' => 'Dominio de PostgreSQL, queries avanzadas, procedimientos almacenados y optimización',
            '/^(mongodb)$/i' => 'Conocimiento en bases de datos NoSQL MongoDB, agregaciones y modelado de documentos',
            
            // DevOps
            '/^(docker)$/i' => 'Experiencia en containerización con Docker, Dockerfiles y Docker Compose',
            '/^(kubernetes|k8s)$/i' => 'Conocimientos en orquestación de contenedores con Kubernetes',
            '/^(aws)$/i' => 'Experiencia práctica con servicios de Amazon Web Services (EC2, S3, RDS, Lambda)',
            '/^(git)$/i' => 'Dominio de Git para control de versiones, branching strategies y workflows colaborativos',
        ];
        
        // Base de conocimiento - HABILIDADES GENERALES (para cualquier cargo)
        $habilidadesGenerales = [
            // Habilidades blandas
            '/^(trabajo\s+en\s+equipo|equipo)$/i' => 'Excelentes habilidades de trabajo en equipo, colaboración y espíritu cooperativo',
            '/^(comunicaci[oó]n|comunicacion)$/i' => 'Habilidades de comunicación efectiva, tanto oral como escrita, para interactuar con diferentes audiencias',
            '/^(liderazgo)$/i' => 'Capacidad de liderazgo, gestión de equipos y toma de decisiones estratégicas',
            '/^(proactividad|proactivo)$/i' => 'Actitud proactiva, iniciativa propia y orientación a resultados',
            '/^(resoluci[oó]n de problemas)$/i' => 'Capacidad analítica y habilidad para resolver problemas de manera efectiva',
            '/^(adaptabilidad|flexibilidad)$/i' => 'Adaptabilidad al cambio, flexibilidad y capacidad de aprender continuamente',
            '/^(creatividad)$/i' => 'Pensamiento creativo, innovación y capacidad de proponer soluciones originales',
            '/^(organizaci[oó]n|organizacion)$/i' => 'Excelentes habilidades organizativas, gestión del tiempo y priorización de tareas',
            '/^(atenci[oó]n al detalle|atencion al detalle)$/i' => 'Atención meticulosa al detalle y compromiso con la calidad del trabajo',
            '/^(multitarea|multitasking)$/i' => 'Capacidad para manejar múltiples tareas simultáneamente y cumplir plazos',
            
            // Educación y experiencia
            '/^(t[ií]tulo profesional|titulo profesional)$/i' => 'Título profesional en carrera afín al cargo, preferiblemente con especialización',
            '/^(experiencia laboral)$/i' => 'Experiencia laboral mínima de 2 años en posiciones similares',
            '/^(experiencia comprobada)$/i' => 'Experiencia comprobada con referencias verificables y logros demostrables',
            '/^(posgrado|maestr[ií]a)$/i' => 'Estudios de posgrado, maestría o especialización en área relacionada (deseable)',
            
            // Idiomas
            '/^(ingl[eé]s|ingles)$/i' => 'Nivel de inglés intermedio-avanzado (lectura, escritura y conversación)',
            '/^(ingl[eé]s avanzado|ingles avanzado)$/i' => 'Inglés avanzado certificado (B2-C1), con capacidad de comunicación fluida',
            '/^(bilingüe|bilinguismo)$/i' => 'Bilingüismo español-inglés con certificación internacional',
            
            // Competencias profesionales
            '/^(servicio al cliente)$/i' => 'Orientación al servicio al cliente, empatía y capacidad de generar experiencias positivas',
            '/^(ventas)$/i' => 'Experiencia comprobada en ventas, negociación y cierre de negocios',
            '/^(negociaci[oó]n|negociacion)$/i' => 'Habilidades de negociación, persuasión y construcción de relaciones comerciales',
            '/^(administraci[oó]n|administracion)$/i' => 'Conocimientos en administración, gestión de recursos y planificación estratégica',
            '/^(contabilidad)$/i' => 'Conocimientos sólidos en contabilidad, normativa tributaria y análisis financiero',
            '/^(marketing)$/i' => 'Experiencia en marketing digital, estrategias de contenido y análisis de métricas',
            '/^(diseño gr[aá]fico|diseño grafico)$/i' => 'Dominio de herramientas de diseño gráfico (Adobe Creative Suite, Figma)',
            '/^(redes sociales)$/i' => 'Manejo experto de redes sociales, community management y análisis de engagement',
            '/^(microsoft office|office)$/i' => 'Dominio avanzado de Microsoft Office (Excel, Word, PowerPoint)',
            '/^(excel|excel avanzado)$/i' => 'Excel avanzado: tablas dinámicas, macros, fórmulas complejas y análisis de datos',
            '/^(an[aá]lisis de datos|analisis de datos)$/i' => 'Capacidad de análisis de datos, interpretación de métricas y toma de decisiones basada en datos',
            
            // Requisitos legales y formales
            '/^(licencia de conducir|licencia)$/i' => 'Licencia de conducción vigente (categoría según requerimientos del cargo)',
            '/^(veh[ií]culo propio|vehiculo propio)$/i' => 'Vehículo propio en buen estado para desplazamientos laborales',
            '/^(disponibilidad)$/i' => 'Disponibilidad inmediata para incorporación y horario completo',
            '/^(disponibilidad de viaje)$/i' => 'Disponibilidad para viajar dentro y fuera de la ciudad según necesidades del cargo',
            '/^(antecedentes)$/i' => 'Certificado de antecedentes disciplinarios, fiscales y judiciales vigentes',
        ];
        
        // Buscar en tecnologías primero
        foreach ($tecnologias as $pattern => $descripcion) {
            if (preg_match($pattern, $expanded)) {
                $expanded = $descripcion;
                break;
            }
        }
        
        // Si no hubo coincidencia en tecnologías, buscar en habilidades generales
        if ($expanded === $original) {
            foreach ($habilidadesGenerales as $pattern => $descripcion) {
                if (preg_match($pattern, $expanded)) {
                    $expanded = $descripcion;
                    break;
                }
            }
        }
        
        // Si aún no hay coincidencia pero es corto, intentar expandir genéricamente
        if ($expanded === $original && strlen($expanded) < 60) {
            // Verificar si parece tecnología (capitalizado o siglas)
            if (preg_match('/^[A-Z][a-zA-Z0-9.]*$/', $expanded) || preg_match('/^[A-Z]{2,}$/', $expanded)) {
                if (!preg_match('/experiencia|conocimiento|dominio/i', $expanded)) {
                    $expanded = "Conocimientos y experiencia demostrable en " . $expanded;
                }
            } else {
                // Para otros casos, agregar contexto profesional
                if (!preg_match('/experiencia|conocimiento|dominio|habilidad|capacidad/i', $expanded)) {
                    $expanded = "Contar con " . lcfirst($expanded) . " requerido para el desempeño del cargo";
                }
            }
        }
        
        // Asegurar que termine con punto
        if (!preg_match('/[.!?]$/', $expanded)) {
            $expanded .= '.';
        }
        
        return $expanded;
    }

    private function localImprovement(string $text): string
    {
        // Extraer el texto original del prompt
        $parts = explode("\n\n", $text);
        $originalText = end($parts);

        // Correcciones básicas
        $improved = trim($originalText);
        
        // Capitalizar primera letra
        if (!empty($improved)) {
            $improved = ucfirst($improved);
        }

        // Correcciones de tildes comunes en español
        $tildes = [
            '/\besta\s/i' => 'está ',
            '/\bmas\s/i' => 'más ',
            '/\btambien\b/i' => 'también',
            '/\bsera\b/i' => 'será',
            '/\bsolo\s/i' => 'sólo ',
            '/\basi\s/i' => 'así ',
            '/acion\s/i' => 'ación ',
            '/cion\s/i' => 'ción ',
            '/sion\s/i' => 'sión ',
            '/\bdesarollador/i' => 'desarrollador',
            '/\bexperiecia/i' => 'experiencia',
            '/\bcompania/i' => 'compañía',
            '/\btrabaj/i' => 'trabaj',
        ];

        foreach ($tildes as $pattern => $correct) {
            $improved = preg_replace($pattern, $correct, $improved);
        }

        // Mejorar palabras comunes mal escritas
        $corrections = [
            '/\bhaver\b/i' => 'haber',
            '/\ba\s+sido\b/i' => 'ha sido',
            '/\ba\s+hacer\b/i' => 'a hacer',
            '/\bahi\b/i' => 'ahí',
            '/\bpara\s+el\s+puesto\b/i' => 'para el puesto',
            '/\bexperi[eé]ncia\b/i' => 'experiencia',
        ];

        foreach ($corrections as $pattern => $correct) {
            $improved = preg_replace($pattern, $correct, $improved);
        }

        // Mejorar puntuación
        $improved = preg_replace('/\s+([.,;:!?])/', '$1', $improved); // Quitar espacio antes de puntuación
        $improved = preg_replace('/([.,;:!?])(\w)/', '$1 $2', $improved); // Agregar espacio después
        $improved = preg_replace('/\s+/', ' ', $improved); // Eliminar espacios múltiples

        // Asegurar punto final
        if (!in_array(substr($improved, -1), ['.', '!', '?', ':']) && !str_contains($improved, "\n")) {
            $improved .= '.';
        }

        // Capitalizar después de punto
        $improved = preg_replace_callback('/\.\s+([a-z])/', function($matches) {
            return '. ' . strtoupper($matches[1]);
        }, $improved);

        return $improved;
    }
}
