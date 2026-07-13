import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { useEmploiMine, useCreneaux } from "@/hooks/useEmploiDuTemps";
import { useModules } from "@/hooks/useModules";
import { useClasses } from "@/hooks/useClasses";

const SLOT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
];

/**
 * Read-only weekly timetable for the logged-in teacher.
 * A teacher only sees his own schedule — fetched via /emploi-du-temps/me,
 * which resolves the teacher from the auth token (no class/teacher picker).
 */
export default function TeacherEmploiDuTemps() {
  const { t } = useLanguage();

  const JOURS = useMemo(
    () => [
      { value: 1, label: t("common.days.monday") },
      { value: 2, label: t("common.days.tuesday") },
      { value: 3, label: t("common.days.wednesday") },
      { value: 4, label: t("common.days.thursday") },
      { value: 5, label: t("common.days.friday") },
      { value: 6, label: t("common.days.saturday") },
    ],
    [t]
  );

  const { data: entries = [], isLoading: entriesLoading } = useEmploiMine();
  const { data: creneaux = [], isLoading: creneauxLoading } = useCreneaux();
  const { data: modules = [] } = useModules();
  const { data: classes = [] } = useClasses();

  const getEntry = (jour: number, creneauId: string) =>
    entries.find((e) => e.jourSemaine === jour && e.creneauId === creneauId);

  const moduleName = (id?: string) =>
    id ? modules.find((m) => m.id === id)?.name : undefined;
  const classeName = (id: string) =>
    classes.find((c) => c.id === id)?.fullName;

  const getModuleColor = (moduleId?: string) =>
    moduleId ? SLOT_COLORS[moduleId % SLOT_COLORS.length] : "";

  const isLoading = entriesLoading || creneauxLoading;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          {t("schedule.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Votre emploi du temps de la semaine
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm p-16 text-center"
        >
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            Aucun cours dans votre emploi du temps
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Vos séances apparaîtront ici une fois l'emploi du temps établi.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-3 text-start text-xs font-semibold text-muted-foreground w-[100px]">
                    {t("common.type")}
                  </th>
                  {JOURS.map((j) => (
                    <th
                      key={j.value}
                      className="py-3 px-2 text-center text-xs font-semibold text-muted-foreground min-w-[140px]"
                    >
                      {j.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creneaux.map((creneau) => (
                  <tr
                    key={creneau.id}
                    className={`border-b border-border/50 ${
                      creneau.type !== "COURS" ? "bg-muted/10" : ""
                    }`}
                  >
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      <div className="font-medium">{creneau.label}</div>
                      <div className="text-[10px]">
                        {creneau.heureDebut} - {creneau.heureFin}
                      </div>
                      {creneau.type !== "COURS" && (
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {creneau.type === "PAUSE"
                            ? t("schedule.slotType.break")
                            : t("schedule.slotType.recess")}
                        </Badge>
                      )}
                    </td>
                    {JOURS.map((jour) => {
                      if (creneau.type !== "COURS") {
                        return (
                          <td
                            key={jour.value}
                            className="py-2 px-2 text-center text-xs text-muted-foreground/50"
                          >
                            -
                          </td>
                        );
                      }
                      const entry = getEntry(jour.value, creneau.id);
                      return (
                        <td key={jour.value} className="py-2 px-2">
                          {entry ? (
                            <div
                              className={`w-full rounded-lg border p-2 text-start text-xs ${getModuleColor(
                                entry.moduleId
                              )}`}
                            >
                              <div className="font-semibold truncate">
                                {moduleName(entry.moduleId) ??
                                  t("schedule.subject")}
                              </div>
                              <div className="text-[10px] opacity-70 truncate">
                                {classeName(entry.classeId) ??
                                  `Classe ${entry.classeId}`}
                              </div>
                              {entry.salle && (
                                <div className="text-[10px] opacity-60 inline-flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {entry.salle}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full rounded-lg border border-dashed border-border/50 p-2 text-center text-muted-foreground/30 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
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
