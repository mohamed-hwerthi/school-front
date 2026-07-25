import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CarnetSelectionProvider } from "@/components/carnet/CarnetSelectionContext";
import NotesTab from "@/components/carnet/NotesTab";

export default function SaisieNotesPage() {
  const navigate = useNavigate();
  const state = useLocation().state as Record<string, string | number> | null;

  const goToTab = useCallback((tab: string) => {
    if (tab === "moyennes") navigate("/dashboard/moyennes");
    else if (tab === "apercu") navigate("/dashboard/apercu-notes");
  }, [navigate]);

  return (
    <CarnetSelectionProvider
      goToTab={goToTab}
      initialNiveauId={(state?.niveauId as string) || ""}
      initialClasseId={(state?.classeId as string) || ""}
      initialTrimestre={(state?.trimestre as number) || 0}
      initialModuleId={(state?.moduleId as string) || ""}
      initialExamenId={(state?.examenId as string) || ""}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <NotesTab />
      </div>
    </CarnetSelectionProvider>
  );
}
