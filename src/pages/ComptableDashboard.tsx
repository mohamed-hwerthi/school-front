import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CircleDollarSign,
  TrendingDown,
  Wallet,
  Receipt,
  AlertCircle,
  ArrowRight,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useDashboardStats, useMonthlyTrends } from "@/hooks/useReporting";
import { useFacturesPaged } from "@/hooks/useFactures";
import { CURRENCY } from "@/config/currency";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + ` ${CURRENCY}`;
}

interface KpiProps {
  label: string;
  value: string;
  icon: React.ElementType;
  to?: string;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "warning" | "danger";
}

function Kpi({ label, value, icon: Icon, to, hint, loading, tone = "default" }: KpiProps) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "danger"
      ? "bg-red-50 text-red-700"
      : "bg-primary/10 text-primary";

  const inner = (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {to && <ArrowRight className="h-4 w-4 text-muted-foreground/50" />}
      </div>
      <div className="mt-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {hint && (
          <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>
        )}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function ComptableDashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: trends = [], isLoading: loadingTrends } = useMonthlyTrends();
  const { data: facturesPage, isLoading: loadingFactures } = useFacturesPaged({
    statut: "IMPAYEE",
    size: 10,
  });

  const impayes = useMemo(() => facturesPage?.content ?? [], [facturesPage]);

  const trendData = useMemo(
    () =>
      trends.map((t) => ({
        month: t.month,
        paiements: t.paiements,
      })),
    [trends]
  );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Tableau de bord comptable
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Suivi des encaissements, impayés et trésorerie.
        </p>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Kpi
          label="Encaissements (année)"
          value={fmt(stats?.totalRevenue)}
          icon={CircleDollarSign}
          to="/dashboard/finance"
          loading={loadingStats}
        />
        <Kpi
          label="En attente"
          value={fmt(stats?.totalPending)}
          icon={AlertCircle}
          tone="warning"
          to="/dashboard/finance/relances"
          loading={loadingStats}
          hint="Sommes restant à encaisser"
        />
        <Kpi
          label="Taux de recouvrement"
          value={`${(stats?.tauxRecouvrement ?? 0).toFixed(1)} %`}
          icon={Wallet}
          to="/dashboard/finance/rapports"
          loading={loadingStats}
        />
        <Kpi
          label="Factures impayées"
          value={String(facturesPage?.totalElements ?? 0)}
          icon={Receipt}
          tone={impayes.length > 0 ? "danger" : "default"}
          to="/dashboard/factures?statut=IMPAYEE"
          loading={loadingFactures}
        />
      </motion.div>

      {/* Charts + impayés */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trésorerie chart */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Encaissements par mois
            </h2>
            <Link
              to="/dashboard/finance/tresorerie"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Trésorerie <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loadingTrends ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : trendData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Pas de données disponibles.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="paiementsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 92%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} />
                <RechartsTooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="paiements"
                  stroke="hsl(var(--primary))"
                  fill="url(#paiementsGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Impayés top 10 */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Top impayés
            </h2>
            <Link
              to="/dashboard/factures?statut=IMPAYEE"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loadingFactures ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : impayes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune facture impayée 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {impayes.slice(0, 10).map((f) => (
                <li
                  key={f.id}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {f.studentName ?? f.numero ?? `Facture #${f.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.numero ?? ""}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-red-600 ms-2">
                    {fmt(f.montantTotal ?? f.total ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Quick links */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Link
          to="/dashboard/finance/caisse"
          className="rounded-xl border border-border/50 bg-card p-4 text-center hover:bg-muted/40 transition-colors"
        >
          <Wallet className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs font-medium">Caisse</p>
        </Link>
        <Link
          to="/dashboard/finance/depenses"
          className="rounded-xl border border-border/50 bg-card p-4 text-center hover:bg-muted/40 transition-colors"
        >
          <TrendingDown className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs font-medium">Dépenses</p>
        </Link>
        <Link
          to="/dashboard/finance/relances"
          className="rounded-xl border border-border/50 bg-card p-4 text-center hover:bg-muted/40 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs font-medium">Relances</p>
        </Link>
        <Link
          to="/dashboard/finance/rapports"
          className="rounded-xl border border-border/50 bg-card p-4 text-center hover:bg-muted/40 transition-colors"
        >
          <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs font-medium">Rapports</p>
        </Link>
      </motion.div>
    </div>
  );
}
