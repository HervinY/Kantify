/**
 * @fileOverview Calculadora de perfil ético
 * Analiza las respuestas del usuario y genera un perfil ético completo
 */

import type { AnsweredDilemma } from './types';

export interface EthicalProfileAnalysis {
  // Promedios por tópico (0.00 - 1.00)
  topicAverages: Record<string, number>;

  // Desviación estándar por tópico (qué tan consistente es el usuario)
  topicStdDev: Record<string, number>;

  // Tendencia general (0.00 = muy conservador, 1.00 = muy liberal)
  overallTendency: number;

  // Consistencia general (0.00 = muy inconsistente, 1.00 = muy consistente)
  consistency: number;

  // Patrones identificados
  patterns: {
    mostConservativeTopic: string | null;
    mostLiberalTopic: string | null;
    mostConsistentTopic: string | null;
    leastConsistentTopic: string | null;
  };

  // Distribución de respuestas
  distribution: {
    rejection: number; // % de respuestas < 0.3
    neutral: number; // % de respuestas 0.3-0.7
    acceptance: number; // % de respuestas > 0.7
  };
}

/**
 * Calcula la desviación estándar de un array de números
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;

  return Math.sqrt(avgSquareDiff);
}

/**
 * Analiza todas las respuestas del usuario y genera un perfil ético
 */
export function calculateEthicalProfile(
  answeredDilemmas: AnsweredDilemma[]
): EthicalProfileAnalysis {
  if (answeredDilemmas.length === 0) {
    return {
      topicAverages: {},
      topicStdDev: {},
      overallTendency: 0.5,
      consistency: 0,
      patterns: {
        mostConservativeTopic: null,
        mostLiberalTopic: null,
        mostConsistentTopic: null,
        leastConsistentTopic: null,
      },
      distribution: {
        rejection: 0,
        neutral: 0,
        acceptance: 0,
      },
    };
  }

  // Agrupar respuestas por tópico
  const responsesByTopic: Record<string, number[]> = {};

  answeredDilemmas.forEach((ad) => {
    const topic = ad.dilemma.topico_principal;
    if (!responsesByTopic[topic]) {
      responsesByTopic[topic] = [];
    }
    responsesByTopic[topic].push(ad.userResponse);
  });

  // Calcular promedios por tópico
  const topicAverages: Record<string, number> = {};
  Object.keys(responsesByTopic).forEach((topic) => {
    const responses = responsesByTopic[topic];
    topicAverages[topic] =
      responses.reduce((a, b) => a + b, 0) / responses.length;
  });

  // Calcular desviación estándar por tópico
  const topicStdDev: Record<string, number> = {};
  Object.keys(responsesByTopic).forEach((topic) => {
    topicStdDev[topic] = calculateStdDev(responsesByTopic[topic]);
  });

  // Tendencia general
  const allResponses = answeredDilemmas.map((ad) => ad.userResponse);
  const overallTendency =
    allResponses.reduce((a, b) => a + b, 0) / allResponses.length;

  // Consistencia general (inverso de la desviación estándar normalizada)
  const overallStdDev = calculateStdDev(allResponses);
  const consistency = Math.max(0, 1 - overallStdDev * 2); // Normalizar a 0-1

  // Identificar patrones
  const topics = Object.keys(topicAverages);
  const patterns = {
    mostConservativeTopic:
      topics.length > 0
        ? topics.reduce((a, b) => (topicAverages[a] < topicAverages[b] ? a : b))
        : null,
    mostLiberalTopic:
      topics.length > 0
        ? topics.reduce((a, b) => (topicAverages[a] > topicAverages[b] ? a : b))
        : null,
    mostConsistentTopic:
      topics.length > 0
        ? topics.reduce((a, b) => (topicStdDev[a] < topicStdDev[b] ? a : b))
        : null,
    leastConsistentTopic:
      topics.length > 0
        ? topics.reduce((a, b) => (topicStdDev[a] > topicStdDev[b] ? a : b))
        : null,
  };

  // Distribución de respuestas
  const rejectionCount = allResponses.filter((r) => r < 0.3).length;
  const neutralCount = allResponses.filter((r) => r >= 0.3 && r <= 0.7).length;
  const acceptanceCount = allResponses.filter((r) => r > 0.7).length;

  const total = allResponses.length;
  const distribution = {
    rejection: (rejectionCount / total) * 100,
    neutral: (neutralCount / total) * 100,
    acceptance: (acceptanceCount / total) * 100,
  };

  return {
    topicAverages,
    topicStdDev,
    overallTendency,
    consistency,
    patterns,
    distribution,
  };
}

/**
 * Genera un resumen textual del perfil ético
 */
export function generateProfileSummary(
  analysis: EthicalProfileAnalysis,
  totalDilemmas: number
): string {
  if (totalDilemmas === 0) {
    return 'Aún no has respondido ningún dilema. Explora algunos dilemas para generar tu perfil ético.';
  }

  const { overallTendency, consistency, patterns, distribution } = analysis;

  let tendencyText = '';
  if (overallTendency < 0.4) {
    tendencyText = 'conservadora o cautelosa';
  } else if (overallTendency > 0.6) {
    tendencyText = 'liberal o progresista';
  } else {
    tendencyText = 'balanceada y moderada';
  }

  let consistencyText = '';
  if (consistency > 0.7) {
    consistencyText = 'muy consistente';
  } else if (consistency > 0.4) {
    consistencyText = 'moderadamente consistente';
  } else {
    consistencyText = 'variable y adaptativa';
  }

  const topicCount = Object.keys(analysis.topicAverages).length;

  // Interpretación narrativa de la distribución
  let distributionText = '';
  if (distribution.acceptance > 60) {
    distributionText = 'La mayoría de tus decisiones muestran apertura y aceptación ante los dilemas éticos presentados';
  } else if (distribution.rejection > 60) {
    distributionText = 'Predomina la cautela y el escepticismo en tus decisiones morales';
  } else if (distribution.neutral > 40) {
    distributionText = 'Tu enfoque ético tiende a la ambivalencia reflexiva, evaluando cada situación con matices';
  } else {
    distributionText = 'Tus decisiones revelan un equilibrio entre apertura, cautela y reflexión contextual';
  }

  return `Has reflexionado sobre ${totalDilemmas} dilema${totalDilemmas === 1 ? '' : 's'} ético${totalDilemmas === 1 ? '' : 's'}, explorando ${topicCount} dimensión${topicCount === 1 ? '' : 'es'} de la filosofía moral.

Tu perfil revela una tendencia ética ${tendencyText.toUpperCase()}, con un patrón de decisión ${consistencyText.toUpperCase()}. ${distributionText}.

${
  patterns.mostConservativeTopic && patterns.mostLiberalTopic && patterns.mostConservativeTopic !== patterns.mostLiberalTopic
    ? `\n🔍 Patrones identificados:
• Mayor cautela en ${patterns.mostConservativeTopic}
• Mayor apertura en ${patterns.mostLiberalTopic}

Esta tensión entre tópicos revela una ética multidimensional que adapta sus principios según el contexto.`
    : patterns.mostConsistentTopic
    ? `\n🎯 Patrón destacado:
Muestras mayor consistencia en tus decisiones sobre ${patterns.mostConsistentTopic}, lo que sugiere principios bien definidos en esta área.`
    : ''
}`;
}
