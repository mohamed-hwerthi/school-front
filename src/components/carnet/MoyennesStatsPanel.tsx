import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  BarChart3,
  Trophy,
  AlertTriangle,
  Target,
  Award,
  TrendingUp,
  XCircle,
  UserX,
  Sigma,
  Minimize,
  Maximize,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExamensRaw } from "@/hooks/useExamens";
import { useNotesByExamen } from "@/hooks/useNotes";
import type { BulletinDTO } from "@/api/bulletins.api";
import { computeStats, KpiCard, DistributionChart, PassFailPie, MentionsBar } from "./statsCharts";

type StatsScope = "domaine" | "module" | "examen";

function StatsBlock({
  title,
  values,
  top,
  absentCount = 0,
}: {
  title: string;
  values: number[];
  top: { name: string; value: number }[];
  absentCount?: number;
}) {
  const stats = computeStats(values);
  if (stats.count === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
        Aucune donnée disponible pour {title}
      </div>
    );
  }
  const top5 = [...top].sort((a, b) => b.value - a.value).slice(0, 5);
  const bottom5 = [...top].sort((a, b) => a.value - b.value).slice(0, 5);
  const passCount = values.filter((v) => v >= 10).length;
  const failCount = values.filter((v) => v < 10).length;
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>

      {/* KPI Cards row 1 - core metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        <KpiCard label="Élèves" value={stats.count} icon={Users} />
        <KpiCard
          label="Moy. classe"
          value={stats.mean.toFixed(2)}
          icon={Target}
          color={stats.mean >= 10 ? "text-emerald-600" : "text-red-600"}
        />
        <KpiCard label="Médiane classe" value={stats.median.toFixed(2)} icon={Sigma} />
        <KpiCard label="Note min" value={stats.min.toFixed(2)} icon={Minimize} color="text-red-600" />
        <KpiCard label="Note max" value={stats.max.toFixed(2)} icon={Maximize} color="text-emerald-600" />
      </div>

      {/* KPI Cards row 2 - rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        <KpiCard label="Quartiles Q1 / Q3" value={`${stats.q1.toFixed(1)} / ${stats.q3.toFixed(1)}`} icon={Sigma} />
        <KpiCard label="Écart-type classe" value={stats.stddev.toFixed(2)} icon={Sigma} />
        <KpiCard
          label="% Réussite (≥10)"
          value={`${stats.passRate}%`}
          icon={TrendingUp}
          color={stats.passRate >= 50 ? "text-emerald-600" : "text-red-600"}
        />
        <KpiCard
          label="% Mention (≥14)"
          value={`${stats.mentionRate}%`}
          icon={Award}
          color="text-blue-600"
        />
        <KpiCard
          label={absentCount > 0 ? "Absents" : "% Échec"}
          value={absentCount > 0 ? absentCount : `${stats.failRate}%`}
          icon={absentCount > 0 ? UserX : XCircle}
          color={absentCount > 0 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DistributionChart values={values} />
        <PassFailPie pass={passCount} fail={failCount} />
      </div>
      <MentionsBar values={values} />

      {/* Top / Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-foreground">Top 5</p>
          </div>
          <ul className="space-y-1 text-xs">
            {top5.map((s, i) => (
              <li key={s.name + i} className="flex justify-between">
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground me-2">{i + 1}.</span>
                  {s.name}
                </span>
                <span className="font-semibold text-emerald-600">{s.value.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-xs font-semibold text-foreground">À surveiller (5 plus faibles)</p>
          </div>
          <ul className="space-y-1 text-xs">
            {bottom5.map((s, i) => (
              <li key={s.name + i} className="flex justify-between">
                <span className="text-muted-foreground">
                  <span className="font-bold text-foreground me-2">{i + 1}.</span>
                  {s.name}
                </span>
                <span className="font-semibold text-red-600">{s.value.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface Props {
  bulletins: BulletinDTO[];
  classeId: string;
  trimestre: number;
  statsModuleId: string;
  setStatsModuleId: (id: string) => void;
}

export default function MoyennesStatsPanel({ bulletins, classeId, trimestre, statsModuleId, setStatsModuleId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [scope, setScope] = useState<StatsScope>("module");

  const { data: examensList = [] } = useExamensRaw(
    statsModuleId || undefined,
    classeId || undefined,
    trimestre || undefined
  );
  const [statsExamenId, setStatsExamenId] = useState<string>("");
  const [statsDomaineId, setStatsDomaineId] = useState<string>("");
  const { data: examenNotes = [] } = useNotesByExamen(statsExamenId, trimestre);

  // Build module options from bulletins (only modules actually graded for this class)
  const moduleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    bulletins.forEach((b) => {
      b.domaines.forEach((d) => d.modules.forEach((m) => seen.set(m.moduleId, m.moduleName)));
      b.modulesHorsDomaine?.forEach((m) => seen.set(m.moduleId, m.moduleName));
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [bulletins]);

  // Build domaine options from bulletins
  const domaineOptions = useMemo(() => {
    const seen = new Map<string, string>();
    bulletins.forEach((b) => {
      b.domaines.forEach((d) => seen.set(d.domaineId, d.domaineName));
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [bulletins]);

  // DOMAINE scope
  const domaineValues = useMemo(() => {
    if (!statsDomaineId) return [];
    const vals: number[] = [];
    bulletins.forEach((b) => {
      const d = b.domaines.find((dd) => dd.domaineId === statsDomaineId);
      if (d && d.moyenneDomaine != null) vals.push(d.moyenneDomaine);
    });
    return vals;
  }, [bulletins, statsDomaineId]);
  const domaineTop = useMemo(() => {
    if (!statsDomaineId) return [];
    const list: { name: string; value: number }[] = [];
    bulletins.forEach((b) => {
      const d = b.domaines.find((dd) => dd.domaineId === statsDomaineId);
      if (d && d.moyenneDomaine != null) list.push({ name: b.studentName, value: d.moyenneDomaine });
    });
    return list;
  }, [bulletins, statsDomaineId]);

  // MODULE scope
  const moduleValues = useMemo(() => {
    if (!statsModuleId) return [];
    const vals: number[] = [];
    bulletins.forEach((b) => {
      b.domaines.forEach((d) => {
        const m = d.modules.find((mm) => mm.moduleId === statsModuleId);
        if (m && m.moyenneModule != null) vals.push(m.moyenneModule);
      });
      const hm = b.modulesHorsDomaine?.find((mm) => mm.moduleId === statsModuleId);
      if (hm && hm.moyenneModule != null) vals.push(hm.moyenneModule);
    });
    return vals;
  }, [bulletins, statsModuleId]);
  const moduleTop = useMemo(() => {
    if (!statsModuleId) return [];
    const list: { name: string; value: number }[] = [];
    bulletins.forEach((b) => {
      b.domaines.forEach((d) => {
        const m = d.modules.find((mm) => mm.moduleId === statsModuleId);
        if (m && m.moyenneModule != null) list.push({ name: b.studentName, value: m.moyenneModule });
      });
      const hm = b.modulesHorsDomaine?.find((mm) => mm.moduleId === statsModuleId);
      if (hm && hm.moyenneModule != null) list.push({ name: b.studentName, value: hm.moyenneModule });
    });
    return list;
  }, [bulletins, statsModuleId]);

  // EXAMEN scope
  const examenValues = useMemo(
    () => examenNotes.filter((n) => n.valeur != null).map((n) => n.valeur as number),
    [examenNotes]
  );
  const examenTop = useMemo(
    () => examenNotes.filter((n) => n.valeur != null).map((n) => ({ name: n.studentName, value: n.valeur as number })),
    [examenNotes]
  );
  const examenAbsentCount = useMemo(
    () => examenNotes.filter((n) => n.statut === "ABSENT").length,
    [examenNotes]
  );

  const selectedModuleName = moduleOptions.find((m) => m.id === statsModuleId)?.name ?? "";
  const selectedExamenName = examensList.find((e) => e.id === statsExamenId)?.name ?? "";
  const selectedDomaineName = domaineOptions.find((d) => d.id === statsDomaineId)?.name ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-sm text-foreground">Statistiques détaillées</span>
        <span className="ms-auto text-xs text-muted-foreground">
          {scope === "examen" ? "par examen" : scope === "domaine" ? "par domaine" : "par matière"}
        </span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-border">
          {/* Scope selector */}
          <div className="flex flex-wrap gap-2">
            {(["domaine", "module", "examen"] as StatsScope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                  scope === s
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-border/50 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {s === "module" ? "Par matière" : s === "examen" ? "Par examen" : "Par domaine"}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {scope === "domaine" ? (
              <Select value={statsDomaineId || ""} onValueChange={(v) => setStatsDomaineId(v)}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Sélectionner un domaine" />
                </SelectTrigger>
                <SelectContent>
                  {domaineOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={statsModuleId ? String(statsModuleId) : ""} onValueChange={(v) => setStatsModuleId(v)}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {scope === "examen" && (
              <Select value={statsExamenId ? String(statsExamenId) : ""} onValueChange={(v) => setStatsExamenId(v)} disabled={!statsModuleId}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder={statsModuleId ? "Sélectionner un examen" : "Choisir une matière d'abord"} />
                </SelectTrigger>
                <SelectContent>
                  {examensList.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {scope === "module" && statsModuleId && (
            <StatsBlock title={`Matière : ${selectedModuleName}`} values={moduleValues} top={moduleTop} />
          )}
          {scope === "module" && !statsModuleId && (
            <div className="rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
              Sélectionnez une matière pour voir ses statistiques
            </div>
          )}
          {scope === "domaine" && statsDomaineId && (
            <StatsBlock title={`Domaine : ${selectedDomaineName}`} values={domaineValues} top={domaineTop} />
          )}
          {scope === "domaine" && !statsDomaineId && (
            <div className="rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
              Sélectionnez un domaine pour voir ses statistiques
            </div>
          )}
          {scope === "examen" && statsExamenId && (
            <StatsBlock
              title={`Examen : ${selectedExamenName}`}
              values={examenValues}
              top={examenTop}
              absentCount={examenAbsentCount}
            />
          )}
          {scope === "examen" && !statsExamenId && (
            <div className="rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
              Sélectionnez une matière puis un examen pour voir ses statistiques
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
