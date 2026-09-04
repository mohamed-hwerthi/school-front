import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, GraduationCap } from "lucide-react";
import { CarnetSelectionProvider, useCarnetSelection } from "@/components/carnet/CarnetSelectionContext";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApercuTab from "@/components/carnet/ApercuTab";

const TRIMESTRE_OPTIONS = [
  { value: 1, label: "Trimestre 1", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: 2, label: "Trimestre 2", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { value: 3, label: "Trimestre 3", color: "border-purple-300 bg-purple-50 text-purple-700" },
];

function SelectionPrompt() {
  const { niveaux } = useNiveaux();
  const { niveauId, setNiveauId, classeId, setClasseId, trimestre, setTrimestre } = useCarnetSelection();
  const { data: classes = [] } = useClasses(niveauId || undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/10 to-sky-600/10 border border-sky-200/50">
        <LayoutGrid className="h-8 w-8 text-sky-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        Choisissez niveau, classe et trimestre
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Sélectionnez tous les filtres ci-dessous pour voir l&apos;aperçu des notes.
      </p>

      <div className="mt-6 max-w-2xl mx-auto space-y-4">
        <div className="flex justify-center gap-3 flex-wrap">
          <Select
            value={niveauId ? String(niveauId) : ""}
            onValueChange={(v) => setNiveauId(v)}
          >
            <SelectTrigger className="w-full max-w-xs sm:w-[220px]">
              <GraduationCap className="h-4 w-4 me-2 text-muted-foreground" />
              <SelectValue placeholder="Niveau..." />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={classeId || ""}
            onValueChange={(v) => setClasseId(v)}
            disabled={!niveauId}
          >
            <SelectTrigger className="w-full max-w-xs sm:w-[220px]">
              <GraduationCap className="h-4 w-4 me-2 text-muted-foreground" />
              <SelectValue placeholder="Classe..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center gap-3">
          {TRIMESTRE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTrimestre(t.value)}
              className={`flex-1 max-w-[180px] rounded-xl border-2 p-3 text-center font-semibold transition-all ${
                trimestre === t.value
                  ? `${t.color} border-current shadow-sm`
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PageContent() {
  const { niveauId, classeId, trimestre } = useCarnetSelection();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Aperçu des notes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vue d&apos;ensemble des notes par classe et matière
            </p>
          </div>
        </div>
      </motion.div>

      {!niveauId || !classeId || !trimestre ? <SelectionPrompt /> : <ApercuTab />}
    </div>
  );
}

function SelectionSync({ onSync }: { onSync: (s: { niveauId: string; classeId: string; trimestre: number; moduleId: string; examenId: string }) => void }) {
  const s = useCarnetSelection();
  useEffect(() => { onSync({ niveauId: s.niveauId, classeId: s.classeId, trimestre: s.trimestre, moduleId: s.moduleId, examenId: s.examenId }); });
  return null;
}

export default function ApercuNotesPage() {
  const navigate = useNavigate();
  const selectionRef = useRef({ niveauId: "", classeId: "", trimestre: 0, moduleId: "", examenId: "" });

  const goToTab = useCallback((tab: string) => {
    const { niveauId, classeId, trimestre, moduleId, examenId } = selectionRef.current;
    const target = tab === "notes"
      ? "/dashboard/saisie-notes"
      : tab === "moyennes"
        ? "/dashboard/moyennes"
        : "/dashboard/apercu-notes";
    navigate(target, { state: { niveauId, classeId, trimestre, moduleId, examenId } });
  }, [navigate]);

  return (
    <CarnetSelectionProvider goToTab={goToTab}>
      <SelectionSync onSync={(s) => { selectionRef.current = s; }} />
      <PageContent />
    </CarnetSelectionProvider>
  );
}
