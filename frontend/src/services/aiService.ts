// Servicio de IA para mejorar textos - Usando backend como proxy para evitar CORS

import { recruitmentAPI } from './api';

interface TextImprovementRequest {
  text: string;
  context: 'descripcion' | 'requisitos' | 'titulo';
}

interface TextImprovementResponse {
  success: boolean;
  data: {
    originalText: string;
    improvedText: string;
  };
}

export const aiService = {
  // Mejorar texto usando IA a través del backend
  improveText: async (request: TextImprovementRequest): Promise<string> => {
    try {
      const response = await recruitmentAPI.post<TextImprovementResponse>(
        '/ai/improve-text',
        {
          text: request.text,
          context: request.context,
        }
      );

      if (response.data.success && response.data.data.improvedText) {
        return response.data.data.improvedText;
      }

      // Si no hay mejora, devolver texto original
      return request.text;
    } catch (error) {
      console.error('Error mejorando texto con IA:', error);
      // En caso de error, aplicar corrección local básica
      return localCorrection(request.text);
    }
  },

  // Validación básica local (sin IA)
  validateText: (text: string): string[] => {
    const warnings: string[] = [];

    if (!text || text.trim().length === 0) {
      return warnings;
    }

    // Verificar mayúscula inicial
    if (text[0] !== text[0].toUpperCase()) {
      warnings.push('Debe comenzar con mayúscula');
    }

    // Verificar punto final (solo si no es una lista)
    if (!text.includes('\n') && !text.trim().endsWith('.') && !text.trim().endsWith(':')) {
      warnings.push('Debería terminar con punto');
    }

    // Detectar palabras comunes sin tilde
    const commonMistakes = [
      { wrong: /\besta\b/gi, correct: 'está' },
      { wrong: /\bsera\b/gi, correct: 'será' },
      { wrong: /\bmas\b/gi, correct: 'más' },
      { wrong: /\bsi\s+(se|es|tiene|puede)\b/gi, correct: 'sí' },
      { wrong: /\btambien\b/gi, correct: 'también' },
      { wrong: /\bsolo\s+(se|es|debe|puede)\b/gi, correct: 'sólo' },
    ];

    commonMistakes.forEach(mistake => {
      if (mistake.wrong.test(text)) {
        warnings.push(`Posible error: ¿debería ser "${mistake.correct}"?`);
      }
    });

    // Verificar múltiples espacios
    if (/\s{2,}/.test(text)) {
      warnings.push('Tiene múltiples espacios seguidos');
    }

    // Verificar falta de espacio después de punto o coma
    if (/[.,]\w/.test(text)) {
      warnings.push('Falta espacio después de punto o coma');
    }

    return warnings;
  },

  // Contador de caracteres con recomendación
  getCharacterCount: (text: string, type: 'titulo' | 'descripcion' | 'requisitos') => {
    const length = text.length;
    let recommendation = '';

    if (type === 'titulo') {
      if (length < 10) recommendation = 'Muy corto';
      else if (length > 100) recommendation = 'Muy largo';
      else recommendation = 'Longitud adecuada';
    } else if (type === 'descripcion') {
      if (length < 50) recommendation = 'Muy breve';
      else if (length < 150) recommendation = 'Podría ser más detallada';
      else if (length > 1000) recommendation = 'Muy extensa';
      else recommendation = 'Longitud adecuada';
    } else {
      if (length < 30) recommendation = 'Muy breve';
      else if (length > 800) recommendation = 'Muy extenso';
      else recommendation = 'Longitud adecuada';
    }

    return { length, recommendation };
  }
};

// Corrección local como fallback en caso de error
const localCorrection = (text: string): string => {
  let improved = text.trim();

  // Capitalizar primera letra
  if (improved.length > 0) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }

  // Correcciones de tildes comunes
  const tildeCorrections: Record<string, string> = {
    ' esta ': ' está ',
    ' mas ': ' más ',
    ' tambien': ' también',
    'acion ': 'ación ',
    'cion ': 'ción ',
    'sion ': 'sión ',
  };

  for (const [wrong, correct] of Object.entries(tildeCorrections)) {
    const regex = new RegExp(wrong, 'gi');
    improved = improved.replace(regex, correct);
  }

  // Asegurar punto final si no hay puntuación
  if (!/[.!?:]$/.test(improved) && !improved.includes('\n')) {
    improved += '.';
  }

  return improved;
};
