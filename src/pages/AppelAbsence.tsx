import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardCheck, Loader2, Save, Users, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/hooks/useClasses";
import { useAllStudents } from "@/hooks/useStudents";
import { useBatchCreateAbsences } from "@/hooks/useAbsences";
import type { AbsenceBatchItem, AbsenceType } from "@/types/absence";

type Statut = "PRESENT" | "ABSENCE" | "RETARD";

const SEANCES = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

export default function AppelAbsencePage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [niveau, setNiveau] = useState<string>("");
  const [classeId, setClasseId] = useState<string>("");
  const [date, setDate] = useState(today);
  const [seance, setSeance] = useState<string>(SEANCES[0]);

  const [statuts, setStatuts] = useState<Record<string, Statut>>({});
  const [heuresArrivee, setHeuresArrivee] = useState<Record<string, string>>({});

  const { data: classes = [] } = useClasses();
  const { data: allStudents = [] } = useAllStudents();
  const batchMutation = useBatchCreateAbsences();

  const niveauOptions = useMemo(
    () => [...new Set(classes.map((c) => c.niveauName).filter(Boolean))].sort(),
    [classes],
  );
  const classeOptions = useMemo(
    () => classes.filter((c) => !niveau || c.niveauName === niveau).sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [classes, niveau],
  );
  const selectedClasse = useMemo(() => classes.find((c) => c.id === classeId), [classes, classeId]);

  const students = useMemo(() => {
    if (!selectedClasse) return [];
    return allStudents
      .filter((s) => s.classe === selectedClasse.fullName && s.statut === "Actif")
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
  }, [allStudents, selectedClasse]);

  const setStatut = (eleveId: string, s: Statut) => {
    setStatuts((prev) => ({ ...prev, [eleveId]: s }));
    if (s !== "RETARD") {
      setHeuresArrivee((prev) => {
        const next = { ...prev };
        delete next[eleveId];
        return next;
      });
    }
  };

  const markAllPresent = () => {
    const next: Record<string, Statut> = {};
    students.forEach((s) => (next[s.id] = "PRESENT"));
    setStatuts(next);
    setHeuresArrivee({});
  };

  const presents = students.filter((s) => (statuts[s.id] ?? "PRESENT") === "PRESENT").length;
  const absents = students.filter((s) => statuts[s.id] === "ABSENCE").length;
  const retards = students.filter((s) => statuts[s.id] === "RETARD").length;

  const canSave = classeId && date && seance && students.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const absences: AbsenceBatchItem[] = students
      .filter((s) => statuts[s.id] === "ABSENCE" || statuts[s.id] === "RETARD")
      .map((s) => {
        const type: AbsenceType = statuts[s.id] === "RETARD" ? "RETARD" : "ABSENCE";
        const item: AbsenceBatchItem = { eleveId: s.id, type, seance };
        if (type === "RETARD" && heuresArrivee[s.id]) item.heureArrivee = heuresArrivee[s.id];
        return item;
      });

    if (absences.length === 0) {
      toast.info("Aucune absence ni retard à enregistrer. Tous les élèves sont présents.");
      return;
    }

    batchMutation.mutate(
      { date, classeId, absences },
      {
        onSuccess: () => {
          toast.success(`Feuille enregistrée : ${absences.length} ${absences.length > 1 ? "élèves" : "élève"} marqués`);
          navigate("/dashboard/absences");
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          toast.error(err.response?.data?.message ?? "Erreur lors de l'enregistrement");
        },
      },
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/absences")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Faire l'appel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Marquez la présence des élèves pour une séance
            </p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label>Niveau</Label>
          <Select
            value={niveau || undefined}
            onValueChange={(v) => {
              setNiveau(v);
              setClasseId(0);
              setStatuts({});
              setHeuresArrivee({});
            }}
          >
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {niveauOptions.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Classe *</Label>
          <Select
            value={classeId || undefined}
            onValueChange={(v) => {
              setClasseId(v);
              setStatuts({});
              setHeuresArrivee({});
            }}
            disabled={!niveau}
          >
            <SelectTrigger><SelectValue placeholder={niveau ? "Choisir" : "Niveau d'abord"} /></SelectTrigger>
            <SelectContent>
              {classeOptions.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Séance *</Label>
          <Select value={seance} onValueChange={setSeance}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEANCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {classeId && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-4.5 w-4.5 text-blue-700" />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total élèves</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <UserCheck className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{presents}</p>
            <p className="text-xs text-muted-foreground">Présents</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <UserX className="h-4.5 w-4.5 text-red-700" />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{absents}</p>
            <p className="text-xs text-muted-foreground">Absents</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
              <Clock className="h-4.5 w-4.5 text-orange-700" />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{retards}</p>
            <p className="text-xs text-muted-foreground">Retards</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {!classeId ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">Sélectionnez une classe</p>
            <p className="text-xs mt-1">Choisissez niveau et classe pour voir la liste des élèves</p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">Aucun élève actif dans cette classe</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <p className="text-sm font-medium text-foreground">{students.length} élève{students.length > 1 ? "s" : ""}</p>
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Tous présents
              </Button>
            </div>
            <div className="divide-y divide-border/50">
              {students.map((s) => {
                const statut: Statut = statuts[s.id] ?? "PRESENT";
                return (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{s.nom} {s.prenom}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.matricule || `ID ${s.id}`}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={statut === "PRESENT" ? "default" : "outline"}
                        className={statut === "PRESENT" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        onClick={() => setStatut(s.id, "PRESENT")}
                      >
                        Présent
                      </Button>
                      <Button
                        size="sm"
                        variant={statut === "ABSENCE" ? "default" : "outline"}
                        className={statut === "ABSENCE" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => setStatut(s.id, "ABSENCE")}
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={statut === "RETARD" ? "default" : "outline"}
                        className={statut === "RETARD" ? "bg-orange-600 hover:bg-orange-700" : ""}
                        onClick={() => setStatut(s.id, "RETARD")}
                      >
                        Retard
                      </Button>
                      {statut === "RETARD" && (
                        <Input
                          type="time"
                          value={heuresArrivee[s.id] ?? ""}
                          onChange={(e) => setHeuresArrivee((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-[110px]"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {classeId && students.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            size="lg"
            className="gap-2 shadow-lg"
            disabled={!canSave || batchMutation.isPending}
            onClick={handleSave}
          >
            {batchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer la feuille
          </Button>
        </div>
      )}
    </div>
  );
}
