import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, GraduationCap } from "lucide-react";
import { CarnetSelectionProvider, useCarnetSelection } from "@/components/carnet/CarnetSelectionContext";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoyennesTab from "@/components/carnet/MoyennesTab";

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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-200/50">
        <BarChart3 className="h-8 w-8 text-amber-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        Choisissez niveau, classe et trimestre
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Sélectionnez tous les filtres ci-dessous pour consulter les moyennes.
      </p>

      <div className="mt-6 max-w-2xl mx-auto space-y-4">
        <div className="flex justify-center gap-3 flex-wrap">
          <Select
            value={niveauId ? String(niveauId) : ""}
            onValueChange={(v) => setNiveauId(v)}
          >
            <SelectTrigger className="w-[220px]">
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
            <SelectTrigger className="w-[220px]">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Moyennes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consultez les moyennes des élèves par classe et trimestre
            </p>
          </div>
        </div>
      </motion.div>

      {!niveauId || !classeId || !trimestre ? <SelectionPrompt /> : <MoyennesTab />}
    </div>
  );
}

export default function MoyennesPage() {
  const navigate = useNavigate();
  const state = useLocation().state as Record<string, string | number> | null;

  const goToTab = useCallback((tab: string) => {
    if (tab === "notes") navigate("/dashboard/saisie-notes");
  }, [navigate]);

  return (
    <CarnetSelectionProvider
      goToTab={goToTab}
      initialNiveauId={(state?.niveauId as string) || ""}
      initialClasseId={(state?.classeId as string) || ""}
      initialTrimestre={(state?.trimestre as number) || 0}
    >
      <PageContent />
    </CarnetSelectionProvider>
  );
}
