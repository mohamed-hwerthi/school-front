import { Trophy, AlertTriangle, Crown, Medal } from "lucide-react";
import type { ComponentType } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const RANGES = [
  { label: "[0-5[", min: 0, max: 5, color: "#ef4444" },
  { label: "[5-10[", min: 5, max: 10, color: "#f97316" },
  { label: "[10-14[", min: 10, max: 14, color: "#f59e0b" },
  { label: "[14-17[", min: 14, max: 17, color: "#10b981" },
  { label: "[17-20]", min: 17, max: 20.001, color: "#16a34a" },
];

export function computeStats(values: number[]) {
  if (values.length === 0) {
    return {
      count: 0, mean: 0, median: 0, min: 0, max: 0, stddev: 0,
      q1: 0, q3: 0, passRate: 0, mentionRate: 0, mentionTBRate: 0, failRate: 0,
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / values.length;
  const median = sorted.length % 2
    ? sorted[Math.floor(sorted.length / 2)]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const passRate = (values.filter((v) => v >= 10).length / values.length) * 100;
  const mentionRate = (values.filter((v) => v >= 14).length / values.length) * 100;
  const mentionTBRate = (values.filter((v) => v >= 16).length / values.length) * 100;
  const failRate = (values.filter((v) => v < 10).length / values.length) * 100;
  return {
    count: values.length,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    stddev: Math.round(stddev * 100) / 100,
    passRate: Math.round(passRate),
    mentionRate: Math.round(mentionRate),
    mentionTBRate: Math.round(mentionTBRate),
    failRate: Math.round(failRate),
  };
}

function distribution(values: number[]) {
  return RANGES.map((r) => ({
    range: r.label,
    count: values.filter((v) => v >= r.min && v < r.max).length,
    color: r.color,
  }));
}

// ─── Shared UI primitives ──────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/40 bg-card p-4 shadow-sm ${className}`}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function FancyTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="text-[11px] font-semibold text-foreground mb-1">
          {label}
        </p>
      )}
      {payload.map((p, idx) => {
        const v = p.value as number;
        const display = formatter ? formatter(v) : String(v);
        return (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            {p.color && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            )}
            <span className="font-medium text-foreground tabular-nums">
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Map a Tailwind text-* color to chip background tone (no dynamic classes).
function toneFromColor(color?: string) {
  if (!color) return { chip: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300", accent: "bg-slate-300/60" };
  if (color.includes("emerald") || color.includes("green"))
    return { chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", accent: "bg-emerald-400/70" };
  if (color.includes("red"))
    return { chip: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400", accent: "bg-red-400/70" };
  if (color.includes("amber") || color.includes("orange") || color.includes("yellow"))
    return { chip: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400", accent: "bg-amber-400/70" };
  if (color.includes("blue"))
    return { chip: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400", accent: "bg-blue-400/70" };
  if (color.includes("violet") || color.includes("purple"))
    return { chip: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400", accent: "bg-violet-400/70" };
  return { chip: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300", accent: "bg-slate-300/60" };
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

export function KpiCard({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color?: string;
  iconColor?: string;
}) {
  const tone = toneFromColor(color);
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-border/70">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${tone.accent}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
          {label}
        </p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${tone.chip}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={`font-heading font-bold text-xl tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Distribution: vertical bars ───────────────────────────────────────────

export function DistributionChart({
  values,
  title = "Distribution des notes",
}: {
  values: number[];
  title?: string;
}) {
  const data = distribution(values);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard
      title={title}
      subtitle={total > 0 ? `${total} élève(s)` : undefined}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220 15% 92%)"
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(220 15% 95% / 0.5)" }}
            content={
              <FancyTooltip formatter={(v) => `${v} élève(s)`} />
            }
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Donut: Pass / Fail with center label ──────────────────────────────────

export function PassFailPie({ pass, fail }: { pass: number; fail: number }) {
  const total = pass + fail;
  if (total === 0) return null;
  const pct = Math.round((pass / total) * 100);
  const data = [
    { name: "Réussite", value: pass, color: "#10b981" },
    { name: "Échec", value: fail, color: "#ef4444" },
  ];
  return (
    <ChartCard title="Réussite / Échec" subtitle={`${total} élève(s)`}>
      <div className="relative h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={88}
              innerRadius={62}
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={
                <FancyTooltip formatter={(v) => `${v} élève(s)`} />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-heading font-bold text-emerald-600 tabular-nums leading-none">
            {pct}%
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            Réussite
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Réussite</span>
          <span className="font-semibold text-foreground tabular-nums">
            {pass}
          </span>
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Échec</span>
          <span className="font-semibold text-foreground tabular-nums">
            {fail}
          </span>
        </span>
      </div>
    </ChartCard>
  );
}

// ─── Mentions: CSS progress bars (cleaner than recharts) ──────────────────

const MENTIONS = [
  { mention: "Échec", min: 0, max: 10, color: "#ef4444", tone: "bg-red-500" },
  { mention: "Passable", min: 10, max: 12, color: "#f97316", tone: "bg-orange-500" },
  { mention: "Assez bien", min: 12, max: 14, color: "#f59e0b", tone: "bg-amber-500" },
  { mention: "Bien", min: 14, max: 16, color: "#22c55e", tone: "bg-green-500" },
  { mention: "Très bien", min: 16, max: 18, color: "#10b981", tone: "bg-emerald-500" },
  { mention: "Excellent", min: 18, max: 20.001, color: "#0ea5e9", tone: "bg-sky-500" },
];

export function MentionsBar({ values }: { values: number[] }) {
  const data = MENTIONS.map((m) => ({
    ...m,
    count: values.filter((v) => v >= m.min && v < m.max).length,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ChartCard
      title="Répartition par mention"
      subtitle={total > 0 ? `${total} élève(s)` : undefined}
    >
      <div className="space-y-2.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.count / total) * 100 : 0;
          const barWidth = (d.count / max) * 100;
          return (
            <div key={d.mention} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-foreground">
                {d.mention}
              </span>
              <div className="flex-1 h-6 rounded-md bg-muted/40 overflow-hidden relative">
                <div
                  className={`h-full ${d.tone} transition-all duration-500 ease-out`}
                  style={{ width: `${barWidth}%` }}
                />
                {d.count > 0 && (
                  <span
                    className="absolute inset-y-0 flex items-center text-[11px] font-semibold text-white tabular-nums px-2"
                    style={{
                      left: barWidth > 12 ? `calc(${barWidth}% - 28px)` : `${barWidth}%`,
                      paddingLeft: barWidth > 12 ? 0 : 4,
                      color: barWidth > 12 ? "white" : "hsl(var(--foreground))",
                    }}
                  >
                    {d.count}
                  </span>
                )}
              </div>
              <span className="w-10 shrink-0 text-end text-xs text-muted-foreground tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ─── Top / Bottom lists with rank chip + bar ──────────────────────────────

function rankIcon(rank: number) {
  if (rank === 1)
    return (
      <Crown className="h-3.5 w-3.5 text-amber-500" />
    );
  if (rank === 2)
    return <Medal className="h-3.5 w-3.5 text-slate-400" />;
  if (rank === 3)
    return <Medal className="h-3.5 w-3.5 text-amber-700" />;
  return null;
}

function rankChipClass(rank: number, kind: "top" | "bottom") {
  if (kind === "bottom")
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
  if (rank === 1) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  if (rank === 2) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (rank === 3) return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
  return "bg-muted text-muted-foreground";
}

export function TopBottomLists({
  top,
  topCount = 10,
  bottomCount = 5,
}: {
  top: { name: string; value: number }[];
  topCount?: number;
  bottomCount?: number;
}) {
  const topN = [...top].sort((a, b) => b.value - a.value).slice(0, topCount);
  const bottomN = [...top].sort((a, b) => a.value - b.value).slice(0, bottomCount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard
        title="Top élèves"
        subtitle={`Les ${topN.length} meilleurs`}
        className="bg-gradient-to-br from-amber-50/40 to-card dark:from-amber-950/10"
      >
        <div className="flex items-center gap-2 -mt-1 mb-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-[11px] text-muted-foreground">
            Note la plus élevée en tête
          </span>
        </div>
        <ul className="space-y-2">
          {topN.map((s, i) => {
            const rank = i + 1;
            const pct = (s.value / 20) * 100;
            return (
              <li
                key={s.name + i}
                className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/40 transition-colors"
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${rankChipClass(rank, "top")}`}
                >
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1 text-xs font-medium text-foreground truncate">
                      {s.name}
                      {rankIcon(rank)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 tabular-nums shrink-0">
                      {s.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ChartCard>

      <ChartCard
        title="À surveiller"
        subtitle={`Les ${bottomN.length} plus faibles`}
        className="bg-gradient-to-br from-red-50/40 to-card dark:from-red-950/10"
      >
        <div className="flex items-center gap-2 -mt-1 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-[11px] text-muted-foreground">
            Soutien recommandé
          </span>
        </div>
        <ul className="space-y-2">
          {bottomN.map((s, i) => {
            const rank = i + 1;
            const pct = (s.value / 20) * 100;
            return (
              <li
                key={s.name + i}
                className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/40 transition-colors"
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${rankChipClass(rank, "bottom")}`}
                >
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground truncate">
                      {s.name}
                    </span>
                    <span className="text-xs font-semibold text-red-600 tabular-nums shrink-0">
                      {s.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ChartCard>
    </div>
  );
}

// ─── Certificat donut: side legend, no leader lines ───────────────────────

export function CertificatPie({
  certificats,
}: {
  certificats: { type: string; count: number }[];
}) {
  const data = certificats.filter((c) => c.count > 0);
  if (data.length === 0) {
    return (
      <ChartCard title="Répartition par certificat">
        <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground text-center">
          Aucun certificat attribué
          <br />
          dans cette classe
        </div>
      </ChartCard>
    );
  }
  const colors = ["#fbbf24", "#3b82f6", "#10b981", "#8b5cf6", "#94a3b8", "#f97316"];
  const total = data.reduce((s, d) => s + d.count, 0);
  const colored = data.map((d, i) => ({
    ...d,
    color: colors[i % colors.length],
  }));

  return (
    <ChartCard title="Répartition par certificat" subtitle={`${total} élève(s)`}>
      <div className="flex items-center gap-4">
        <div className="relative h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={colored}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={48}
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {colored.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <FancyTooltip formatter={(v) => `${v} élève(s)`} />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-heading font-bold text-foreground tabular-nums leading-none">
              {total}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Total
            </p>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 min-w-0">
          {colored.map((d) => {
            const pct = (d.count / total) * 100;
            return (
              <li
                key={d.type}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span
                    className="font-medium text-foreground truncate"
                    dir="auto"
                  >
                    {d.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-foreground tabular-nums">
                    {d.count}
                  </span>
                  <span className="text-muted-foreground tabular-nums w-9 text-end">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}
