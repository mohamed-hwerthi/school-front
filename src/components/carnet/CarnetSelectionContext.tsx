import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useCurrentTrimestre } from "@/hooks/useAnneeScolaire";

type CarnetSelection = {
  niveauId: string;
  domaineId: string;
  classeId: string;
  trimestre: number;
  moduleId: string;
  examenId: string;
  setNiveauId: (id: string) => void;
  setDomaineId: (id: string) => void;
  setClasseId: (id: string) => void;
  setTrimestre: (t: number) => void;
  setModuleId: (id: string) => void;
  setExamenId: (id: string) => void;
  goToTab: (tab: string) => void;
};

const CarnetSelectionCtx = createContext<CarnetSelection | null>(null);

export function CarnetSelectionProvider({
  children,
  goToTab,
}: {
  children: ReactNode;
  goToTab: (tab: string) => void;
}) {
  const [niveauId, setNiveauIdRaw] = useState<string>("");
  const [domaineId, setDomaineId] = useState<string>("");
  const [classeId, setClasseIdRaw] = useState<string>("");
  const [trimestre, setTrimestreRaw] = useState<number>(0);
  const [trimestreTouched, setTrimestreTouched] = useState(false);
  const [moduleId, setModuleIdRaw] = useState<string>("");
  const [examenId, setExamenId] = useState<string>("");

  // Préselectionne le trimestre courant (basé sur la date du jour vs les
  // bornes des trimestres de l'année scolaire active) tant que l'utilisateur
  // n'a pas explicitement changé le filtre.
  const currentTrimestre = useCurrentTrimestre();
  useEffect(() => {
    if (!trimestreTouched && currentTrimestre && trimestre === 0) {
      setTrimestreRaw(currentTrimestre);
    }
  }, [currentTrimestre, trimestreTouched, trimestre]);

  // Cascading resets — changing a parent invalidates its children selections
  const setNiveauId = (id: string) => {
    setNiveauIdRaw(id);
    setDomaineId("");
    setClasseIdRaw("");
    setModuleIdRaw("");
    setExamenId("");
  };
  const setClasseId = (id: string) => {
    setClasseIdRaw(id);
    setExamenId("");
  };
  const setTrimestre = (t: number) => {
    setTrimestreRaw(t);
    setTrimestreTouched(true);
    setExamenId("");
  };
  const setModuleId = (id: string) => {
    setModuleIdRaw(id);
    setExamenId("");
  };

  return (
    <CarnetSelectionCtx.Provider
      value={{
        niveauId, domaineId, classeId, trimestre, moduleId, examenId,
        setNiveauId, setDomaineId, setClasseId, setTrimestre, setModuleId, setExamenId,
        goToTab,
      }}
    >
      {children}
    </CarnetSelectionCtx.Provider>
  );
}

export function useCarnetSelection(): CarnetSelection {
  const ctx = useContext(CarnetSelectionCtx);
  if (!ctx) throw new Error("useCarnetSelection must be used inside <CarnetSelectionProvider>");
  return ctx;
}
