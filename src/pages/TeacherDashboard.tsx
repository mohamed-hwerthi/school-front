import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  PenTool,
  UserCheck,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useRbac";
import { useClasses } from "@/hooks/useClasses";
import { useDevoirs } from "@/hooks/useDevoirs";
import { useEmploiMine } from "@/hooks/useEmploiDuTemps";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  to?: string;
  hint?: string;
  loading?: boolean;
}

function KpiCard({ label, value, icon: Icon, to, hint, loading }: KpiCardProps) {
  const inner = (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
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

export default function TeacherDashboard() {
  const { user, scopedClasseIds } = useCurrentUser();
  const { classes, isLoading: loadingClasses } = useClasses();
  const { data: devoirs = [], isLoading: loadingDevoirs } = useDevoirs();
  const { data: edtEntries = [], isLoading: loadingEdt } = useEmploiMine();

  // EDT entries scheduled for today (relies on EDT items having a `jour` field 1-7)
  const todayCourses = useMemo(() => {
    const dow = new Date().getDay() || 7; // Sunday=7
    return edtEntries.filter((e) => Number(e.jour) === dow);
  }, [edtEntries]);

  const openDevoirs = useMemo(
    () => devoirs.filter((d) => d.statut !== "FERME").length,
    [devoirs]
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
          Bonjour {user?.firstName ?? "Enseignant"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Voici votre journée — {scopedClasseIds.length} classe(s) sous votre
          responsabilité.
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
        <KpiCard
          label="Cours aujourd'hui"
          value={todayCourses.length}
          icon={Clock}
          to="/dashboard/emploi-du-temps"
          loading={loadingEdt}
        />
        <KpiCard
          label="Devoirs ouverts"
          value={openDevoirs}
          icon={PenTool}
          to="/dashboard/devoirs"
          hint={`${devoirs.length} au total`}
          loading={loadingDevoirs}
        />
        <KpiCard
          label="Mes classes"
          value={scopedClasseIds.length}
          icon={GraduationCap}
          to="/dashboard/eleves"
          loading={loadingClasses}
        />
        <KpiCard
          label="Absences à saisir"
          value="—"
          icon={UserCheck}
          to="/dashboard/absences"
          hint="Aucune source dédiée"
        />
      </motion.div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedule */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Emploi du temps du jour
            </h2>
            <Link
              to="/dashboard/emploi-du-temps"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loadingEdt ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : todayCourses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Pas de cours programmé aujourd'hui.
            </p>
          ) : (
            <ul className="space-y-2">
              {todayCourses.slice(0, 6).map((c, i) => (
                <li
                  key={c.id ?? i}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {c.moduleName ?? c.matiere ?? "Cours"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.classeName ?? c.classe ?? ""}
                      {c.salle ? ` · Salle ${c.salle}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {c.heureDebut ?? ""}
                    {c.heureFin ? ` – ${c.heureFin}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* My classes shortcut */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Mes classes
            </h2>
          </div>
          {loadingClasses ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune classe affectée.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {classes.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/dashboard/eleves?classe=${encodeURIComponent(c.fullName ?? c.letter ?? "")}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">
                      {c.fullName ?? `${c.niveauName ?? ""} ${c.letter ?? ""}`}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Open devoirs */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base font-semibold flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" />
            Devoirs récents
          </h2>
          <Link
            to="/dashboard/devoirs"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loadingDevoirs ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : devoirs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun devoir publié.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {devoirs.slice(0, 5).map((d) => (
              <li key={d.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{d.titre}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.classeName ?? ""} · échéance{" "}
                    {d.dateLimite
                      ? new Date(d.dateLimite).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    d.statut === "FERME"
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {d.statut ?? "OUVERT"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Footer cues */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-muted/20 p-4 flex items-center gap-3"
      >
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground flex-1">
          Communiquez avec les parents depuis la messagerie.
        </p>
        <Link
          to="/dashboard/notifications"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ouvrir →
        </Link>
      </motion.div>
    </div>
  );
}
