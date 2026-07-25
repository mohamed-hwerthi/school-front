import { motion } from "framer-motion";
import { ClipboardCheck, GraduationCap, BookOpen, CheckCircle2 } from "lucide-react";
import ExamensTab from "@/components/carnet/ExamensTab";
import { CarnetSelectionProvider, useCarnetSelection } from "@/components/carnet/CarnetSelectionContext";
import { useExamensRaw } from "@/hooks/useExamens";
import { useClasses } from "@/hooks/useClasses";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
};

const statsDef = [
  { label: "Examens", icon: ClipboardCheck, color: "blue", key: "count" as const },
  { label: "Taux saisie", icon: CheckCircle2, color: "emerald", key: "completion" as const },
  { label: "Matières", icon: BookOpen, color: "purple", key: "modules" as const },
  { label: "Classes", icon: GraduationCap, color: "amber", key: "classes" as const },
];

function HeaderStats() {
  const { niveauId, classeId } = useCarnetSelection();
  const realClasseId = classeId && classeId !== "0" ? classeId : undefined;
  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: examens = [] } = useExamensRaw(
    undefined,
    realClasseId,
    undefined,
    !!realClasseId
  );

  const totalNotes = examens.reduce((a, e) => a + (e.nbNotes ?? 0), 0);
  const totalEleves = examens.reduce((a, e) => a + (e.nbEleves ?? 0), 0);
  const completion = totalEleves > 0 ? Math.round((totalNotes / totalEleves) * 100) : 0;
  const moduleSet = new Set(examens.map((e) => e.moduleName)).size;

  const values = {
    count: examens.length,
    completion: examens.length > 0 ? `${completion}%` : "—",
    modules: moduleSet || "—",
    classes: classes.length || "—",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statsDef.map((s) => {
        const c = colorMap[s.color];
        return (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
              <s.icon className={`h-4.5 w-4.5 ${c.text}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">
              {realClasseId ? values[s.key] : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function SelectionPrompt() {
  const { niveaux } = useNiveaux();
  const { niveauId, setNiveauId, classeId, setClasseId } = useCarnetSelection();
  const { data: classes = [] } = useClasses(niveauId || undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-12 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-200/50">
        <ClipboardCheck className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        Choisissez un niveau et une classe
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Sélectionnez le niveau et la classe pour afficher et gérer les examens.
      </p>
      <div className="mt-6 flex justify-center gap-3">
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
    </motion.div>
  );
}

function PageContent() {
  const { t } = useLanguage();
  const { niveauId, classeId } = useCarnetSelection();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("grades.exams") || "Examens"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gérez les examens, coefficients et suivi des saisies
            </p>
          </div>
        </div>
      </motion.div>

      {!niveauId || !classeId || classeId === "0" ? (
        <SelectionPrompt />
      ) : (
        <>
          <HeaderStats />
          <ExamensTab />
        </>
      )}
    </div>
  );
}

export default function ExamensPage() {
  return (
    <CarnetSelectionProvider goToTab={() => {}}>
      <PageContent />
    </CarnetSelectionProvider>
  );
}
