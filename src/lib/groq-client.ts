/**
 * @fileOverview Cliente de Groq para generación de contenido IA
 * Usa modelos de código abierto gratuitos y rápidos
 */

import Groq from 'groq-sdk';

// Validar que la API key existe
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn(
    '⚠️ GROQ_API_KEY no está configurada. Por favor, agrega tu clave en .env.local'
  );
}

// Inicializar cliente Groq
export const groq = new Groq({
  apiKey: apiKey || '',
});

// Modelos disponibles en Groq (todos gratuitos):
// - llama-3.3-70b-versatile: Más potente, mejor para razonamiento complejo
// - llama-3.1-70b-versatile: Balance entre velocidad y calidad
// - mixtral-8x7b-32768: Muy rápido, gran contexto
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Genera contenido usando Groq con validación de respuesta JSON
 */
export async function generateWithGroq<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  model?: string;
}): Promise<T> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    model = DEFAULT_MODEL,
  } = params;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      console.error('❌ No se recibió respuesta del modelo Groq');
      throw new Error('No se recibió respuesta del modelo');
    }

    console.log('📝 Respuesta de Groq:', responseText.substring(0, 200) + '...');

    // Parsear la respuesta JSON de forma más robusta
    try {
      const parsed = JSON.parse(responseText) as T;

      // Validar que el objeto parseado no esté vacío
      if (!parsed || Object.keys(parsed).length === 0) {
        console.error('❌ JSON parseado está vacío');
        throw new Error('La respuesta JSON está vacía');
      }

      return parsed;
    } catch (parseError: any) {
      console.error('❌ Error parseando JSON:', parseError);
      console.error('📄 Contenido que falló:', responseText);
      throw new Error(`Error parseando respuesta JSON: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error('❌ Error en generateWithGroq:', error);

    // Mensajes de error más específicos
    if (error.message?.includes('API key')) {
      throw new Error('API key de Groq inválida o no configurada');
    }
    if (error.message?.includes('rate limit')) {
      throw new Error('Límite de tasa excedido. Intenta de nuevo en unos segundos');
    }

    throw new Error(
      `Error de Groq: ${error.message || 'Error desconocido'}`
    );
  }
}
