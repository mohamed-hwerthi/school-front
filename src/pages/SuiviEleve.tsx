import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BookOpen,
  Clock,
  Shield,
  CreditCard,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StudentCombobox from "@/components/StudentCombobox";
import { useSuiviEleve } from "@/hooks/useAnalytics";
import { useAbsencesByEleve } from "@/hooks/useAbsences";
import { useNotesByStudent } from "@/hooks/useNotes";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  computeTrimestreAverage,
  computeSubjectAverages,
  computeTrend,
  computeMonthlyAbsences,
} from "@/utils/computeProgress";
import type { GradeEntry } from "@/utils/computeProgress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const riskColors: Record<string, { bg: string; text: string; ring: string }> = {
  FAIBLE: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  MOYEN: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  ELEVE: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  CRITIQUE: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
};

const paiementLabels: Record<string, { label: string; color: string }> = {
  A_JOUR: { label: "A jour", color: "bg-emerald-100 text-emerald-700" },
  PARTIEL: { label: "Partiel", color: "bg-amber-100 text-amber-700" },
  EN_RETARD: { label: "En retard", color: "bg-red-100 text-red-700" },
  "N/A": { label: "N/A", color: "bg-gray-100 text-gray-600" },
};

const TREND_CONFIG = {
  improving: { label: "En progression", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  stable: { label: "Stable", icon: Minus, color: "text-blue-600", bg: "bg-blue-50" },
  declining: { label: "En baisse", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
};

const T_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

export default function SuiviEleve() {
  const loading = useSimulatedLoading(600);
  const [eleveId, setEleveId] = useState<string>("");
  const { data: suivi, isLoading, isError } = useSuiviEleve(eleveId);

  // Fetch real notes for all 3 trimesters
  const { data: notesT1 = [] } = useNotesByStudent(eleveId, 1);
  const { data: notesT2 = [] } = useNotesByStudent(eleveId, 2);
  const { data: notesT3 = [] } = useNotesByStudent(eleveId, 3);

  // Fetch real absences
  const { data: absences = [] } = useAbsencesByEleve(eleveId);

  // Compute grade entries from real notes data
  const gradeEntries: GradeEntry[] = useMemo(() => {
    const entries: GradeEntry[] = [];
    for (const n of notesT1) {
      if (n.valeur != null) {
        entries.push({ note: n.valeur, coefficient: 1, moduleName: n.examenName || "Matière", trimestre: 1 });
      }
    }
    for (const n of notesT2) {
      if (n.valeur != null) {
        entries.push({ note: n.valeur, coefficient: 1, moduleName: n.examenName || "Matière", trimestre: 2 });
      }
    }
    for (const n of notesT3) {
      if (n.valeur != null) {
        entries.push({ note: n.valeur, coefficient: 1, moduleName: n.examenName || "Matière", trimestre: 3 });
      }
    }
    return entries;
  }, [notesT1, notesT2, notesT3]);

  // Use the real computeProgress utilities or fallback to suivi data
  const t1Avg = useMemo(() => {
    const computed = computeTrimestreAverage(gradeEntries, 1);
    return computed > 0 ? computed : (suivi?.moyenneParTrimestre?.[0] ?? 0);
  }, [gradeEntries, suivi]);

  const t2Avg = useMemo(() => {
    const computed = computeTrimestreAverage(gradeEntries, 2);
    return computed > 0 ? computed : (suivi?.moyenneParTrimestre?.[1] ?? 0);
  }, [gradeEntries, suivi]);

  const t3Avg = useMemo(() => {
    const computed = computeTrimestreAverage(gradeEntries, 3);
    return computed > 0 ? computed : (suivi?.moyenneParTrimestre?.[2] ?? 0);
  }, [gradeEntries, suivi]);

  const trend = useMemo(() => computeTrend(t1Avg, t2Avg, t3Avg), [t1Avg, t2Avg, t3Avg]);
  const trendConf = TREND_CONFIG[trend];

  // Grade evolution data for line chart
  const gradeData = useMemo(() => [
    { trimestre: "T1", moyenne: t1Avg },
    { trimestre: "T2", moyenne: t2Avg },
    { trimestre: "T3", moyenne: t3Avg },
  ].filter(d => d.moyenne > 0), [t1Avg, t2Avg, t3Avg]);

  // Per-subject comparison for bar chart
  const subjectAverages = useMemo(() => computeSubjectAverages(gradeEntries), [gradeEntries]);
  const subjectBarData = useMemo(() => {
    return Object.entries(subjectAverages).map(([name, trims]) => ({
      subject: name.length > 12 ? name.slice(0, 12) + "..." : name,
      T1: trims[1] || 0,
      T2: trims[2] || 0,
      T3: trims[3] || 0,
    }));
  }, [subjectAverages]);

  // Attendance trend (absences per month)
  const monthlyAbsenceData = useMemo(() => {
    return computeMonthlyAbsences(absences);
  }, [absences]);

  if (loading) return <DashboardSkeleton />;

  const risk = suivi ? riskColors[suivi.niveauRisque] || riskColors.FAIBLE : null;
  const paiement = suivi
    ? paiementLabels[suivi.paiementsStatus] || paiementLabels["N/A"]
    : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Suivi Eleve 360
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue complete du parcours scolaire - Rapport annuel de progression
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="max-w-xl">
          <StudentCombobox
            value={eleveId}
            onChange={setEleveId}
            placeholder="Sélectionner un élève"
          />
        </div>
      </motion.div>

      {/* No student selected */}
      {!eleveId && !isLoading && !isError && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-xl border border-border/50 bg-card p-12 text-center"
        >
          <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Sélectionnez un niveau, une classe puis un élève pour voir son suivi complet
          </p>
        </motion.div>
      )}

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-red-700">Eleve non trouve</p>
        </div>
      )}

      {suivi && (
        <>
          {/* Student Info Card */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg">
                {suivi.prenom.charAt(0)}{suivi.nom.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {suivi.prenom} {suivi.nom}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Classe: {suivi.classe || "Non assignee"} | ID: {suivi.eleveId}
                </p>
              </div>
              {risk && (
                <div className={`flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${risk.bg} ${risk.text} ${risk.ring}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Risque: {suivi.niveauRisque} ({suivi.scoreRisque.toFixed(0)}/100)
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{suivi.totalAbsences}</p>
              <p className="text-xs text-muted-foreground">Absences</p>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{suivi.totalRetards}</p>
              <p className="text-xs text-muted-foreground">Retards</p>
            </motion.div>

            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{suivi.totalIncidents}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </motion.div>

            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2">
                {paiement && (
                  <Badge className={`${paiement.color} text-xs`}>
                    {paiement.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paiements</p>
            </motion.div>

            {/* Overall Assessment */}
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${trendConf.bg}`}>
                <trendConf.icon className={`h-4 w-4 ${trendConf.color}`} />
              </div>
              <p className={`mt-2 font-heading text-sm font-bold ${trendConf.color}`}>
                {trendConf.label}
              </p>
              <p className="text-xs text-muted-foreground">Tendance</p>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Evolution Chart (Line) */}
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Evolution des moyennes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Moyenne generale par trimestre</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {gradeData.length > 1 && (
                    gradeData[gradeData.length - 1].moyenne >= gradeData[gradeData.length - 2].moyenne
                      ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                      : <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" />
                  <XAxis dataKey="trimestre" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="moyenne"
                    stroke="hsl(230 75% 57%)"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "hsl(230 75% 57%)", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Per-Subject Comparison (Bar) */}
            <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  Comparaison par matiere
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">T1 vs T2 vs T3</p>
              </div>
              {subjectBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" />
                    <XAxis dataKey="subject" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="T1" fill={T_COLORS[0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="T2" fill={T_COLORS[1]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="T3" fill={T_COLORS[2]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                  Aucune note detaillee disponible
                </div>
              )}
            </motion.div>
          </div>

          {/* Attendance Trend Chart */}
          <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                Tendance de presence
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Absences par mois</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyAbsenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Bar dataKey="count" name="Absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
