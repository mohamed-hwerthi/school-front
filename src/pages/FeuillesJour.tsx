import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Eye, List, Loader2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFeuillesByDate } from "@/hooks/useAbsences";

export default function FeuillesJourPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const { data: feuilles = [], isLoading } = useFeuillesByDate(date);

  const totalClasses = feuilles.length;
  const totalAbsences = feuilles.reduce((acc, f) => acc + f.absences, 0);
  const totalRetards = feuilles.reduce((acc, f) => acc + f.retards, 0);
  const totalEleves = feuilles.reduce((acc, f) => acc + f.totalEleves, 0);
  const tauxPresence =
    totalEleves > 0 ? 100 - ((totalAbsences + totalRetards) / totalEleves) * 100 : 100;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Feuilles du jour</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Une feuille par classe pour la date sélectionnée
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard/absences")}>
          <List className="h-4 w-4" />
          Voir les absences
        </Button>
      </motion.div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground md:text-end">
          {isLoading ? "Chargement…" : `${totalClasses} classe${totalClasses !== 1 ? "s" : ""} avec des élèves`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <CalendarDays className="h-4.5 w-4.5 text-blue-700" />
          </div>
          <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{totalClasses}</p>
          <p className="text-xs text-muted-foreground">Classes</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
            <UserX className="h-4.5 w-4.5 text-red-700" />
          </div>
          <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{totalAbsences}</p>
          <p className="text-xs text-muted-foreground">Total absences</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
            <Clock className="h-4.5 w-4.5 text-orange-700" />
          </div>
          <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{totalRetards}</p>
          <p className="text-xs text-muted-foreground">Total retards</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <UserCheck className="h-4.5 w-4.5 text-emerald-700" />
          </div>
          <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{tauxPresence.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Taux de présence</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : feuilles.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm p-16 text-center">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">Aucune feuille pour cette date</p>
          <p className="text-xs text-muted-foreground mt-1">Aucune classe n'a d'élève ni d'absence ce jour.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feuilles.map((f) => {
            const saisi = f.absences + f.retards > 0;
            return (
              <motion.div
                key={f.classeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading text-lg font-bold text-foreground">{f.classeLabel}</p>
                    {f.niveauName && <p className="text-xs text-muted-foreground">{f.niveauName}</p>}
                  </div>
                  {saisi ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Saisie
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      Non saisie
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center rounded-md bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground">Élèves</p>
                    <p className="font-semibold text-foreground">{f.totalEleves}</p>
                  </div>
                  <div className="text-center rounded-md bg-red-50 p-2">
                    <p className="text-xs text-red-700">Absents</p>
                    <p className="font-semibold text-red-700">{f.absences}</p>
                  </div>
                  <div className="text-center rounded-md bg-orange-50 p-2">
                    <p className="text-xs text-orange-700">Retards</p>
                    <p className="font-semibold text-orange-700">{f.retards}</p>
                  </div>
                </div>

                {f.justifiees > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">{f.justifiees} justifiée{f.justifiees > 1 ? "s" : ""}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => navigate(`/dashboard/absences/feuille?classeId=${f.classeId}&date=${date}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir détails
                  </Button>
                  {!saisi && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate("/dashboard/absences/appel")}
                    >
                      Faire l'appel
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
