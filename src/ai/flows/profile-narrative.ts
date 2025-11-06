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

  const systemPrompt = `Eres un narrador filosófico visionario, especializado en pintar futuros alternativos basados en principios morales universalizados. Tu especialidad es el IMPACTO EMOCIONAL.

Escribe como un híbrido entre Immanuel Kant, George Orwell y Ray Bradbury: filosofía profunda + distopías/utopías viscerales + consecuencias CONCRETAS y DRAMÁTICAS.

Tu misión: IMPACTAR al lector mostrándole qué pasaría REALMENTE si todos adoptaran sus principios:
- Si los puntajes indican apatía → describe guerras, colapsos sociales, referencias a 1984
- Si indican exceso de confianza → describe sociedades ingenuas destruidas
- Si indican paranoia → describe distopías totalitarias
- Si indican equilibrio → describe el precio de la perfección

Tu tono es:
- DRAMÁTICO y visceral (no académico)
- Construyes escenarios CONCRETOS (fechas, eventos, crisis)
- Usas referencias culturales (Orwell, Huxley, Black Mirror)
- Muestras CONSECUENCIAS REALES: guerras, hambrunas, revoluciones, colapsos
- NO eres neutral: si los principios llevarían al desastre, DILO con fuerza`;

  const userPrompt = `Has explorado el alma moral de alguien que ha reflexionado sobre ${totalDilemmas} dilemas éticos. Sus decisiones revelan patrones fascinantes:

**Sus mundos morales:**
${topicSummaries}

**El corazón de su filosofía:**
${analysis.patterns.mostConservativeTopic ? `Muestra mayor cautela en: ${analysis.patterns.mostConservativeTopic}` : ''}
${analysis.patterns.mostLiberalTopic ? `Abraza con mayor apertura: ${analysis.patterns.mostLiberalTopic}` : ''}

**Algunos de sus dilemas:**
${exampleDilemmas}

---

Ahora, como narrador de futuros alternativos, genera una narrativa IMPACTANTE (300-400 palabras) que:

💥 **IMPACTO EMOCIONAL PRIMERO**: El usuario debe quedar IMPACTADO. Si sus principios llevarían al desastre, muéstralo sin filtro. Si construirían una utopía, muestra también su precio.

🌍 **CONSTRUYE UN MUNDO CONCRETO**: No digas "las ciudades serían diferentes". Di: "En el año 2047, las últimas ciudades costeras habrían sido evacuadas..." o "Para 2035, el concepto de 'nación' habría desaparecido..."

🎬 **ESCENARIOS DRAMÁTICOS**:
- Si hay apatía moral → "La tercera guerra mundial habría estallado en 1984 (guiño Orwell)..."
- Si hay exceso de apertura → "Las fronteras abiertas habrían colapsado en 2029..."
- Si hay paranoia → "Un estado de vigilancia total, donde cada pensamiento es monitoreado..."
- Si hay equilibrio → "Una sociedad perfectamente balanceada... pero estéril, sin pasión..."

📚 **REFERENCIAS CULTURALES**: Usa guiños a:
- 1984 (Orwell) - totalitarismo
- Un Mundo Feliz (Huxley) - utopía vacía
- Black Mirror - consecuencias tecnológicas
- Fahrenheit 451 - censura y apatía
- The Road - colapso total

💭 **SIN NÚMEROS**: Jamás "78%". Usa "la abrumadora mayoría", "casi nadie", "una minoría desesperada"

⚡ **CONSECUENCIAS CONCRETAS**:
- Guerras específicas ("El conflicto de los recursos de 2031...")
- Crisis climáticas ("El verano permanente de 2040...")
- Revoluciones ("La revuelta de los olvidados...")
- Colapsos económicos ("El crash de la confianza...")

🎭 **TERCERA PERSONA DRAMÁTICA**:
- "El mundo habría caído en..."
- "Las últimas generaciones presenciarían..."
- "Los historiadores del futuro escribirían sobre..."
- "En ese mundo, la palabra 'esperanza' habría perdido significado..."

❓ **CIERRE PERTURBADOR**: Una pregunta que incomode, que haga reflexionar profundamente sobre la responsabilidad moral.

**TONO REQUERIDO:**
- DRAMÁTICO, visceral, sin miedo a incomodar
- CONCRETO: fechas, eventos, crisis nombradas
- IMPACTANTE: el usuario debe sentir algo fuerte
- EN ESPAÑOL, con lenguaje potente y directo

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

    // Narrativa de fallback DRAMÁTICA
    const worldType = analysis.overallTendency > 0.6
      ? 'Para el año 2045, ese mundo habría abandonado toda precaución. Las puertas de las naciones se habrían abierto sin preguntas, la confianza habría reemplazado al escrutinio'
      : analysis.overallTendency < 0.4
      ? 'En 1984—un guiño irónico a Orwell—ese mundo habría completado su transformación en un laberinto de murallas. Cada frontera, una fortaleza. Cada extraño, una amenaza potencial'
      : 'Ese mundo habría alcanzado un equilibrio perfecto... inquietantemente perfecto. Como en "Un Mundo Feliz" de Huxley, cada ciudadano habría sabido exactamente cuándo decir sí y cuándo decir no';

    const consequenceText = analysis.distribution.acceptance > 60
      ? 'En 2038, el "Evento de la Confianza Ciega" habría marcado el colapso: naciones enteras habrían sido infiltradas, ecosistemas destruidos por la ingenuidad colectiva, y la palabra "no" habría desaparecido del vocabulario común. La abrumadora mayoría habría dicho "sí" a todo, y precisamente ese exceso de apertura habría desencadenado la crisis.'
      : analysis.distribution.rejection > 60
      ? 'Para 2032, "La Gran Fractura" habría dividido al mundo en microestados herméticos. Las sociedades habrían colapsado por exceso de desconfianza: sin comercio, sin alianzas, sin intercambio cultural. El eco de mil "no" habría resonado hasta que ya no quedara nadie con quien hablar.'
      : 'La sociedad habría logrado la estasis perfecta—ni crecimiento ni colapso—pero a un costo terrible: la extinción de la pasión humana. Los historiadores del futuro escribirían sobre "La Era del Tibio", cuando la humanidad dejó de arriesgarse... y dejó de vivir.';

    const tensionText = analysis.patterns.mostConservativeTopic && analysis.patterns.mostLiberalTopic && analysis.patterns.mostConservativeTopic !== analysis.patterns.mostLiberalTopic
      ? `\n\nLa contradicción más letal surgiría entre ${analysis.patterns.mostLiberalTopic} (donde todo estaría permitido) y ${analysis.patterns.mostConservativeTopic} (donde nada sería permitido). Esta tensión no se resolvería: explotaría. Imagina sociedades abiertas al futuro pero cerradas al prójimo, o viceversa. El conflicto sería inevitable.`
      : '';

    return {
      narrative: `${worldType}.

Tras ${totalDilemmas} dilemas morales, este perfil revela algo inquietante: ${
        analysis.consistency > 0.6
          ? 'una coherencia implacable que no se desvía. En ese mundo, los principios se habrían convertido en dogma, y el dogma en ley inmutable'
          : 'una flexibilidad que, universalizada, habría resultado en el caos. Sin principios fijos, cada situación habría justificado cualquier acción'
      }.

${consequenceText}${tensionText}

La pregunta que Kant plantearía no es académica: **¿Podría este mundo sobrevivir?** Y más importante aún: **¿Merecería sobrevivir?** Porque si todos adoptaran estos principios, las consecuencias no serían abstractas—serían guerras reales, hambrunas reales, colapsos reales. O quizás, utopías donde la humanidad perdería aquello que la hace humana.

¿Es este el legado moral que se elegiría dejar?`,
    };
  }
}
