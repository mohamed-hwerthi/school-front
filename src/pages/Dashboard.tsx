import { useMemo } from "react";
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
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { useDashboardStats, useMonthlyTrends } from "@/hooks/useReporting";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useLanguage } from "@/hooks/useLanguage";
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import { CURRENCY } from "@/config/currency";

/* ── Fallback / static data ──────────────────────────── */

const STAT_META_STYLES = [
  {
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    ring: "ring-violet-100",
  },
  {
    icon: UserCog,
    gradient: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    ring: "ring-sky-100",
  },
  {
    icon: UserCheck,
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    icon: CircleDollarSign,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
  },
];

const NIVEAU_COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

const EVENT_BAR_COLORS = ["bg-violet-500", "bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500"];
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

/* FALLBACK_QUICK_STATS moved inside component to access t() */

/* ── Animations ──────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Custom Tooltip ──────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 glass px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ── Component ───────────────────────────────────────── */

export default function Dashboard() {
  const { t } = useLanguage();
  const loading = useSimulatedLoading(800);
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyTrends } = useMonthlyTrends();
  const { data: schoolSettings } = useSchoolSettings();

  const STAT_META = useMemo(() => [
    { ...STAT_META_STYLES[0], label: t("dashboard.totalStudents") },
    { ...STAT_META_STYLES[1], label: t("dashboard.teachers") },
    { ...STAT_META_STYLES[2], label: t("dashboard.attendanceRate") },
    { ...STAT_META_STYLES[3], label: t("dashboard.revenue") },
  ], [t]);

  const FALLBACK_QUICK_STATS = useMemo(() => [
    { label: t("dashboard.absencesToday"), value: "32", icon: AlertCircle, color: "text-red-500" },
    { label: t("dashboard.newEnrollments"), value: "8", icon: UserCheck, color: "text-emerald-500" },
    { label: t("dashboard.eventsThisMonth"), value: "4", icon: Calendar, color: "text-blue-500" },
  ], [t]);

  // Build stat cards from real data or fallback
  const dynamicStats = dashboardStats
    ? [
        { ...STAT_META[0], value: dashboardStats.totalStudents.toLocaleString(), change: `${dashboardStats.totalClasses} ${t("dashboard.classes")}` },
        { ...STAT_META[1], value: String(dashboardStats.totalTeachers), change: "" },
        { ...STAT_META[2], value: `${(100 - dashboardStats.tauxAbsence).toFixed(1)}%`, change: "" },
        { ...STAT_META[3], value: `${Math.round(dashboardStats.totalRevenue / 1000)}K ${CURRENCY}`, change: `${dashboardStats.tauxRecouvrement?.toFixed(0) ?? "?"}% ${t("dashboard.recovery")}` },
      ]
    : [
        { ...STAT_META[0], value: "...", change: "" },
        { ...STAT_META[1], value: "...", change: "" },
        { ...STAT_META[2], value: "...", change: "" },
        { ...STAT_META[3], value: "...", change: "" },
      ];

  const dynamicQuickStats = dashboardStats
    ? [
        { ...FALLBACK_QUICK_STATS[0], value: String(dashboardStats.absencesToday ?? 0) },
        { ...FALLBACK_QUICK_STATS[1], value: String(dashboardStats.newEnrollmentsThisMonth ?? 0) },
        { ...FALLBACK_QUICK_STATS[2], value: String(dashboardStats.eventsThisMonth ?? 0) },
      ]
    : FALLBACK_QUICK_STATS;

  const weeklyAttendanceData = (dashboardStats?.weeklyAttendance ?? [])
    .map((d) => ({ jour: d.jour, présents: d.presents, absents: d.absents }));

  const upcomingEvents = (dashboardStats?.upcomingEvents ?? []).map((e, i) => {
    const { day, month } = eventDateParts(e.dateDebut);
    return {
      titre: e.titre,
      day,
      month,
      lieu: e.lieu,
      color: EVENT_BAR_COLORS[i % EVENT_BAR_COLORS.length],
    };
  });

  const recentStudents = (dashboardStats?.recentStudents ?? []).map((s) => ({
    nom: s.fullName,
    classe: s.classe ?? "—",
    date: formatDateFr(s.enrollmentDate),
    statut: s.statut ?? "—",
    avatar: initials(s.fullName),
  }));

  const dynamicAttendanceRadial = [
    {
      name: "Presents",
      value: dashboardStats ? Math.round((100 - dashboardStats.tauxAbsence) * 10) / 10 : 0,
      fill: "#10b981",
    },
  ];

  // Level distribution — strictly from the API's real studentsByNiveau.
  const levelDistribution = Object.entries(dashboardStats?.studentsByNiveau ?? {}).map(
    ([name, value], i) => ({
      name,
      value,
      color: NIVEAU_COLORS[i % NIVEAU_COLORS.length],
    }),
  );

  const totalStudentsForPie = levelDistribution.reduce((s, l) => s + l.value, 0);

  // Monthly trends available?
  const hasTrends = monthlyTrends && monthlyTrends.length > 0;

  // Moyenne generale from API
  const moyenneGenerale = dashboardStats?.moyenneGenerale ?? 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-12 h-48 w-48 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">{t("dashboard.title")}</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">
              {t("dashboard.welcome")}, {t("common.admin")}
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-md">
              {[schoolSettings?.schoolName, schoolSettings?.anneeScolaire
                ? `${t("dashboard.schoolYear")} ${schoolSettings.anneeScolaire}`
                : null]
                .filter(Boolean)
                .join(" — ")}
            </p>
          </div>
          <div className="flex gap-3">
            {dynamicQuickStats.map((qs) => (
              <div key={qs.label} className="rounded-xl bg-white/10 glass px-4 py-3 text-center min-w-[90px]">
                <qs.icon className={`h-4 w-4 mx-auto mb-1 ${qs.color.replace("text-", "text-white/")}`} style={{ color: "rgba(255,255,255,0.85)" }} />
                <p className="font-heading text-lg font-bold">{qs.value}</p>
                <p className="text-[10px] text-white/60 leading-tight">{qs.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {dynamicStats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`absolute -end-6 -top-6 h-24 w-24 rounded-full ${stat.bg} opacity-60 transition-transform group-hover:scale-125`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm ring-4 ${stat.ring}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                {stat.change && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="font-heading text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Row 1 ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Attendance Area Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-3 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{t("dashboard.weeklyAttendance")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.dailyTracking")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t("dashboard.present")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />{t("dashboard.absent")}</span>
            </div>
          </div>
          {weeklyAttendanceData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
              {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyAttendanceData} barGap={8} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar dataKey="présents" fill="url(#greenGrad)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absents" fill="url(#redGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Donut + Radial gauge */}
        <motion.div variants={fadeUp} className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5 shadow-sm flex flex-col">
          <h3 className="font-heading text-sm font-semibold text-foreground">{t("dashboard.levelDistribution")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">{totalStudentsForPie.toLocaleString()} {t("dashboard.studentsTotal")}</p>
          <div className="flex-1 flex items-center justify-center">
            {levelDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={3}
                    stroke="hsl(0 0% 100%)"
                  >
                    {levelDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-auto pt-3 border-t border-border/40">
            {levelDistribution.map((level) => (
              <div key={level.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded shrink-0" style={{ backgroundColor: level.color }} />
                  {level.name}
                </span>
                <span className="font-semibold text-foreground">{level.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Charts Row 2 ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Trends Area — inscriptions + absences from real API */}
        <motion.div variants={fadeUp} className="lg:col-span-3 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {hasTrends ? t("dashboard.monthlyTrends") : t("dashboard.generalAverage")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasTrends ? t("dashboard.enrollmentsAbsences") : t("dashboard.semesterEvolution")}
              </p>
            </div>
            {moyenneGenerale > 0 && (
              <div className="rounded-lg bg-primary/10 px-3 py-1.5">
                <span className="font-heading text-lg font-bold text-primary">{moyenneGenerale.toFixed(1)}</span>
                <span className="text-xs text-primary/70 ms-1">/20</span>
              </div>
            )}
          </div>
          {hasTrends ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrends!.map((t) => ({ mois: t.month, inscriptions: t.inscriptions, absences: t.absences, paiements: Number(t.paiements) / 1000 }))}>
                <defs>
                  <linearGradient id="inscGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="inscriptions" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#inscGrad)" dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="absences" stroke="#ef4444" strokeWidth={2} fill="url(#absGrad)" dot={{ r: 3, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noTrendData")}
            </div>
          )}
        </motion.div>

        {/* Events */}
        <motion.div variants={fadeUp} className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t("dashboard.upcomingEvents")}
            </h3>
            <span className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-0.5">
              {t("common.seeAll")} <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
          <div className="space-y-2.5 flex-1">
            {upcomingEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
                {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noEvents")}
              </div>
            ) : (
              upcomingEvents.map((event, i) => (
                <div key={`${event.titre}-${i}`} className="flex gap-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors p-3 group cursor-pointer">
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">{event.month}</span>
                    <span className="font-heading text-xl font-bold text-foreground leading-tight">{event.day}</span>
                  </div>
                  <div className={`w-0.5 self-stretch rounded-full ${event.color}`} />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{event.titre}</p>
                    {event.lieu && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {event.lieu}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Attendance gauge */}
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-4">
            <ResponsiveContainer width={80} height={80}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={dynamicAttendanceRadial} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220 15% 93%)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">
                {dashboardStats ? `${(100 - dashboardStats.tauxAbsence).toFixed(1)}%` : "94.2%"}
              </p>
              <p className="text-xs text-muted-foreground">{t("dashboard.globalAttendanceRate")}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">{t("dashboard.latestEnrollments")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.last6Students")}</p>
          </div>
          <span className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-0.5">
            {t("common.seeAll")} <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
        <div className="overflow-x-auto p-5 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.student")}</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.class")}</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.date")}</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    {statsLoading ? t("dashboard.loadingTrends") : t("dashboard.noRecentStudents")}
                  </td>
                </tr>
              ) : (
                recentStudents.map((student, i) => {
                  const isActive = student.statut === "Actif" || student.statut === "Inscrit";
                  return (
                    <tr
                      key={`${student.nom}-${i}`}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[11px] font-bold text-white shrink-0">
                            {student.avatar}
                          </div>
                          <span className="font-medium text-foreground">{student.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                          {student.classe}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{student.date}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
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
      </motion.div>
    </div>
  );
}
