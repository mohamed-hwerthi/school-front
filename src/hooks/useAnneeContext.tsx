import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useActiveAnneeScolaire, useAllAnneesScolaires } from "./useAnneeScolaire";
import type { AnneeScolaire } from "@/types/annee-scolaire";

interface AnneeContextValue {
  selectedAnnee: AnneeScolaire | null;
  setSelectedAnnee: (annee: AnneeScolaire) => void;
  allAnnees: AnneeScolaire[];
  isLoading: boolean;
}

const AnneeContext = createContext<AnneeContextValue | null>(null);

const STORAGE_KEY = "selected_annee_label";

export function AnneeProvider({ children }: { children: ReactNode }) {
  const { data: activeAnnee, isLoading: activeLoading } = useActiveAnneeScolaire();
  const { data: allAnnees = [], isLoading: allLoading } = useAllAnneesScolaires();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [selectedAnnee, setSelectedAnneeState] = useState<AnneeScolaire | null>(null);

  useEffect(() => {
    if (selectedLabel) {
      const found = allAnnees.find((a) => a.label === selectedLabel);
      if (found) {
        setSelectedAnneeState(found);
        return;
      }
    }
    if (activeAnnee) {
      setSelectedAnneeState(activeAnnee);
      setSelectedLabel(activeAnnee.label);
      localStorage.setItem(STORAGE_KEY, activeAnnee.label);
    }
  }, [activeAnnee, allAnnees, selectedLabel]);

  const setSelectedAnnee = useCallback((annee: AnneeScolaire) => {
    setSelectedAnneeState(annee);
    setSelectedLabel(annee.label);
    localStorage.setItem(STORAGE_KEY, annee.label);
  }, []);

  return (
    <AnneeContext.Provider
      value={{
        selectedAnnee,
        setSelectedAnnee,
        allAnnees,
        isLoading: activeLoading || allLoading,
      }}
    >
      {children}
    </AnneeContext.Provider>
  );
}

export function useAnneeContext() {
  const ctx = useContext(AnneeContext);
  if (!ctx) throw new Error("useAnneeContext must be used within AnneeProvider");
  return ctx;
}
