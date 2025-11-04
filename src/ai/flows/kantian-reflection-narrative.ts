'use server';
/**
 * @fileOverview Generación de reflexiones kantianas usando Groq (LLaMA 3.3)
 *
 * - generateKantianNarrative - Genera una reflexión kantiana basada en las elecciones del usuario
 * - KantianNarrativeInput - Tipo de entrada para la generación
 * - KantianNarrativeOutput - Tipo de salida
 */

import { generateWithGroq } from '@/lib/groq-client';
import { z } from 'zod';

// Esquemas de validación
const KantianNarrativeInputSchema = z.object({
  dilemmaText: z.string(),
  userResponse: z.number(),
  topic: z.string(),
});

export type KantianNarrativeInput = z.infer<typeof KantianNarrativeInputSchema>;

const KantianNarrativeOutputSchema = z.object({
  narrative: z.string(),
});

export type KantianNarrativeOutput = z.infer<
  typeof KantianNarrativeOutputSchema
>;

/**
 * Genera una reflexión kantiana usando Groq
 */
export async function generateKantianNarrative(
  input: KantianNarrativeInput
): Promise<KantianNarrativeOutput> {
  const { dilemmaText, userResponse, topic } = input;

  // Interpretar la respuesta del usuario
  let responseInterpretation = '';
  if (userResponse < 0.3) {
    responseInterpretation =
      'tendiendo hacia el rechazo o negación de la acción propuesta';
  } else if (userResponse < 0.7) {
    responseInterpretation =
      'mostrando ambivalencia o una postura moderada ante la acción';
  } else {
    responseInterpretation =
      'tendiendo hacia la aceptación o afirmación de la acción propuesta';
  }

  const systemPrompt = `Eres un asistente de IA experto en filosofía kantiana diseñado para ayudar a los usuarios a reflexionar sobre las implicaciones éticas de sus decisiones.

Tu especialidad es aplicar el Imperativo Categórico de Kant para analizar dilemas morales desde la perspectiva de la universalización de máximas.`;

  const userPrompt = `Analiza el siguiente dilema ético desde una perspectiva kantiana:

**Dilema:** ${dilemmaText}

**Respuesta del usuario (escala 0-1):** ${userResponse.toFixed(2)} - ${responseInterpretation}

**Tópico ético:** ${topic}

Genera una reflexión breve (100-150 palabras) en formato "Y si todos..." que:

1. Identifique claramente la máxima implícita (el principio detrás de su acción) basándose en su respuesta
2. Explique qué pasaría si todos actuaran según esa máxima
3. Destaque cualquier contradicción, daño o consecuencia indeseable que surgiría de la universalización de esa máxima
4. Ofrezca una reflexión concisa sobre las implicaciones éticas de la elección del usuario desde una perspectiva kantiana, enfocándose en la importancia de actuar según principios que podrían ser leyes universales
5. Esté escrita en un estilo claro, accesible y cautivador, EN ESPAÑOL

Devuelve tu respuesta ÚNICAMENTE como un objeto JSON válido con esta estructura exacta:
{
  "narrative": "La narrativa kantiana aquí en español..."
}`;

  try {
    const response = await generateWithGroq<{ narrative: string }>({
      systemPrompt,
      userPrompt,
      temperature: 0.7, // Equilibrio entre creatividad y coherencia
    });

    if (!response.narrative || response.narrative.trim() === '') {
      throw new Error(
        'La IA no pudo generar la narrativa en el formato esperado.'
      );
    }

    return { narrative: response.narrative };
  } catch (error: any) {
    console.error('Error generando narrativa kantiana:', error);
    throw new Error(
      `No se pudo generar la reflexión kantiana: ${
        error.message || 'Error desconocido'
      }`
    );
  }
}
