"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type {
  Dilemma,
  AnsweredDilemma,
  EthicalProfile,
  AnyDilemma,
  RAGDilemma,
} from "@/lib/types";
import AllDilemmasSeed from "@/data/corpus_dilemas.json";
import { ragApiClient, type RAGDilemmaRequest } from "@/lib/api-client";
import {
  calculateEthicalProfile,
  generateProfileSummary,
} from "@/lib/ethical-profile-calculator";
import { useToast } from "@/hooks/use-toast";

interface AppState {
  sessionUUID: string | null;
  corpusDilemmas: Dilemma[];
  answeredDilemmas: AnsweredDilemma[];
  currentDilemma: (AnyDilemma & { kantianNarrative?: string | null }) | null;
  isLoadingAi: boolean;
  ethicalProfile: EthicalProfile | null;
}

interface AppContextType extends AppState {
  initializeSession: () => void;
  answerAndReflect: (responseValue: number) => Promise<void>;
  getNextDilemmaFromCorpus: () => void;
  generateAndSetNewDilemma: (
    topic: string,
    intensity: "Suave" | "Medio" | "Extremo"
  ) => Promise<void>;
  generateProfile: () => void;
  clearSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialCorpusDilemmas: Dilemma[] = AllDilemmasSeed as Dilemma[];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessionUUID, setSessionUUID] = useState<string | null>(null);
  const [corpusDilemmas] = useState<Dilemma[]>(initialCorpusDilemmas);
  const [answeredDilemmas, setAnsweredDilemmas] = useState<AnsweredDilemma[]>(
    []
  );
  const [currentDilemma, setCurrentDilemma] = useState<
    (AnyDilemma & { kantianNarrative?: string | null }) | null
  >(null);
  const [currentCorpusIndex, setCurrentCorpusIndex] = useState<number>(0);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [ethicalProfile, setEthicalProfile] = useState<EthicalProfile | null>(
    null
  );
  const { toast } = useToast();

  const tryGenerateInitialRAGDilemma = useCallback(async () => {
    try {
      // Intentar generar un dilema RAG inicial sin mostrar loading
      const ragRequest: RAGDilemmaRequest = {
        topic: "Temporalidad Moral", // Tema por defecto
        intensity: "Suave",
        user_context: "Este es el primer dilema para el usuario.",
      };

      const result = await ragApiClient.generateDilemma(ragRequest);

      const initialRAGDilemma: RAGDilemma = {
        id_dilema: `rag-initial-${Date.now()}`,
        texto_dilema: result.dilemma_text,
        topico_principal: result.topic,
        intensidad: result.intensity as "Suave" | "Medio" | "Extremo",
        philosophical_foundation: result.philosophical_foundation,
        source: "rag",
      };

      // Solo reemplazar si el usuario no ha interactuado aún
      setCurrentDilemma((prev) => {
        if (prev && prev.id_dilema === "TM_S_01") {
          // Solo reemplazar el dilema inicial del corpus
          return { ...initialRAGDilemma, kantianNarrative: null };
        }
        return prev;
      });
    } catch (error) {
      // Fallar silenciosamente, mantener el dilema del corpus
      console.log(
        "No se pudo generar dilema RAG inicial, manteniendo dilema del corpus"
      );
    }
  }, []);

  const initializeSession = useCallback(() => {
    let storedUUID = localStorage.getItem("kantifySessionUUID");
    if (!storedUUID) {
      storedUUID = crypto.randomUUID();
      localStorage.setItem("kantifySessionUUID", storedUUID);
    }
    setSessionUUID(storedUUID);

    const storedAnswers = localStorage.getItem(`kantifyAnswers-${storedUUID}`);
    if (storedAnswers) {
      const parsedAnswers = JSON.parse(storedAnswers) as AnsweredDilemma[];
      parsedAnswers.forEach((ans) => (ans.timestamp = new Date(ans.timestamp)));
      setAnsweredDilemmas(parsedAnswers);
    } else {
      setAnsweredDilemmas([]);
    }

    setEthicalProfile(null);
    setCurrentCorpusIndex(0);

    if (corpusDilemmas.length > 0) {
      const firstDilemma = corpusDilemmas[0];
      // Chequear si este dilema ya fue respondido para mostrar su narrativa si existe
      const alreadyAnswered = answeredDilemmas.find(
        (ad) => ad.dilemma.id_dilema === firstDilemma.id_dilema
      );
      if (alreadyAnswered) {
        setCurrentDilemma({
          ...firstDilemma,
          kantianNarrative: alreadyAnswered.kantianNarrative || null,
        });
      } else {
        setCurrentDilemma({ ...firstDilemma, kantianNarrative: null });
        // Intentar generar un dilema RAG inicial en paralelo
        tryGenerateInitialRAGDilemma();
      }
    } else {
      setCurrentDilemma(null);
      toast({
        title: "Sin dilemas",
        description: "No se pudo cargar el corpus inicial de dilemas.",
        variant: "destructive",
      });
    }
  }, [corpusDilemmas, toast, tryGenerateInitialRAGDilemma]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (sessionUUID && answeredDilemmas.length > 0) {
      localStorage.setItem(
        `kantifyAnswers-${sessionUUID}`,
        JSON.stringify(answeredDilemmas)
      );
    } else if (sessionUUID && answeredDilemmas.length === 0) {
      localStorage.removeItem(`kantifyAnswers-${sessionUUID}`);
    }
  }, [sessionUUID, answeredDilemmas]);

  const answerAndReflect = async (responseValue: number) => {
    if (!currentDilemma) return;
    setIsLoadingAi(true);

    try {
      // Solo guardamos la respuesta, SIN generar narrativa kantiana
      const { kantianNarrative, ...originalDilemmaForRecord } = currentDilemma;

      const newAnsweredDilemma: AnsweredDilemma = {
        dilemma: originalDilemmaForRecord as AnyDilemma,
        userResponse: responseValue,
        kantianNarrative: null, // Se generará solo en el perfil final
        timestamp: new Date(),
      };

      setAnsweredDilemmas((prev) => [...prev, newAnsweredDilemma]);

      // Mostrar toast de éxito
      toast({
        title: "¡Respuesta guardada!",
        description: `Has respondido ${answeredDilemmas.length + 1} dilema(s). Continúa reflexionando.`,
        variant: "default",
      });

      // Cargar el siguiente dilema automáticamente
      // Intentar generar uno con RAG, si falla usar corpus
      try {
        const userContext = `El usuario ha respondido a ${
          answeredDilemmas.length + 1
        } dilemas. La última respuesta sobre el tópico '${
          currentDilemma.topico_principal
        }' fue ${responseValue.toFixed(2)}.`;

        const availableTopics = [
          "Temporalidad Moral",
          "Alteridad Radical",
          "Imperativo de Universalización",
          "Ontología de la Ignorancia",
          "Economía Moral del Deseo",
          "Microética Cotidiana",
        ];
        const randomTopic =
          availableTopics[Math.floor(Math.random() * availableTopics.length)];
        const randomIntensity = ["Suave", "Medio", "Extremo"][
          Math.floor(Math.random() * 3)
        ] as "Suave" | "Medio" | "Extremo";

        const ragRequest: RAGDilemmaRequest = {
          topic: randomTopic,
          intensity: randomIntensity,
          user_context: userContext,
        };

        const result = await ragApiClient.generateDilemma(ragRequest);

        const newRAGDilemma: RAGDilemma = {
          id_dilema: `rag-auto-${Date.now()}`,
          texto_dilema: result.dilemma_text,
          topico_principal: result.topic,
          intensidad: result.intensity as "Suave" | "Medio" | "Extremo",
          philosophical_foundation: result.philosophical_foundation,
          source: "rag",
        };

        setCurrentDilemma({ ...newRAGDilemma, kantianNarrative: null });
      } catch (ragError: any) {
        console.log("RAG no disponible, usando corpus:", ragError.message);
        // Fallback: siguiente dilema del corpus
        getNextDilemmaFromCorpus();
      }

      setIsLoadingAi(false);
    } catch (error: any) {
      console.error("Error guardando respuesta:", error);
      toast({
        title: "Error",
        description: `No se pudo guardar la respuesta: ${
          error.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
      setIsLoadingAi(false);
    }
  };

  const getNextDilemmaFromCorpus = () => {
    if (corpusDilemmas.length === 0) {
      toast({
        title: "Sin dilemas",
        description: "No hay más dilemas en el corpus.",
        variant: "default",
      });
      return;
    }
    setIsLoadingAi(true);
    const nextIndex = (currentCorpusIndex + 1) % corpusDilemmas.length;
    setCurrentCorpusIndex(nextIndex);
    const nextDilemma = corpusDilemmas[nextIndex];
    const alreadyAnswered = answeredDilemmas.find(
      (ad) => ad.dilemma.id_dilema === nextDilemma.id_dilema
    );
    if (alreadyAnswered) {
      setCurrentDilemma({
        ...nextDilemma,
        kantianNarrative: alreadyAnswered.kantianNarrative || null,
      });
    } else {
      setCurrentDilemma({ ...nextDilemma, kantianNarrative: null });
    }
    setIsLoadingAi(false);
  };

  const generateAndSetNewDilemma = async (
    topic: string,
    intensity: "Suave" | "Medio" | "Extremo"
  ) => {
    setIsLoadingAi(true);

    try {
      const userContext =
        answeredDilemmas.length > 0
          ? `El usuario ha respondido a ${
              answeredDilemmas.length
            } dilemas. La última respuesta sobre el tópico '${
              answeredDilemmas[answeredDilemmas.length - 1].dilemma
                .topico_principal
            }' fue ${
              answeredDilemmas[answeredDilemmas.length - 1].userResponse
            }.`
          : "Este es el primer dilema generado para el usuario.";

      const ragRequest: RAGDilemmaRequest = {
        topic,
        intensity,
        user_context: userContext,
      };

      const result = await ragApiClient.generateDilemma(ragRequest);

      const newRAGDilemma: RAGDilemma = {
        id_dilema: `rag-${Date.now()}`,
        texto_dilema: result.dilemma_text,
        topico_principal: result.topic,
        intensidad: result.intensity as "Suave" | "Medio" | "Extremo",
        philosophical_foundation: result.philosophical_foundation,
        source: "rag",
      };
      setCurrentDilemma({ ...newRAGDilemma, kantianNarrative: null });

      toast({
        title: "Dilema generado",
        description:
          "Nuevo dilema basado en fundamentos filosóficos generado exitosamente.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error generando dilema con RAG:", error);
      toast({
        title: "Error de RAG",
        description: `No se pudo generar un nuevo dilema: ${
          error.message || "Error desconocido"
        }. Se mostrará uno del corpus.`,
        variant: "destructive",
      });
      // Fallback a un dilema del corpus si la generación RAG falla
      getNextDilemmaFromCorpus();
    } finally {
      setIsLoadingAi(false);
    }
  };

  const generateProfile = useCallback(() => {
    setIsLoadingAi(true);

    if (answeredDilemmas.length === 0) {
      setEthicalProfile({
        summary:
          "Aún no has respondido a ningún dilema. Explora algunos dilemas para generar tu perfil ético.",
        visual_data: {},
        answeredDilemmas: [],
      });
      setIsLoadingAi(false);
      return;
    }

    // Usar el nuevo sistema de cálculo de perfil ético
    const analysis = calculateEthicalProfile(answeredDilemmas);
    const summary = generateProfileSummary(analysis, answeredDilemmas.length);

    setEthicalProfile({
      summary,
      visual_data: {
        totalAnswered: answeredDilemmas.length,
        topicsList: Object.keys(analysis.topicAverages),
        averageResponsePerTopic: analysis.topicAverages,
        analysis, // Incluir el análisis completo
      },
      answeredDilemmas: [...answeredDilemmas].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
    });

    setIsLoadingAi(false);
  }, [answeredDilemmas]);

  const clearSession = () => {
    if (sessionUUID) {
      localStorage.removeItem(`kantifyAnswers-${sessionUUID}`);
      localStorage.removeItem("kantifySessionUUID");
    }
    setSessionUUID(null);
    setAnsweredDilemmas([]);
    setCurrentDilemma(null);
    setEthicalProfile(null);
    setCurrentCorpusIndex(0);
    // No llames a initializeSession() aquí directamente para evitar bucles,
    // el useEffect [initializeSession] se encargará si es necesario un nuevo UUID.
    // Forzamos una recarga para asegurar un estado limpio si es necesario.
    // window.location.reload(); // O una forma más suave de re-inicializar el estado
    // Mejor, simplemente permitir que el useEffect de initializeSession haga su trabajo
    // al detectar que sessionUUID es null.
    // Para forzar la creación de un nuevo UUID, primero establecemos sessionUUID a null
    // y luego llamamos a initializeSession en el siguiente ciclo de renderizado.
    // Esto es manejado por el useEffect que depende de initializeSession.
    // Si queremos un nuevo UUID *inmediatamente*:
    const newUUID = crypto.randomUUID();
    localStorage.setItem("kantifySessionUUID", newUUID);
    setSessionUUID(newUUID);
    // Y luego dejar que initializeSession se ejecute con este nuevo UUID.
    // El initializeSession ya se llama en un useEffect, asi que esto deberia ser suficiente.
    // O simplemente llamar initializeSession después de limpiar.
    initializeSession();
  };

  return (
    <AppContext.Provider
      value={{
        sessionUUID,
        corpusDilemmas,
        answeredDilemmas,
        currentDilemma,
        isLoadingAi,
        ethicalProfile,
        initializeSession,
        answerAndReflect,
        getNextDilemmaFromCorpus,
        generateAndSetNewDilemma,
        generateProfile,
        clearSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error(
      "useAppContext debe ser utilizado dentro de un AppProvider"
    );
  }
  return context;
};
