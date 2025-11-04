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

  const systemPrompt = `Eres un narrador filosófico magistral, especializado en ética kantiana. Tu don especial es transformar patrones de decisiones morales en narrativas evocadoras que transportan al lector a mundos posibles.

Escribe como un híbrido entre Immanuel Kant y Gabriel García Márquez: profundidad filosófica con narrativa envolvente. Tu estilo es:
- Narrativo y evocador, NO técnico ni académico
- Construyes mundos y escenarios, NO listas métricas
- Usas metáforas y ejemplos concretos, NO porcentajes
- Hablas de personas, sociedades y consecuencias reales
- Tu tono es reflexivo, poético y profundo`;

  const userPrompt = `Has explorado el alma moral de alguien que ha reflexionado sobre ${totalDilemmas} dilemas éticos. Sus decisiones revelan patrones fascinantes:

**Sus mundos morales:**
${topicSummaries}

**El corazón de su filosofía:**
${analysis.patterns.mostConservativeTopic ? `Muestra mayor cautela en: ${analysis.patterns.mostConservativeTopic}` : ''}
${analysis.patterns.mostLiberalTopic ? `Abraza con mayor apertura: ${analysis.patterns.mostLiberalTopic}` : ''}

**Algunos de sus dilemas:**
${exampleDilemmas}

---

Ahora, como narrador filosófico kantiano, genera una narrativa envolvente (250-350 palabras) que:

🌍 **CONSTRUYE UN MUNDO**: Imagina y describe vívidamente cómo sería un mundo donde TODOS adoptaran estas máximas como ley universal.

📖 **CUENTA UNA HISTORIA**: No listes métricas. Narra escenarios concretos, pinta escenas, describe consecuencias tangibles.

🎭 **USA METÁFORAS Y EJEMPLOS**: "Imagina una ciudad donde...", "Piensa en un vecindario donde...", "Visualiza una sociedad en la que..."

💭 **SIN NÚMEROS NI PORCENTAJES**: Jamás digas "78% de aceptación" o "promedio de 0.79". En su lugar: "una fuerte inclinación hacia...", "una clara tendencia a...", "un patrón de apertura predominante..."

🔮 **EXPLORA CONSECUENCIAS REALES**: ¿Qué le pasaría a las relaciones humanas? ¿Al medio ambiente? ¿A la confianza social? ¿A las generaciones futuras?

⚡ **IDENTIFICA TENSIONES**: Si hay contradicciones, narrálas como dilemas vivos: "Por un lado... pero por otro..."

❓ **TERMINA CON UNA PREGUNTA PROFUNDA**: Que invite a reflexionar sobre la universalizabilidad de sus principios.

**ESTILO REQUERIDO:**
- Narrativo y evocador (como una historia)
- Filosóficamente profundo pero accesible
- Poético sin ser cursi
- EN ESPAÑOL, con lenguaje vivo y concreto
- Sin juzgar, pero sí desafiando al pensamiento

Devuelve ÚNICAMENTE un objeto JSON:
{
  "narrative": "Tu narrativa kantiana envolvente aquí, sin métricas, solo mundo e historia..."
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

    // Narrativa de fallback más envolvente
    const worldType = analysis.overallTendency > 0.6
      ? 'un mundo donde las puertas se abren antes de ser tocadas, donde la confianza precede a la evidencia'
      : analysis.overallTendency < 0.4
      ? 'un mundo de murallas cuidadosamente construidas, donde cada paso es meditado y cada riesgo, sopesado'
      : 'un mundo de equilibristas morales, donde cada decisión pende de un hilo entre la apertura y la cautela';

    return {
      narrative: `Imagina por un momento ${worldType}.

Has reflexionado sobre ${totalDilemmas} dilemas morales, y en cada uno has dejado una huella, un rastro de tus principios más íntimos. Tus elecciones, como fragmentos de un espejo roto, revelan un patrón: ${
        analysis.consistency > 0.6
          ? 'una firmeza que atraviesa situaciones distintas como un hilo de oro en una tela compleja'
          : 'una flexibilidad que se adapta al contexto, como un río que encuentra su cauce en cada terreno'
      }.

Desde la mirada de Kant, tus respuestas construyen una máxima implícita, un principio que guía tu brújula moral. Si este principio se convirtiera en ley universal, si cada persona en el planeta lo adoptara mañana al despertar, viviríamos en una sociedad muy particular.

Las calles resonarían con ${
        analysis.distribution.acceptance > 50
          ? 'el murmullo de "sí" constantes, de brazos abiertos y riesgos asumidos. Pero, ¿qué pasaría cuando todos dijeran sí simultáneamente? ¿Quién se detendría a preguntarse si deberíamos?'
          : analysis.distribution.rejection > 50
          ? 'el eco de precauciones y puertas cerradas. Un mundo más seguro, quizás, pero ¿a qué costo? ¿Cuántas posibilidades quedarían sin explorar?'
          : 'una danza constante entre el sí y el no, entre abrir y cerrar, entre avanzar y detenerse. Un equilibrio precario, pero equilibrio al fin'
      }

La pregunta que Kant te haría, observando este mundo que tus principios construirían, es simple pero profunda: ¿Podrías vivir en él? ¿Te reconocerías en un mundo donde tu máxima personal se convierte en la norma de todos?`,
    };
  }
}
