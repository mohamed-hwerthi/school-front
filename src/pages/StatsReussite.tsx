import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Award,
  AlertTriangle,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useClasses } from "@/hooks/useClasses";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useStatsReussite, useComparatifEvolution, useBulletins } from "@/hooks/useBulletins";
import type { EvolutionTrimestreDTO } from "@/api/bulletins.api";
import { TopBottomLists, CertificatPie } from "@/components/carnet/statsCharts";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
const MENTION_LABELS = ["Échec", "Insuffisant", "Satisfaisant", "Excellent"];

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full me-1.5"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{" "}
          <span className="font-medium text-foreground">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

type TrendInfo = {
  delta: number;
  direction: "up" | "down" | "flat";
  formatted: string;
};

function computeTrend(
  evolution: EvolutionTrimestreDTO[] | undefined,
  trimestre: number,
  field: keyof EvolutionTrimestreDTO,
  suffix = ""
): TrendInfo | null {
  if (!evolution || evolution.length === 0 || trimestre <= 1) return null;
  const current = evolution.find((e) => e.trimestre === trimestre);
  const prev = evolution.find((e) => e.trimestre === trimestre - 1);
  if (!current || !prev) return null;
  const delta = (current[field] as number) - (prev[field] as number);
  if (Math.abs(delta) < 0.01)
    return { delta: 0, direction: "flat", formatted: `0${suffix}` };
  const sign = delta > 0 ? "+" : "";
  return {
    delta,
    direction: delta > 0 ? "up" : "down",
    formatted: `${sign}${delta.toFixed(1)}${suffix}`,
  };
}

function Sparkline({
  data,
  color,
  dataKey,
}: {
  data: { trimestre: number; value: number }[];
  color: string;
  dataKey: string;
}) {
  if (data.length < 2) return <div className="h-10" />;
  const gradId = `spark-${dataKey}`;
  return (
    <div className="h-10 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendBadge({ trend }: { trend: TrendInfo | null }) {
  if (!trend) return null;
  const Icon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus;
  const tone =
    trend.direction === "up"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
      : trend.direction === "down"
        ? "text-red-500 bg-red-50 dark:bg-red-950/40"
        : "text-muted-foreground bg-muted/50";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
      title="Variation vs trimestre précédent"
    >
      <Icon className="h-2.5 w-2.5" />
      {trend.formatted}
    </span>
  );
}

export default function StatsReussite() {
  const { niveaux } = useNiveaux();
  const [selectedNiveau, setSelectedNiveau] = useState<number>(0);
  const { data: classes = [] } = useClasses(selectedNiveau || undefined);
  const [selectedClasse, setSelectedClasse] = useState<number>(0);
  const [selectedTrimestre, setSelectedTrimestre] = useState<number>(1);

  const { data: stats, isLoading } = useStatsReussite(
    selectedClasse,
    selectedTrimestre
  );
  const { data: comparatif } = useComparatifEvolution(selectedClasse);
  const evolution = comparatif?.evolution ?? [];
  const { data: bulletins = [] } = useBulletins(
    selectedClasse,
    selectedTrimestre,
    "etatique"
  );

  const studentsForRanking = useMemo(
    () => bulletins.map((b) => ({ name: b.studentName, value: b.moyenneGenerale })),
    [bulletins]
  );

  const certificatsCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let aucun = 0;
    bulletins.forEach((b) => {
      if (b.certificatType) counts.set(b.certificatType, (counts.get(b.certificatType) ?? 0) + 1);
      else aucun++;
    });
    const arr = Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
    if (aucun > 0) arr.push({ type: "Sans certificat", count: aucun });
    return arr;
  }, [bulletins]);

  const distributionData =
    stats?.distribution?.map((d, i) => ({
      name: d.range,
      count: d.count,
      fill: COLORS[i % COLORS.length],
    })) || [];

  const moduleData =
    stats?.modulesStats?.map((m) => ({
      name:
        m.moduleName.length > 12
          ? m.moduleName.slice(0, 12) + "..."
          : m.moduleName,
      moyenne: m.moyenne,
    })) || [];

  const mentionsData = useMemo(
    () =>
      (stats?.distribution ?? []).map((d, i) => ({
        name: MENTION_LABELS[i] ?? d.range,
        range: d.range,
        value: d.count,
        fill: COLORS[i % COLORS.length],
      })),
    [stats?.distribution]
  );

  const totalDistribution = mentionsData.reduce((s, x) => s + x.value, 0);

  const evolutionChartData = useMemo(
    () =>
      evolution.map((e) => ({
        name: `T${e.trimestre}`,
        moyenne: Number(e.moyenneGenerale.toFixed(2)),
        taux: Number(e.tauxReussite.toFixed(1)),
        reussis: e.reussis,
      })),
    [evolution]
  );

  const sparkTotal = evolution.map((e) => ({
    trimestre: e.trimestre,
    value: e.totalEleves,
  }));
  const sparkTaux = evolution.map((e) => ({
    trimestre: e.trimestre,
    value: e.tauxReussite,
  }));
  const sparkReussis = evolution.map((e) => ({
    trimestre: e.trimestre,
    value: e.reussis,
  }));
  const sparkEchoues = evolution.map((e) => ({
    trimestre: e.trimestre,
    value: e.totalEleves - e.reussis,
  }));

  const trendTotal = computeTrend(evolution, selectedTrimestre, "totalEleves");
  const trendTaux = computeTrend(
    evolution,
    selectedTrimestre,
    "tauxReussite",
    "pts"
  );
  const trendReussis = computeTrend(evolution, selectedTrimestre, "reussis");
  const trendEchoues = (() => {
    if (evolution.length === 0 || selectedTrimestre <= 1) return null;
    const cur = evolution.find((e) => e.trimestre === selectedTrimestre);
    const prv = evolution.find((e) => e.trimestre === selectedTrimestre - 1);
    if (!cur || !prv) return null;
    const delta = cur.totalEleves - cur.reussis - (prv.totalEleves - prv.reussis);
    if (Math.abs(delta) < 0.01)
      return { delta: 0, direction: "flat" as const, formatted: "0" };
    const sign = delta > 0 ? "+" : "";
    return {
      delta,
      direction: delta > 0 ? ("up" as const) : ("down" as const),
      formatted: `${sign}${delta.toFixed(0)}`,
    };
  })();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            Statistiques de reussite
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyse des performances par classe et par module
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Niveau</Label>
            <Select
              value={selectedNiveau ? String(selectedNiveau) : ""}
              onValueChange={(v) => {
                setSelectedNiveau(v);
                setSelectedClasse(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un niveau" />
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
          <div>
            <Label>Classe</Label>
            <Select
              value={selectedClasse ? String(selectedClasse) : ""}
              onValueChange={(v) => setSelectedClasse(v)}
              disabled={!selectedNiveau}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une classe" />
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
          <div>
            <Label>Trimestre</Label>
            <Select
              value={String(selectedTrimestre)}
              onValueChange={(v) => setSelectedTrimestre(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Trimestre 1</SelectItem>
                <SelectItem value="2">Trimestre 2</SelectItem>
                <SelectItem value="3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {!selectedClasse ? (
        <div className="text-center py-16">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Selectionnez une classe pour afficher les statistiques
          </p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-72 bg-muted rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
        </div>
      ) : stats ? (
        <>
          {/* KPI cards with sparklines + variation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: "Total eleves",
                value: stats.totalEleves,
                color: "blue",
                stroke: "#3b82f6",
                spark: sparkTotal,
                trend: trendTotal,
                accent: "text-foreground",
              },
              {
                icon: TrendingUp,
                label: "Taux de reussite",
                value: `${stats.tauxReussite.toFixed(1)}%`,
                color: "emerald",
                stroke: "#10b981",
                spark: sparkTaux,
                trend: trendTaux,
                accent: "text-emerald-600",
              },
              {
                icon: Award,
                label: "Reussis",
                value: stats.reussis,
                color: "green",
                stroke: "#22c55e",
                spark: sparkReussis,
                trend: trendReussis,
                accent: "text-foreground",
              },
              {
                icon: AlertTriangle,
                label: "En echec",
                value: stats.echoues,
                color: "red",
                stroke: "#ef4444",
                spark: sparkEchoues,
                trend: trendEchoues,
                accent: "text-red-500",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${card.color}-100 text-${card.color}-600`}
                    >
                      <card.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {card.label}
                    </span>
                  </div>
                  <TrendBadge trend={card.trend} />
                </div>
                <p
                  className={`font-heading text-2xl font-bold ${card.accent}`}
                >
                  {card.value}
                </p>
                <Sparkline
                  data={card.spark}
                  color={card.stroke}
                  dataKey={card.label}
                />
              </motion.div>
            ))}
          </div>

          {/* Évolution trimestrielle - line chart full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-500" />
                Évolution trimestrielle
              </h3>
              <span className="text-xs text-muted-foreground">
                Moyenne générale & taux de réussite par trimestre
              </span>
            </div>
            {evolutionChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                Aucune donnée d'évolution disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={evolutionChartData}>
                  <defs>
                    <linearGradient id="moyenneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220 15% 93%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 20]}
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="moyenne"
                    name="Moyenne générale"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="taux"
                    name="Taux de réussite (%)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Distribution + Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-violet-500" />
                Distribution des moyennes
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distributionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220 15% 93%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Eleves" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Moyenne par module
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={moduleData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220 15% 93%)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 20]}
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="moyenne"
                    name="Moyenne"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Mentions donut + Min/Avg/Max */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-emerald-500" />
                Répartition par mention
              </h3>
              {totalDistribution === 0 ? (
                <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                  Aucune donnée
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Tooltip content={<ChartTooltip />} />
                      <Pie
                        data={mentionsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {mentionsData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="space-y-2">
                    {mentionsData.map((m) => {
                      const pct =
                        totalDistribution > 0
                          ? (m.value / totalDistribution) * 100
                          : 0;
                      return (
                        <li
                          key={m.name}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: m.fill }}
                            />
                            <span className="font-medium text-foreground truncate">
                              {m.name}
                            </span>
                            <span className="text-muted-foreground">
                              ({m.range})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-foreground tabular-nums">
                              {m.value}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Moyennes de la classe
              </h3>
              <div className="grid grid-cols-3 gap-6 text-center mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                  <p className="text-xl font-bold text-red-500 tabular-nums">
                    {stats.moyenneMin.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Moyenne classe
                  </p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {stats.moyenneClasse.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">
                    {stats.moyenneMax.toFixed(2)}
                  </p>
                </div>
              </div>
              {/* Range bar visualization */}
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500"
                  style={{
                    left: `${(stats.moyenneMin / 20) * 100}%`,
                    right: `${100 - (stats.moyenneMax / 20) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground border-2 border-background shadow"
                  style={{
                    left: `calc(${(stats.moyenneClasse / 20) * 100}% - 6px)`,
                  }}
                  title={`Moyenne: ${stats.moyenneClasse.toFixed(2)}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
                <span>0</span>
                <span>10</span>
                <span>20</span>
              </div>
            </motion.div>
          </div>

          {/* Répartition par certificat */}
          {bulletins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CertificatPie certificats={certificatsCounts} />
            </motion.div>
          )}

          {/* Top élèves + À surveiller */}
          {bulletins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <TopBottomLists top={studentsForRanking} topCount={10} bottomCount={5} />
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}
