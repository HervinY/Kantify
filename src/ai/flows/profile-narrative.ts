'use server';
/**
 * @fileOverview Generación de narrativa general del perfil ético usando Groq
 *
 * Esta narrativa se genera UNA SOLA VEZ cuando el usuario ve su perfil completo,
 * basándose en TODAS sus respuestas, no solo en un dilema individual.
 */

import { generateWithGroq } from '@/lib/groq-client';
import type { EthicalProfileAnalysis } from '@/lib/ethical-profile-calculator';
import type { AnsweredDilemma } from '@/lib/types';

export interface ProfileNarrativeInput {
  analysis: EthicalProfileAnalysis;
  answeredDilemmas: AnsweredDilemma[];
  totalDilemmas: number;
}

export interface ProfileNarrativeOutput {
  narrative: string;
}

/**
 * Genera una narrativa kantiana general basada en todo el perfil ético
 */
export async function generateProfileNarrative(
  input: ProfileNarrativeInput
): Promise<ProfileNarrativeOutput> {
  const { analysis, answeredDilemmas, totalDilemmas } = input;

  // Crear un resumen de las respuestas para el prompt
  const topicSummaries = Object.entries(analysis.topicAverages)
    .map(([topic, avg]) => {
      const stdDev = analysis.topicStdDev[topic];
      return `- ${topic}: ${avg.toFixed(2)} promedio (desviación: ${stdDev.toFixed(2)})`;
    })
    .join('\n');

  // Ejemplos de dilemas respondidos
  const exampleDilemmas = answeredDilemmas
    .slice(0, 5) // Solo primeros 5 como ejemplos
    .map((ad, i) => {
      return `${i + 1}. "${ad.dilemma.texto_dilema.substring(0, 100)}..." → Respuesta: ${ad.userResponse.toFixed(2)}`;
    })
    .join('\n');

  const systemPrompt = `Eres un filósofo experto en ética kantiana, especializado en analizar perfiles morales completos y generar reflexiones profundas sobre las implicaciones de universalizar patrones de conducta.

Tu tarea es generar una narrativa inspiradora y reflexiva que ayude al usuario a entender las consecuencias éticas de sus decisiones desde una perspectiva kantiana.`;

  const userPrompt = `Analiza el siguiente perfil ético completo y genera una narrativa kantiana profunda:

**Resumen del perfil:**
- Total de dilemas respondidos: ${totalDilemmas}
- Tendencia general (0-1): ${analysis.overallTendency.toFixed(2)}
- Consistencia ética: ${(analysis.consistency * 100).toFixed(0)}%

**Promedios por tópico ético:**
${topicSummaries}

**Distribución de respuestas:**
- Rechazo (< 0.3): ${analysis.distribution.rejection.toFixed(0)}%
- Neutral (0.3-0.7): ${analysis.distribution.neutral.toFixed(0)}%
- Aceptación (> 0.7): ${analysis.distribution.acceptance.toFixed(0)}%

**Patrones identificados:**
- Más conservador en: ${analysis.patterns.mostConservativeTopic || 'N/A'}
- Más liberal en: ${analysis.patterns.mostLiberalTopic || 'N/A'}
- Más consistente en: ${analysis.patterns.mostConsistentTopic || 'N/A'}

**Ejemplos de dilemas respondidos:**
${exampleDilemmas}

Genera una narrativa (200-300 palabras) en formato "Y si todos..." que:

1. Identifique las máximas éticas implícitas en los patrones de respuesta del usuario
2. Explore qué pasaría si TODOS adoptaran estos principios como ley universal
3. Destaque contradicciones, virtudes o consecuencias notables
4. Ofrezca una reflexión kantiana sobre la coherencia ética del perfil
5. Termine con una pregunta reflexiva que invite a la introspección

La narrativa debe ser:
- Profunda pero accesible
- Respetuosa y no juzgadora
- Inspiradora y constructiva
- EN ESPAÑOL
- Con un tono filosófico pero cálido

Devuelve ÚNICAMENTE un objeto JSON con esta estructura:
{
  "narrative": "La narrativa kantiana completa aquí..."
}`;

  try {
    const response = await generateWithGroq<{ narrative: string }>({
      systemPrompt,
      userPrompt,
      temperature: 0.8, // Más creativo para narrativas
    });

    if (!response.narrative || response.narrative.trim() === '') {
      throw new Error(
        'La IA no pudo generar la narrativa del perfil en el formato esperado.'
      );
    }

    return { narrative: response.narrative };
  } catch (error: any) {
    console.error('Error generando narrativa del perfil:', error);

    // Narrativa de fallback
    return {
      narrative: `**Reflexión sobre tu Perfil Ético**

Has explorado ${totalDilemmas} dilemas morales, revelando patrones únicos en tu razonamiento ético.

Con una tendencia general de ${analysis.overallTendency.toFixed(2)} (donde 0 es muy conservador y 1 es muy liberal), tus decisiones muestran ${
        analysis.consistency > 0.6 ? 'coherencia notable' : 'flexibilidad adaptativa'
      } en diferentes contextos éticos.

Desde una perspectiva kantiana, tus respuestas sugieren que estás navegando el complejo territorio entre principios universales y situaciones particulares.

**¿Qué nos dice esto?**

Si todos adoptaran tu patrón de decisión, veríamos un mundo donde ${
        analysis.distribution.acceptance > 50
          ? 'la apertura y la aceptación predominan'
          : analysis.distribution.rejection > 50
          ? 'la cautela y el escepticismo son valorados'
          : 'el equilibrio y la moderación guían las acciones'
      }.

**Pregunta para reflexionar:**
¿Tus decisiones podrían convertirse en ley universal sin generar contradicciones? ¿Qué ajustes harías a tus principios éticos después de esta reflexión?`,
    };
  }
}
