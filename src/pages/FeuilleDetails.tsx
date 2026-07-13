import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Printer, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAbsencesByClasseDate } from "@/hooks/useAbsences";
import { useClasses } from "@/hooks/useClasses";
import { useAllStudents } from "@/hooks/useStudents";

type Statut = "PRESENT" | "ABSENCE" | "RETARD";

export default function FeuilleDetailsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classeId = params.get("classeId") ?? "";
  const date = params.get("date") ?? new Date().toISOString().split("T")[0];

  const { data: classes = [] } = useClasses();
  const { data: allStudents = [] } = useAllStudents();
  const { data: absences = [], isLoading } = useAbsencesByClasseDate(classeId, date);

  const classe = classes.find((c) => c.id === classeId);

  const eleves = useMemo(() => {
    if (!classe) return [];
    return allStudents
      .filter((s) => s.classe === classe.fullName && s.statut === "Actif")
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
  }, [allStudents, classe]);

  const absencesByEleve = useMemo(() => {
    const m = new Map<string, typeof absences>();
    absences.forEach((a) => {
      const list = m.get(a.eleveId) ?? [];
      list.push(a);
      m.set(a.eleveId, list);
    });
    return m;
  }, [absences]);

  const getStatut = (eleveId: string): { statut: Statut; seance?: string; heure?: string; justifie?: boolean; motif?: string } => {
    const list = absencesByEleve.get(eleveId);
    if (!list || list.length === 0) return { statut: "PRESENT" };
    const abs = list.find((a) => a.type === "ABSENCE");
    if (abs) return { statut: "ABSENCE", seance: abs.seance, justifie: abs.justifie, motif: abs.motif };
    const ret = list[0];
    return { statut: "RETARD", seance: ret.seance, heure: ret.heureArrivee, justifie: ret.justifie, motif: ret.motif };
  };

  const presents = eleves.filter((s) => getStatut(s.id).statut === "PRESENT").length;
  const absents = eleves.filter((s) => getStatut(s.id).statut === "ABSENCE").length;
  const retards = eleves.filter((s) => getStatut(s.id).statut === "RETARD").length;

  if (!classeId || !classe) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
          <p className="font-medium">Classe introuvable</p>
          <Button variant="outline" className="mt-3" onClick={() => navigate("/dashboard/absences")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 print:p-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Feuille complète — {classe.fullName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </motion.div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Feuille de présence — {classe.fullName}</h1>
        <p className="text-sm">{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 print:hidden">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total élèves</p>
          <p className="mt-1 font-heading text-2xl font-bold">{eleves.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs text-emerald-700">Présents</p>
          <p className="mt-1 font-heading text-2xl font-bold text-emerald-700">{presents}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs text-red-700">Absents</p>
          <p className="mt-1 font-heading text-2xl font-bold text-red-700">{absents}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs text-orange-700">Retards</p>
          <p className="mt-1 font-heading text-2xl font-bold text-orange-700">{retards}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : eleves.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-16 text-center text-muted-foreground">
          Aucun élève actif dans cette classe.
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50 print:bg-white">
              <tr>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-12">#</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Matricule</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Séance</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Heure</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Justifié</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {eleves.map((s, idx) => {
                const info = getStatut(s.id);
                return (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{s.nom} {s.prenom}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.matricule ?? "-"}</td>
                    <td className="py-3 px-4">
                      {info.statut === "PRESENT" && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Présent
                        </Badge>
                      )}
                      {info.statut === "ABSENCE" && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                          <UserX className="h-3 w-3" /> Absent
                        </Badge>
                      )}
                      {info.statut === "RETARD" && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
                          <Clock className="h-3 w-3" /> Retard
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{info.seance ?? "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{info.heure ?? "-"}</td>
                    <td className="py-3 px-4">
                      {info.statut === "PRESENT" ? (
                        <span className="text-muted-foreground">-</span>
                      ) : info.justifie ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Oui</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">Non</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{info.motif ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
