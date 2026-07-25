import { motion } from "framer-motion";
import { Layers, BookOpen, GraduationCap, Hash, ChevronRight } from "lucide-react";
import DomainesTab from "@/components/carnet/DomainesTab";
import { CarnetSelectionProvider, useCarnetSelection } from "@/components/carnet/CarnetSelectionContext";
import { useDomaines } from "@/hooks/useDomaines";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
};

const statsDef = [
  { label: "Domaines", icon: Layers, color: "blue", key: "count" as const },
  { label: "Sous-domaines", icon: BookOpen, color: "purple", key: "sdCount" as const },
  { label: "Version étatique", icon: GraduationCap, color: "emerald", key: "etatique" as const },
  { label: "Version privée", icon: Hash, color: "amber", key: "privee" as const },
];

function HeaderStats() {
  const { niveauId } = useCarnetSelection();
  const { data: domaines = [] } = useDomaines(niveauId || undefined);

  const values = {
    count: domaines.length,
    sdCount: domaines.reduce((acc, d) => acc + d.sousDomaines.length, 0),
    etatique: domaines.filter((d) => d.versionEtatique).length,
    privee: domaines.filter((d) => d.versionPrivee).length,
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
              {values[s.key]}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function NiveauPrompt() {
  const { niveaux } = useNiveaux();
  const { niveauId, setNiveauId } = useCarnetSelection();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-12 text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/50">
        <Layers className="h-8 w-8 text-blue-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        Choisissez un niveau
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Sélectionnez un niveau ci-dessous pour afficher et gérer ses domaines et sous-domaines.
      </p>
      <div className="mt-6 flex justify-center">
        <Select
          value={niveauId ? String(niveauId) : ""}
          onValueChange={(v) => setNiveauId(v)}
        >
          <SelectTrigger className="w-[280px]">
            <GraduationCap className="h-4 w-4 me-2 text-muted-foreground" />
            <SelectValue placeholder="Sélectionner un niveau..." />
          </SelectTrigger>
          <SelectContent>
            {niveaux.map((n) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.nom}
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
  const { niveauId } = useCarnetSelection();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("grades.domains") || "Domaines"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gérez les domaines et sous-domaines par niveau d&apos;étude
            </p>
          </div>
        </div>
      </motion.div>

      {!niveauId ? (
        <NiveauPrompt />
      ) : (
        <>
          <HeaderStats />
          <DomainesTab />
        </>
      )}
    </div>
  );
}

export default function DomainesPage() {
  return (
    <CarnetSelectionProvider goToTab={() => {}}>
      <PageContent />
    </CarnetSelectionProvider>
  );
}
