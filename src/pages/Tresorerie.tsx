import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Percent,
  UserCheck,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
  Legend,
} from "recharts";
import { useTresorerie } from "@/hooks/useTresorerie";
import { CURRENCY } from "@/config/currency";

const MOIS_LABELS: Record<string, string> = {
  Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec",
  Jan: "Jan", Feb: "Fev", Mar: "Mar", Apr: "Avr",
  May: "Mai", Jun: "Jun",
};

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#a855f7",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{typeof p.value === "number" ? p.value.toLocaleString() + ` ${CURRENCY}` : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Tresorerie() {
  const { data, isLoading } = useTresorerie();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-muted animate-pulse rounded-xl" />
          <div className="h-72 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const fluxData = data.fluxMensuels.map((f) => ({
    mois: MOIS_LABELS[f.mois] ?? f.mois,
    Entrees: f.entrees,
    Sorties: f.sorties,
    Solde: f.solde,
  }));

  const pieData = data.repartitionDepenses.map((r) => ({
    name: r.categorie,
    value: r.montant,
  }));

  const kpis = [
    {
      label: "Total encaisse",
      value: `${fmt(data.totalEntrees)} ${CURRENCY}`,
      icon: DollarSign,
      arrow: ArrowUpRight,
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      arrowColor: "text-emerald-500",
    },
    {
      label: "Total depenses",
      value: `${fmt(data.totalSorties)} ${CURRENCY}`,
      icon: TrendingDown,
      arrow: ArrowDownRight,
      gradient: "from-red-500 to-rose-600",
      bg: "bg-red-50",
      ring: "ring-red-100",
      arrowColor: "text-red-500",
    },
    {
      label: "Solde tresorerie",
      value: `${fmt(data.solde)} ${CURRENCY}`,
      icon: Wallet,
      arrow: data.solde >= 0 ? ArrowUpRight : ArrowDownRight,
      gradient: data.solde >= 0 ? "from-blue-500 to-indigo-600" : "from-orange-500 to-red-600",
      bg: data.solde >= 0 ? "bg-blue-50" : "bg-orange-50",
      ring: data.solde >= 0 ? "ring-blue-100" : "ring-orange-100",
      arrowColor: data.solde >= 0 ? "text-blue-500" : "text-orange-500",
    },
    {
      label: "Taux recouvrement",
      value: `${data.tauxRecouvrement}%`,
      icon: Percent,
      arrow: ArrowUpRight,
      gradient: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
      ring: "ring-purple-100",
      arrowColor: "text-purple-500",
    },
  ];

  const kpis2 = [
    {
      label: "Impayes",
      value: `${fmt(data.totalImpayes)} ${CURRENCY}`,
      icon: AlertTriangle,
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      iconBg: "bg-amber-100",
    },
    {
      label: "Eleves a jour",
      value: `${data.elevesAJour} / ${data.totalEleves}`,
      icon: UserCheck,
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconBg: "bg-emerald-100",
    },
    {
      label: "Eleves en retard",
      value: `${data.elevesEnRetard} / ${data.totalEleves}`,
      icon: AlertTriangle,
      bgLight: "bg-red-50",
      textColor: "text-red-700",
      iconBg: "bg-red-100",
    },
    {
      label: "Total eleves",
      value: String(data.totalEleves),
      icon: Users,
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
      iconBg: "bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tresorerie</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue globale des flux financiers — {ANNEE}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`absolute -end-6 -top-6 h-24 w-24 rounded-full ${kpi.bg} opacity-60 transition-transform group-hover:scale-125`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} text-white shadow-sm ring-4 ${kpi.ring}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <kpi.arrow className={`h-5 w-5 ${kpi.arrowColor}`} />
              </div>
              <p className="font-heading text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis2.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i + 4}
            className={`rounded-xl border border-border/50 ${kpi.bgLight} p-4 flex items-center gap-3`}
          >
            <div className={`rounded-lg ${kpi.iconBg} p-2`}>
              <kpi.icon className={`h-4 w-4 ${kpi.textColor}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${kpi.textColor}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flux de trésorerie */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={8}
          className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Flux de tresorerie mensuel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Entrees vs Sorties par mois</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Entrees</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Sorties</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fluxData}>
              <defs>
                <linearGradient id="gradEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Entrees" stroke="#10b981" strokeWidth={2.5} fill="url(#gradEntrees)" dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} />
              <Area type="monotone" dataKey="Sorties" stroke="#ef4444" strokeWidth={2} fill="url(#gradSorties)" dot={{ r: 3, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Répartition dépenses */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={9}
          className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm flex flex-col"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Repartition des depenses</h3>
          <p className="text-xs text-muted-foreground mb-4">Par categorie</p>
          {pieData.length > 0 ? (
            <>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} ${CURRENCY}`, ""]}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-auto pt-3 border-t border-border/40">
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-foreground">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Aucune depense enregistree
            </div>
          )}
        </motion.div>
      </div>

      {/* Solde mensuel bar chart */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={10}
        className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1">Solde mensuel</h3>
        <p className="text-xs text-muted-foreground mb-4">Entrees - Sorties par mois</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={fluxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 93%)" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="Solde" radius={[6, 6, 0, 0]}>
              {fluxData.map((d, i) => (
                <Cell key={i} fill={d.Solde >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top débiteurs */}
      {data.topDebiteurs.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={11}
          className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden"
        >
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold text-foreground">Top debiteurs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Eleves avec le plus d'impayes</p>
          </div>
          <div className="overflow-x-auto p-5 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-2.5 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Eleve</th>
                  <th className="py-2.5 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                  <th className="py-2.5 px-3 text-end text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total du</th>
                  <th className="py-2.5 px-3 text-end text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Paye</th>
                  <th className="py-2.5 px-3 text-end text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Impaye</th>
                </tr>
              </thead>
              <tbody>
                {data.topDebiteurs.map((d) => (
                  <tr key={d.studentId} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{d.studentName}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {d.classe || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end text-muted-foreground">{d.montantDu.toLocaleString()} {CURRENCY}</td>
                    <td className="py-3 px-3 text-end text-emerald-600">{d.montantPaye.toLocaleString()} {CURRENCY}</td>
                    <td className="py-3 px-3 text-end font-semibold text-red-600">{d.solde.toLocaleString()} {CURRENCY}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
