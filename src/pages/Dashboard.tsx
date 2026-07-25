import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCog,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  Activity,
  Sparkles,
  CircleDollarSign,
  UserCheck,
  AlertCircle,
  Search,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
  ArrowDownRight,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { useDashboardStats, useMonthlyTrends } from "@/hooks/useReporting";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CURRENCY } from "@/config/currency";

/* ── Fallback & Styling Metadata ──────────────────────────── */

const STAT_META_STYLES = [
  {
    icon: Users,
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    glow: "rgba(99, 102, 241, 0.15)",
    bg: "bg-indigo-50/70 dark:bg-indigo-950/30",
    border: "border-indigo-100 dark:border-indigo-900/50",
    badgeBg: "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    accent: "#6366f1",
  },
  {
    icon: UserCog,
    gradient: "from-blue-500 via-cyan-500 to-teal-400",
    glow: "rgba(14, 165, 233, 0.15)",
    bg: "bg-sky-50/70 dark:bg-sky-950/30",
    border: "border-sky-100 dark:border-sky-900/50",
    badgeBg: "bg-sky-100/80 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    accent: "#0ea5e9",
  },
  {
    icon: UserCheck,
    gradient: "from-emerald-500 via-teal-500 to-green-500",
    glow: "rgba(16, 185, 129, 0.15)",
    bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-900/50",
    badgeBg: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    accent: "#10b981",
  },
  {
    icon: CircleDollarSign,
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    glow: "rgba(245, 158, 11, 0.15)",
    bg: "bg-amber-50/70 dark:bg-amber-950/30",
    border: "border-amber-100 dark:border-amber-900/50",
    badgeBg: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    accent: "#f59e0b",
  },
];

const NIVEAU_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#ef4444",
];

const EVENT_BADGE_STYLES = [
  { bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800", dot: "bg-rose-500" },
];

const FR_MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function eventDateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "" };
  return { day: String(d.getDate()).padStart(2, "0"), month: FR_MONTH_SHORT[d.getMonth()] };
}

/* ── Animations ──────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Custom Chart Tooltip ──────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number | string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl transition-all">
      <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" />
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}:
            </span>
            <span className="font-bold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export default function Dashboard() {
  const { t } = useLanguage();
  const loading = useSimulatedLoading(600);
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyTrends } = useMonthlyTrends();
  const { data: schoolSettings } = useSchoolSettings();

  // Active View States
  const [activeChartTab, setActiveChartTab] = useState<"attendance" | "trends" | "finance">("attendance");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"day" | "week" | "month" | "year">("month");
  const [tableSearch, setTableSearch] = useState("");

  const STAT_META = useMemo(
    () => [
      { ...STAT_META_STYLES[0], label: t("dashboard.totalStudents") },
      { ...STAT_META_STYLES[1], label: t("dashboard.teachers") },
      { ...STAT_META_STYLES[2], label: t("dashboard.attendanceRate") },
      { ...STAT_META_STYLES[3], label: t("dashboard.revenue") },
    ],
    [t]
  );

  const FALLBACK_QUICK_STATS = useMemo(
    () => [
      { label: t("dashboard.absencesToday"), value: "32", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
      { label: t("dashboard.newEnrollments"), value: "8", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: t("dashboard.eventsThisMonth"), value: "4", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    ],
    [t]
  );

  // Dynamic stat cards logic
  const dynamicStats = dashboardStats
    ? [
        {
          ...STAT_META[0],
          value: dashboardStats.totalStudents.toLocaleString(),
          subText: `${dashboardStats.totalClasses} ${t("dashboard.classes")}`,
          trend: "+12%",
          isPositive: true,
        },
        {
          ...STAT_META[1],
          value: String(dashboardStats.totalTeachers),
          subText: "100% " + (t("common.active") || "Actifs"),
          trend: "+3",
          isPositive: true,
        },
        {
          ...STAT_META[2],
          value: `${(100 - dashboardStats.tauxAbsence).toFixed(1)}%`,
          subText: `${dashboardStats.absencesToday ?? 0} ${t("dashboard.absencesToday")}`,
          trend: `${dashboardStats.tauxAbsence < 5 ? "+1.4%" : "-0.8%"}`,
          isPositive: dashboardStats.tauxAbsence < 5,
        },
        {
          ...STAT_META[3],
          value: `${Math.round(dashboardStats.totalRevenue / 1000)}K ${CURRENCY}`,
          subText: `${dashboardStats.tauxRecouvrement?.toFixed(0) ?? "?"}% ${t("dashboard.recovery")}`,
          trend: `${dashboardStats.tauxRecouvrement?.toFixed(0) ?? 0}%`,
          isPositive: true,
        },
      ]
    : STAT_META.map((meta) => ({
        ...meta,
        value: "...",
        subText: "...",
        trend: "...",
        isPositive: true,
      }));

  const dynamicQuickStats = dashboardStats
    ? [
        { ...FALLBACK_QUICK_STATS[0], value: String(dashboardStats.absencesToday ?? 0) },
        { ...FALLBACK_QUICK_STATS[1], value: String(dashboardStats.newEnrollmentsThisMonth ?? 0) },
        { ...FALLBACK_QUICK_STATS[2], value: String(dashboardStats.eventsThisMonth ?? 0) },
      ]
    : FALLBACK_QUICK_STATS;

  const weeklyAttendanceData = (dashboardStats?.weeklyAttendance ?? []).map((d) => ({
    jour: d.jour,
    présents: d.presents,
    absents: d.absents,
    taux: Math.round((d.presents / (d.presents + d.absents || 1)) * 100),
  }));

  const upcomingEvents = (dashboardStats?.upcomingEvents ?? []).map((e, i) => {
    const { day, month } = eventDateParts(e.dateDebut);
    return {
      titre: e.titre,
      day,
      month,
      lieu: e.lieu,
      style: EVENT_BADGE_STYLES[i % EVENT_BADGE_STYLES.length],
    };
  });

  const recentStudents = (dashboardStats?.recentStudents ?? []).map((s) => ({
    nom: s.fullName,
    classe: s.classe ?? "—",
    date: formatDateFr(s.enrollmentDate),
    statut: s.statut ?? "Actif",
    avatar: initials(s.fullName),
  }));

  const filteredStudents = useMemo(() => {
    if (!tableSearch.trim()) return recentStudents;
    const query = tableSearch.toLowerCase();
    return recentStudents.filter(
      (s) => s.nom.toLowerCase().includes(query) || s.classe.toLowerCase().includes(query) || s.statut.toLowerCase().includes(query)
    );
  }, [recentStudents, tableSearch]);

  const levelDistribution = Object.entries(dashboardStats?.studentsByNiveau ?? {}).map(([name, value], i) => ({
    name,
    value,
    color: NIVEAU_COLORS[i % NIVEAU_COLORS.length],
  }));

  const totalStudentsForPie = levelDistribution.reduce((s, l) => s + l.value, 0);
  const hasTrends = monthlyTrends && monthlyTrends.length > 0;
  const moyenneGenerale = dashboardStats?.moyenneGenerale ?? 0;
  const attendanceRate = dashboardStats ? (100 - dashboardStats.tauxAbsence).toFixed(1) : "95.4";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto min-h-screen">
      {/* ── Top Bar / Quick Actions Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {schoolSettings?.schoolName || "School System SaaS"}
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            {t("dashboard.welcome")}, <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{t("common.admin")}</span>
          </h1>
        </div>

        {/* Timeframe selector & Quick Action shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-medium">
            {(["day", "week", "month", "year"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTimeframe === tf
                    ? "bg-card text-foreground font-semibold shadow-sm border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf === "day" && "Aujourd'hui"}
                {tf === "week" && "Semaine"}
                {tf === "month" && "Mois"}
                {tf === "year" && "Année"}
              </button>
            ))}
          </div>

          <Link
            to="/dashboard/inscriptions"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-btn hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Nouvelle Inscription</span>
          </Link>
        </div>
      </div>

      {/* ── Ambient Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-800 p-6 md:p-8 text-white shadow-2xl border border-white/10"
      >
        {/* Glow meshes background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-400/30 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-amber-300 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>
                {schoolSettings?.anneeScolaire
                  ? `${t("dashboard.schoolYear")} ${schoolSettings.anneeScolaire}`
                  : "Année Scolaire 2025 - 2026"}
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
              Vue d'ensemble et pilotage en temps réel
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Suivez l'assiduité, gérez les effectifs, contrôlez les performances académiques et surveillez les flux financiers en un coup d'œil.
            </p>
          </div>

          {/* Quick Metrics Cards Inside Banner */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {dynamicQuickStats.map((qs) => (
              <div
                key={qs.label}
                className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-4 transition-all duration-300 hover:bg-white/15 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${qs.bg} backdrop-blur-sm`}>
                    <qs.icon className={`h-4 w-4 ${qs.color}`} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">Today</span>
                </div>
                <p className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">{qs.value}</p>
                <p className="text-[11px] text-white/70 truncate mt-0.5">{qs.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Modern Stat Cards Grid ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {dynamicStats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Card Background Glow */}
            <div
              className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
              style={{ backgroundColor: stat.accent }}
            />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${stat.badgeBg}`}>
                  {stat.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {stat.trend}
                </span>
              </div>

              <div>
                <p className="font-heading text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  {stat.subText && <span className="text-[11px] font-semibold text-primary/80">{stat.subText}</span>}
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                  style={{ width: stat.isPositive ? "82%" : "65%" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Analytics Suite Row ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Main Interactive Chart Section (8 cols) */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-8 rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between"
        >
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-base font-bold text-foreground">Analyse & Performance System</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Visualisation des tendances globales de l'établissement</p>
            </div>

            {/* View Tabs */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab("attendance")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === "attendance"
                    ? "bg-card text-primary font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Présence
              </button>
              <button
                onClick={() => setActiveChartTab("trends")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === "trends"
                    ? "bg-card text-primary font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inscriptions & Absences
              </button>
              <button
                onClick={() => setActiveChartTab("finance")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === "finance"
                    ? "bg-card text-primary font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Finances
              </button>
            </div>
          </div>

          {/* Chart Content Area */}
          <div className="flex-1 min-h-[300px] w-full">
            {activeChartTab === "attendance" && (
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={weeklyAttendanceData} barGap={10} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="présents" fill="url(#greenGradient)" radius={[8, 8, 0, 0]} name="Présents" />
                  <Bar dataKey="absents" fill="url(#roseGradient)" radius={[8, 8, 0, 0]} name="Absents" />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === "trends" && (
              hasTrends ? (
                <ResponsiveContainer width="100%" height={310}>
                  <AreaChart data={monthlyTrends!.map((t) => ({ mois: t.month, Inscriptions: t.inscriptions, Absences: t.absences }))}>
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Inscriptions" stroke="#8b5cf6" strokeWidth={3} fill="url(#purpleGlow)" dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} />
                    <Area type="monotone" dataKey="Absences" stroke="#ef4444" strokeWidth={2.5} fill="url(#redGlow)" dot={{ r: 3, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground space-y-2">
                  <Activity className="h-8 w-8 text-muted-foreground/40 animate-bounce" />
                  <p className="text-sm font-medium">{statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noTrendData")}</p>
                </div>
              )
            )}

            {activeChartTab === "finance" && (
              hasTrends ? (
                <ResponsiveContainer width="100%" height={310}>
                  <AreaChart data={monthlyTrends!.map((t) => ({ mois: t.month, Paiements: Math.round(Number(t.paiements) / 1000) }))}>
                    <defs>
                      <linearGradient id="amberGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Paiements" stroke="#f59e0b" strokeWidth={3} fill="url(#amberGlow)" dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground space-y-2">
                  <CircleDollarSign className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Données financières en cours de synchronisation</p>
                </div>
              )
            )}
          </div>

          {/* Bottom Indicators bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50 text-xs mt-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
              <div>
                <p className="font-semibold text-foreground">{attendanceRate}%</p>
                <p className="text-[10px] text-muted-foreground">Taux de présence global</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-indigo-500" />
              <div>
                <p className="font-semibold text-foreground">
                  {moyenneGenerale > 0 ? `${moyenneGenerale.toFixed(1)} / 20` : "14.2 / 20"}
                </p>
                <p className="text-[10px] text-muted-foreground">Moyenne générale école</p>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="flex h-3 w-3 rounded-full bg-amber-500" />
              <div>
                <p className="font-semibold text-foreground">{dashboardStats?.tauxRecouvrement?.toFixed(0) ?? 88}%</p>
                <p className="text-[10px] text-muted-foreground">Objectif de paiement atteint</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Level Distribution & Radial Gauge Card (4 cols) */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-4 rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                <h3 className="font-heading text-base font-bold text-foreground">{t("dashboard.levelDistribution")}</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                {totalStudentsForPie} Élèves
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Répartition des effectifs par niveau scolaire</p>

            {/* Donut Chart Container */}
            <div className="relative flex items-center justify-center my-2">
              {levelDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noData")}
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={levelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {levelDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut Center Overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="font-heading text-2xl font-extrabold text-foreground">{totalStudentsForPie}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Level Legend Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/50 max-h-[140px] overflow-y-auto scrollbar-thin">
            {levelDistribution.map((level) => (
              <div
                key={level.name}
                className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
              >
                <span className="flex items-center gap-2 truncate font-medium text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: level.color }} />
                  {level.name}
                </span>
                <span className="font-bold text-foreground">{level.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Events Timeline & Recent Students Table Grid ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Recent Enrollments Table (8 cols) */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-8 rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  {t("dashboard.latestEnrollments")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.last6Students")}</p>
              </div>

              {/* Table search filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrer..."
                    className="w-36 sm:w-44 rounded-xl border border-border/60 bg-muted/40 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
                <Link
                  to="/dashboard/eleves"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0"
                >
                  {t("common.seeAll")} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">{t("dashboard.student")}</th>
                    <th className="py-3 px-3">{t("dashboard.class")}</th>
                    <th className="py-3 px-3">{t("common.date")}</th>
                    <th className="py-3 px-3">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                        {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noRecentStudents")}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, i) => {
                      const isActive = student.statut === "Actif" || student.statut === "Inscrit";
                      return (
                        <tr
                          key={`${student.nom}-${i}`}
                          className="group hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-xs shadow-sm ring-2 ring-background shrink-0">
                                {student.avatar}
                              </div>
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {student.nom}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/40">
                              {student.classe}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">{student.date}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                              {student.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Events Timeline (4 cols) */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-4 rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                {t("dashboard.upcomingEvents")}
              </h3>
              <Link to="/dashboard/calendrier" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                {t("common.seeAll")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
                  <Calendar className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs font-medium">{statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noEvents")}</p>
                </div>
              ) : (
                upcomingEvents.map((event, i) => (
                  <div
                    key={`${event.titre}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/80 transition-all border border-border/40 group cursor-pointer"
                  >
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-card border border-border/60 shadow-sm shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{event.month}</span>
                      <span className="font-heading text-base font-black text-foreground leading-none">{event.day}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {event.titre}
                      </p>
                      {event.lieu && (
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 text-primary/70" />
                          {event.lieu}
                        </p>
                      )}
                    </div>

                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${event.style.dot}`} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts Bar inside Events panel */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Accès Rapide Modules
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard/carnet-notes"
                className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-100 dark:border-indigo-900/30 hover:opacity-90 transition-opacity"
              >
                <span>Saisie Notes</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/dashboard/factures"
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-100 dark:border-amber-900/30 hover:opacity-90 transition-opacity"
              >
                <span>Factures</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
