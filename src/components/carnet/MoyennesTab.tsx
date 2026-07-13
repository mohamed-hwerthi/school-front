import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import {
  BarChart3,
  GraduationCap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useBulletins } from "@/hooks/useBulletins";
import { useLanguage } from "@/hooks/useLanguage";
import type { BulletinDTO, BulletinDomaineDTO } from "@/api/bulletins.api";
import MoyennesStatsPanel from "./MoyennesStatsPanel";

const TRIMESTRE_VALUES = [1, 2, 3] as const;
const VERSION_VALUES = ["etatique", "prive"] as const;

function gradeColor(val: number) {
  if (val >= 16) return "text-emerald-600";
  if (val >= 14) return "text-green-600";
  if (val >= 10) return "text-foreground";
  if (val >= 8) return "text-orange-600";
  return "text-red-600";
}

function DomaineBlock({ domaine, bulletins }: { domaine: BulletinDomaineDTO; bulletins: BulletinDTO[] }) {
  const [expanded, setExpanded] = useState(false);

  // Domain rank per student (1-indexed, ties share the same rank)
  const domainRank = useMemo(() => {
    const entries = bulletins
      .map((b) => {
        const moy = b.domaines.find((d) => d.domaineId === domaine.domaineId)?.moyenneDomaine;
        return moy != null ? { studentId: b.studentId, moy } : null;
      })
      .filter((e): e is { studentId: string; moy: number } => e !== null)
      .sort((a, b) => b.moy - a.moy);

    const ranks = new Map<number, number>();
    let lastMoy: number | null = null;
    let lastRank = 0;
    entries.forEach((e, idx) => {
      const rank = lastMoy !== null && e.moy === lastMoy ? lastRank : idx + 1;
      ranks.set(e.studentId, rank);
      lastMoy = e.moy;
      lastRank = rank;
    });
    return { ranks, total: entries.length };
  }, [bulletins, domaine.domaineId]);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-start"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-semibold text-sm text-foreground">{domaine.domaineName}</span>
        {domaine.domaineNameAr && (
          <span className="text-xs text-muted-foreground" dir="rtl">
            {domaine.domaineNameAr}
          </span>
        )}
        <span className="ms-auto inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          coeff {domaine.coeff}
        </span>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-2 px-3 text-start text-xs font-semibold text-muted-foreground w-8">#</th>
                <th className="py-2 px-3 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                {domaine.modules.map((m) => (
                  <th key={m.moduleId} className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">
                    {m.moduleName}
                    <div className="text-[10px] font-normal text-muted-foreground/70">coeff {m.coeff}</div>
                  </th>
                ))}
                <th className="py-2 px-3 text-center text-xs font-semibold text-foreground bg-muted/30">
                  Moy. Domaine
                </th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">
                  Rang
                </th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((b, idx) => {
                const bDomaine = b.domaines.find((d) => d.domaineId === domaine.domaineId);
                return (
                  <tr key={b.studentId} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="py-2 px-3 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-foreground text-xs">{b.studentName}</td>
                    {domaine.modules.map((dm) => {
                      const bModule = bDomaine?.modules.find((m) => m.moduleId === dm.moduleId);
                      const val = bModule?.moyenneModule;
                      return (
                        <td key={dm.moduleId} className={`py-2 px-3 text-center text-xs ${val != null ? gradeColor(val) : ""}`}>
                          {val != null ? val.toFixed(2) : "—"}
                        </td>
                      );
                    })}
                    <td className={`py-2 px-3 text-center text-xs font-bold bg-muted/20 ${bDomaine ? gradeColor(bDomaine.moyenneDomaine) : ""}`}>
                      {bDomaine ? bDomaine.moyenneDomaine.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-muted-foreground">
                      {domainRank.ranks.has(b.studentId)
                        ? `${domainRank.ranks.get(b.studentId)}/${domainRank.total}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Module stats row */}
            <tfoot>
              <tr className="border-t border-border bg-muted/10 text-[10px] text-muted-foreground">
                <td colSpan={2} className="py-1.5 px-3 font-semibold">Min / Max / Moy. Classe</td>
                {domaine.modules.map((dm) => {
                  // Get stats from first bulletin that has this module
                  const ref = bulletins.find((b) =>
                    b.domaines.find((d) => d.domaineId === domaine.domaineId)?.modules.find((m) => m.moduleId === dm.moduleId)
                  );
                  const refModule = ref?.domaines
                    .find((d) => d.domaineId === domaine.domaineId)
                    ?.modules.find((m) => m.moduleId === dm.moduleId);
                  return (
                    <td key={dm.moduleId} className="py-1.5 px-3 text-center">
                      {refModule
                        ? `${refModule.moduleMin.toFixed(1)} / ${refModule.moduleMax.toFixed(1)} / ${refModule.moduleClasseAvg.toFixed(1)}`
                        : "—"}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3" />
                <td className="py-1.5 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MoyennesTab() {
  const { t } = useLanguage();
  const { niveaux } = useNiveaux();
  const { niveauId, classeId, trimestre, setNiveauId, setClasseId, setTrimestre } = useCarnetSelection();
  const [version, setVersion] = useState("etatique");
  const [statsModuleId, setStatsModuleId] = useState<string>("");

  const trimestreLabel = (n: number) => t(`common.trimester${n}`);
  const versionLabel = (v: string) =>
    v === "etatique" ? t("common.versionEtatique") : t("common.versionPrivee");

  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: bulletins = [], isLoading } = useBulletins(classeId, trimestre, version);

  // Collect all unique domaines from the first bulletin (structure is same for all)
  const allDomaines: BulletinDomaineDTO[] = bulletins.length > 0 ? bulletins[0].domaines : [];

  // When a module is selected in the stats panel, only show its parent domain block
  const visibleDomaines: BulletinDomaineDTO[] = statsModuleId
    ? allDomaines.filter((d) => d.modules.some((m) => m.moduleId === statsModuleId))
    : allDomaines;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select
            value={niveauId ? String(niveauId) : ""}
            onValueChange={(v) => {
              setNiveauId(v);
              setClasseId("");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={t("common.level")} />
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
            value={classeId ? String(classeId) : ""}
            onValueChange={(v) => setClasseId(v)}
            disabled={!niveauId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("common.class")} />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={trimestre ? String(trimestre) : ""}
            onValueChange={(v) => setTrimestre(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("common.trimester")} />
            </SelectTrigger>
            <SelectContent>
              {TRIMESTRE_VALUES.map((tv) => (
                <SelectItem key={tv} value={String(tv)}>
                  {trimestreLabel(tv)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERSION_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {versionLabel(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Results */}
      {classeId && trimestre > 0 && (
        <>
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-card p-16 shadow-sm text-center text-muted-foreground">
              Chargement...
            </div>
          ) : bulletins.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card p-16 shadow-sm text-center text-muted-foreground"
            >
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune moyenne disponible</p>
              <p className="text-xs mt-1">Saisissez des notes pour voir les moyennes</p>
            </motion.div>
          ) : (
            <>
              {/* Stats panel — placed first, expanded by default */}
              <MoyennesStatsPanel
                bulletins={bulletins}
                classeId={classeId}
                trimestre={trimestre}
                statsModuleId={statsModuleId}
                setStatsModuleId={setStatsModuleId}
              />

              {/* Domain blocks (filtered to the parent domain when a module is selected in stats) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="space-y-3"
              >
                {visibleDomaines.map((d) => (
                  <DomaineBlock key={d.domaineId} domaine={d} bulletins={bulletins} />
                ))}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}
