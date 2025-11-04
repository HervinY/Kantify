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

🌍 **CONSTRUYE UN MUNDO EN TERCERA PERSONA**: Describe vívidamente cómo SERÍA un mundo donde TODOS adoptaran estas máximas como ley universal.

📖 **NARRA EN TERCERA PERSONA**: Usa verbos en futuro o condicional: "Las ciudades serían...", "Las calles resonarían...", "Los vecindarios tendrían...", "La gente viviría..."

🎭 **EJEMPLOS CONCRETOS**: "En ese mundo, las ciudades estarían llenas de...", "Los barrios se caracterizarían por...", "Las plazas públicas verían..."

💭 **CERO NÚMEROS O PORCENTAJES**: Jamás digas "78% de aceptación" o "promedio de 0.79". En su lugar: "una fuerte inclinación hacia...", "una clara tendencia a...", "un patrón de apertura predominante..."

🔮 **CONSECUENCIAS TANGIBLES**: ¿Cómo serían las relaciones humanas? ¿El medio ambiente? ¿La confianza social? ¿Las generaciones futuras?

⚡ **TENSIONES NARRATIVAS**: Si hay contradicciones, narrálas: "Por un lado, las personas... pero por otro, la sociedad..."

❓ **PREGUNTA FINAL PROFUNDA**: En tercera persona o reflexiva, que invite a pensar sobre universalizabilidad.

**PERSPECTIVA OBLIGATORIA:**
- TERCERA PERSONA: "Las ciudades serían...", "La gente viviría...", "Los barrios tendrían..."
- NUNCA segunda persona: NO "Imagina", NO "Visualiza", NO "Piensa en"
- Narrativo como un cuento sobre un mundo alternativo
- Filosóficamente profundo pero accesible
- EN ESPAÑOL, con lenguaje vivo y concreto

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

    // Narrativa de fallback en tercera persona
    const worldType = analysis.overallTendency > 0.6
      ? 'En ese mundo, las puertas se abrirían antes de ser tocadas, y la confianza precedería a la evidencia'
      : analysis.overallTendency < 0.4
      ? 'Sería un mundo de murallas cuidadosamente construidas, donde cada paso sería meditado y cada riesgo, sopesado'
      : 'Sería un mundo de equilibristas morales, donde cada decisión pendería de un hilo entre la apertura y la cautela';

    return {
      narrative: `${worldType}.

Tras reflexionar sobre ${totalDilemmas} dilemas morales, este perfil ético revela un patrón fascinante: ${
        analysis.consistency > 0.6
          ? 'una firmeza que atraviesa situaciones distintas como un hilo de oro en una tela compleja'
          : 'una flexibilidad que se adapta al contexto, como un río que encuentra su cauce en cada terreno'
      }.

Desde la perspectiva kantiana, estas decisiones construyen una máxima implícita, un principio que guiaría la brújula moral de toda una sociedad. Si este principio se convirtiera en ley universal, si cada persona en el planeta lo adoptara mañana al despertar, el mundo cambiaría profundamente.

Las calles de ese mundo resonarían con ${
        analysis.distribution.acceptance > 50
          ? 'el murmullo de "sí" constantes, de brazos abiertos y riesgos asumidos. Las personas abrazarían oportunidades sin hesitar, pero quizás faltaría quien se detuviera a preguntarse: ¿deberíamos?'
          : analysis.distribution.rejection > 50
          ? 'el eco de precauciones y puertas cerradas. La sociedad sería más segura, quizás, pero a costa de dejar inexploradas infinitas posibilidades'
          : 'una danza constante entre el sí y el no, entre abrir y cerrar, entre avanzar y detenerse. Un equilibrio precario, pero equilibrio al fin'
      }

${
        analysis.patterns.mostConservativeTopic && analysis.patterns.mostLiberalTopic
          ? `La tensión más fascinante surgiría entre ${analysis.patterns.mostLiberalTopic} (donde la apertura reinaría) y ${analysis.patterns.mostConservativeTopic} (donde la cautela prevalecería). Esta contradicción plantearía una pregunta inevitable: `
          : 'La pregunta fundamental que este mundo plantearía sería: '
      }¿puede una sociedad sostenerse cuando sus principios morales ${
        analysis.consistency > 0.6 ? 'son coherentes pero quizás rígidos' : 'son flexibles pero quizás inconsistentes'
      }?`,
    };
  }
}
