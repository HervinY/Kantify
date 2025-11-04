'use server';
/**
 * @fileOverview Generación de dilemas éticos personalizados usando Groq (LLaMA 3.3)
 *
 * - generatePersonalizedDilemma - Genera un dilema ético personalizado
 * - GeneratePersonalizedDilemmaInput - Tipo de entrada para la generación
 * - GeneratePersonalizedDilemmaOutput - Tipo de salida
 */

import { generateWithGroq } from '@/lib/groq-client';
import { z } from 'zod';

// Esquemas de validación
const GeneratePersonalizedDilemmaInputSchema = z.object({
  topic: z.string(),
  intensity: z.string(),
  userContext: z.string().optional(),
  seedExamples: z.array(
    z.object({
      id_dilema: z.string(),
      texto_dilema: z.string(),
      topico_principal: z.string(),
      intensidad: z.string(),
      variable_oculta_primaria: z.string(),
    })
  ),
});

export type GeneratePersonalizedDilemmaInput = z.infer<
  typeof GeneratePersonalizedDilemmaInputSchema
>;

const GeneratePersonalizedDilemmaOutputSchema = z.object({
  dilemmaText: z.string(),
});

export type GeneratePersonalizedDilemmaOutput = z.infer<
  typeof GeneratePersonalizedDilemmaOutputSchema
>;

/**
 * Genera un dilema ético personalizado usando Groq
 */
export async function generatePersonalizedDilemma(
  input: GeneratePersonalizedDilemmaInput
): Promise<GeneratePersonalizedDilemmaOutput> {
  const { topic, intensity, userContext, seedExamples } = input;

  // Construir ejemplos para el prompt
  const examplesText = seedExamples
    .map(
      (example, index) =>
        `Ejemplo ${index + 1}: ${example.texto_dilema} (Variable oculta: ${
          example.variable_oculta_primaria
        })`
    )
    .join('\n');

  // Contexto del usuario
  const contextSection = userContext
    ? `\nConsidera el siguiente contexto sobre el usuario (basado en sus respuestas previas):\n'${userContext}'\n`
    : '';

  const systemPrompt = `Eres un experto filósofo y psicólogo diseñando dilemas éticos para la app Kantify.
Tu tarea es generar dilemas éticos originales y provocadores que inviten a la reflexión profunda.`;

  const userPrompt = `Basándote en los siguientes ejemplos de dilemas sobre el tópico '${topic}' y de intensidad '${intensity}':

${examplesText}
${contextSection}
Genera UN NUEVO Y ORIGINAL dilema ético que:
1. Pertenezca claramente al tópico '${topic}'.
2. Tenga una intensidad comparable a '${intensity}'.
3. Explore una faceta de la variable oculta asociada a este tópico.
4. Sea conciso, claro y provoque reflexión, al estilo de los ejemplos.
5. NO repita los ejemplos proporcionados.

Devuelve tu respuesta ÚNICAMENTE como un objeto JSON válido con esta estructura exacta:
{
  "dilemmaText": "El texto del nuevo dilema aquí..."
}`;

  try {
    const response = await generateWithGroq<{ dilemmaText: string }>({
      systemPrompt,
      userPrompt,
      temperature: 0.8, // Más creativo
    });

    if (!response.dilemmaText || response.dilemmaText.trim() === '') {
      throw new Error(
        'La IA no pudo generar el texto del dilema en el formato esperado.'
      );
    }

    return { dilemmaText: response.dilemmaText };
  } catch (error: any) {
    console.error('Error generando dilema:', error);
    throw new Error(
      `No se pudo generar el dilema: ${error.message || 'Error desconocido'}`
    );
  }
}
