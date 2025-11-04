"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  Wand2,
  Lightbulb,
  ChevronsRight,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import {
  ethicalTopics,
  dilemmaIntensities,
  DilemmaIntensity,
  EthicalTopic,
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function DilemmasPage() {
  const {
    sessionUUID,
    currentDilemma,
    isLoadingAi,
    answerAndReflect,
    getNextDilemmaFromCorpus,
    generateAndSetNewDilemma,
    generateProfile,
    corpusDilemmas,
    answeredDilemmas,
  } = useAppContext();

  const [sliderValue, setSliderValue] = useState<number>(0.5);
  const [selectedTopic, setSelectedTopic] = useState<EthicalTopic>(
    ethicalTopics[0]
  );
  const [selectedIntensity, setSelectedIntensity] = useState<DilemmaIntensity>(
    dilemmaIntensities[0]
  );

  useEffect(() => {
    if (!sessionUUID) {
      // Consider redirecting or handling in AppContext if session is crucial before this page
    }
    setSliderValue(0.5);
  }, [currentDilemma?.id_dilema, sessionUUID]);

  const handleAnswer = async () => {
    if (currentDilemma) {
      await answerAndReflect(sliderValue);
      // El siguiente dilema se carga automáticamente en answerAndReflect
    }
  };

  const handleNextCorpusDilemma = () => {
    getNextDilemmaFromCorpus();
  };

  const handleGenerateNewDilemma = async () => {
    await generateAndSetNewDilemma(selectedTopic, selectedIntensity);
  };

  const progressPercentage =
    corpusDilemmas.length > 0
      ? (answeredDilemmas.length /
          (corpusDilemmas.length +
            answeredDilemmas.filter((ad) =>
              ad.dilemma.id_dilema.startsWith("generated-")
            ).length)) *
        100
      : 0;

  if (!sessionUUID) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Inicializando tu sesión anónima...
        </p>
        <p className="mt-2 text-sm">
          Si esto toma demasiado tiempo, por favor refresca la página.
        </p>
      </div>
    );
  }

  if (!currentDilemma) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        {isLoadingAi ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">
              Cargando dilema...
            </p>
          </>
        ) : (
          <>
            <p className="text-lg text-muted-foreground">
              No hay dilemas disponibles en este momento.
            </p>
            <Button onClick={handleNextCorpusDilemma} className="mt-4">
              Intentar cargar un dilema
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[calc(100vh-4rem)] justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Dilema Ético
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Tópico: {currentDilemma.topico_principal} | Intensidad:{" "}
            {currentDilemma.intensidad}
            {"source" in currentDilemma && currentDilemma.source === "rag" && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                🤖 RAG
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg leading-relaxed text-center min-h-[6rem]">
            {currentDilemma.texto_dilema}
          </p>

          {/* Valor actual del slider - Grande y visible */}
          <div className="text-center mb-6">
            <div className="inline-block bg-primary/10 px-6 py-3 rounded-lg border-2 border-primary/20">
              <span className="text-sm text-muted-foreground font-medium">
                Tu respuesta:
              </span>
              <div className="text-4xl font-bold text-primary mt-1">
                {sliderValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Slider mejorado */}
          <div className="px-4 py-2">
            <Slider
              value={[sliderValue]}
              onValueChange={(value) => setSliderValue(value[0])}
              min={0}
              max={1}
              step={0.01}
              disabled={isLoadingAi}
              aria-label="Control deslizante de respuesta al dilema"
              className="cursor-pointer"
            />
          </div>

          {/* Etiquetas mejoradas con valores */}
          <div className="flex justify-between items-center text-sm px-1 mt-4">
            <div className="text-left">
              <div className="font-bold text-destructive text-base">0.00 = No</div>
              <div className="text-xs text-muted-foreground">Rechazo total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-muted-foreground">0.50 = Neutral</div>
              <div className="text-xs text-muted-foreground">Indeciso</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600 text-base">1.00 = Sí</div>
              <div className="text-xs text-muted-foreground">Aceptación total</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <Button
            onClick={handleAnswer}
            disabled={isLoadingAi}
            className="w-full shadow-md text-lg py-6"
          >
            {isLoadingAi && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoadingAi ? "Cargando siguiente dilema..." : "Enviar Respuesta →"}
          </Button>
        </CardFooter>
      </Card>

      {/* Opciones avanzadas (opcional) */}
      <div className="w-full max-w-2xl mt-4 p-4 bg-card/50 border rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          O genera un dilema personalizado:
        </p>
        <div className="flex gap-2 mb-2">
          <Select
            value={selectedTopic}
            onValueChange={(value) => setSelectedTopic(value as EthicalTopic)}
            disabled={isLoadingAi}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Seleccionar Tópico" />
            </SelectTrigger>
            <SelectContent>
              {ethicalTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedIntensity}
            onValueChange={(value) =>
              setSelectedIntensity(value as DilemmaIntensity)
            }
            disabled={isLoadingAi}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Seleccionar Intensidad" />
            </SelectTrigger>
            <SelectContent>
              {dilemmaIntensities.map((intensity) => (
                <SelectItem key={intensity} value={intensity}>
                  {intensity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleNextCorpusDilemma}
            variant="outline"
            className="flex-1"
            disabled={isLoadingAi}
          >
            <SkipForward className="mr-2 h-4 w-4" /> Dilema del Corpus
          </Button>
          <Button
            onClick={handleGenerateNewDilemma}
            variant="outline"
            className="flex-1"
            disabled={isLoadingAi}
          >
            {isLoadingAi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Wand2 className="mr-2 h-4 w-4" /> Generar con IA
          </Button>
        </div>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <Progress value={progressPercentage} className="w-full h-2" />
        <p className="text-sm text-muted-foreground text-center mt-2">
          {answeredDilemmas.length} dilema(s) reflexionados.
        </p>
      </div>

      {answeredDilemmas.length > 0 && (
        <div className="mt-8">
          <Link href="/profile">
            <Button
              variant="default"
              size="lg"
              className="shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => {
                // Forzar regeneración del perfil cuando se hace clic
                setTimeout(() => generateProfile(), 100);
              }}
            >
              Ver Mi Perfil Ético <ChevronsRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
