import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart as PieChartIcon,
  Users,
  UserCog,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Award,
  Calendar,
  BookOpen,
  UserCheck,
  CircleDollarSign,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useAllStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useTypesFrais, useAllPaiements } from "@/hooks/useFinance";
import { useNiveaux } from "@/hooks/useNiveaux";
import { CURRENCY } from "@/config/currency";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 glass px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Statistiques() {
  const loading = useSimulatedLoading(800);
  const { data: students = [] } = useAllStudents();
  const { teachers } = useTeachers();
  const { data: paiements = [] } = useAllPaiements();
  const { data: typesFrais = [] } = useTypesFrais();
  const { niveaux } = useNiveaux();

  // Student stats
  const activeStudents = students.filter((s) => s.statut === "Actif").length;
  const inactiveStudents = students.filter((s) => s.statut === "Inactif").length;
  const pendingStudents = students.filter((s) => s.statut === "En attente").length;
  const maleStudents = students.filter((s) => s.sexe === "M").length;
  const femaleStudents = students.filter((s) => s.sexe === "F").length;

  // Finance stats
  const totalDu = paiements.reduce((sum, p) => sum + p.montantDu, 0);
  const totalPaye = paiements.reduce((sum, p) => sum + p.montantPaye, 0);
  const tauxRecouvrement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

  // Charts data
  const studentsPerLevel = useMemo(() => {
    return niveaux.map((n, i) => ({
      name: n.nom.replace(" année", ""),
      value: students.filter((s) => s.niveau === n.nom).length,
      color: COLORS[i % COLORS.length],
    }));
  }, [niveaux, students]);

  const genderData = [
    { name: "Garçons", value: maleStudents, color: "#3b82f6" },
    { name: "Filles", value: femaleStudents, color: "#ec4899" },
  ];

  const statusData = [
    { name: "Actifs", value: activeStudents, color: "#10b981" },
    { name: "Inactifs", value: inactiveStudents, color: "#ef4444" },
    { name: "En attente", value: pendingStudents, color: "#f59e0b" },
  ];

  const financePerMonth = useMemo(() => {
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan"];
    const labels: Record<string, string> = { Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Déc", Jan: "Jan" };
    return months.map((m) => {
      const moisPaiements = paiements.filter((p) => p.mois === m);
      return {
        mois: labels[m] || m,
        Payé: moisPaiements.reduce((sum, p) => sum + p.montantPaye, 0),
        Dû: moisPaiements.reduce((sum, p) => sum + p.montantDu, 0),
      };
    });
  }, [paiements]);

  const financePerType = useMemo(() => {
    return typesFrais.map((tf, i) => {
      const total = paiements.filter((p) => p.typeFraisId === tf.id).reduce((sum, p) => sum + p.montantPaye, 0);
      return { name: tf.nom, value: total, color: COLORS[i % COLORS.length] };
    }).filter((d) => d.value > 0);
  }, [typesFrais, paiements]);

  const performanceData = [
    { mois: "Sep", "3A": 12.5, "5B": 13.8, "4C": 11.2 },
    { mois: "Oct", "3A": 13.1, "5B": 14.2, "4C": 12.0 },
    { mois: "Nov", "3A": 12.8, "5B": 13.5, "4C": 11.8 },
    { mois: "Déc", "3A": 14.0, "5B": 15.0, "4C": 12.5 },
    { mois: "Jan", "3A": 14.5, "5B": 14.8, "4C": 13.2 },
  ];

  const attendanceData = [
    { mois: "Sep", taux: 96.5 },
    { mois: "Oct", taux: 95.2 },
    { mois: "Nov", taux: 93.8 },
    { mois: "Déc", taux: 91.5 },
    { mois: "Jan", taux: 94.2 },
  ];

  const radialData = [{ name: "Recouvrement", value: tauxRecouvrement, fill: "#10b981" }];

  const topStats = [
    { label: "Total Élèves", value: students.length, icon: Users, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", ring: "ring-violet-100", change: "+12%" },
    { label: "Enseignants", value: teachers.length, icon: UserCog, gradient: "from-sky-500 to-blue-600", bg: "bg-sky-50", ring: "ring-sky-100", change: "+3%" },
    { label: "Niveaux", value: niveaux.length, icon: GraduationCap, gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50", ring: "ring-emerald-100", change: "0" },
    { label: "Classes", value: niveaux.reduce((sum, n) => sum + n.sections.length, 0), icon: BookOpen, gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50", ring: "ring-amber-100", change: "+2" },
    { label: "Revenus", value: `${(totalPaye / 1000).toFixed(0)}K`, icon: CircleDollarSign, gradient: "from-teal-500 to-cyan-600", bg: "bg-teal-50", ring: "ring-teal-100", change: "+8%" },
    { label: "Recouvrement", value: `${tauxRecouvrement}%`, icon: Percent, gradient: "from-rose-500 to-pink-600", bg: "bg-rose-50", ring: "ring-rose-100", change: tauxRecouvrement > 70 ? "+5%" : "-2%" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <PieChartIcon className="h-5 w-5 text-fuchsia-600" />
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Statistiques</h1>
        </div>
        <p className="text-sm text-muted-foreground">Vue analytique complète de l'établissement</p>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`absolute -end-4 -top-4 h-16 w-16 rounded-full ${stat.bg} opacity-60 transition-transform group-hover:scale-125`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm ring-4 ${stat.ring}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                {stat.change !== "0" && (
                  <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${stat.change.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {stat.change.startsWith("+") ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Élèves par niveau</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={studentsPerLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Élèves" radius={[4, 4, 0, 0]}>
                {studentsPerLevel.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-pink-500" />
            <h3 className="text-sm font-semibold text-foreground">Répartition par genre</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={3} stroke="hsl(0 0% 100%)">
                {genderData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {genderData.map((g) => (
              <div key={g.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name}: <span className="font-semibold">{g.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Statut des élèves</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={3} stroke="hsl(0 0% 100%)">
                {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}: <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2: Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-3 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">Finance par mois</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Dû</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Payé</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={financePerMonth} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Dû" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Payé" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Revenus par type</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={financePerType} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={2} stroke="hsl(0 0% 100%)">
                  {financePerType.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ${CURRENCY}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-auto pt-3 border-t border-border/40">
            {financePerType.slice(0, 6).map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded shrink-0" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
                <span className="font-semibold text-foreground">{(t.value / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 3: Performance & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-3 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Évolution des moyennes</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[8, 18]} tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="3A" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="5B" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="4C" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Taux de présence</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="taux" name="Présence" stroke="#10b981" strokeWidth={2.5} fill="url(#attendGrad)" dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Radial gauge */}
          <div className="mt-auto pt-3 border-t border-border/40 flex items-center gap-4">
            <ResponsiveContainer width={70} height={70}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220 15% 93%)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{tauxRecouvrement}%</p>
              <p className="text-xs text-muted-foreground">Taux de recouvrement</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
