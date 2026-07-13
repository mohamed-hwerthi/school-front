import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PenLine,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  MessageSquare,
  Mail,
} from "lucide-react";
import { useNotesByExamen } from "@/hooks/useNotes";
import { useNotifyForExamen } from "@/hooks/useParentNotifications";
import { notify } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExamenDTO } from "@/api/examens.api";
import type { NoteDTO } from "@/api/notes.api";
import type { NotifChannel } from "@/api/parentNotifications.api";

interface ExamenDetailsSheetProps {
  examen: ExamenDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditNotes?: (examen: ExamenDTO) => void;
}

interface Stats {
  count: number;
  nbEleves: number;
  avg: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
  passRate: number | null; // % >= 10
  histogram: number[]; // bins: [0-5), [5-10), [10-15), [15-20]
}

function computeStats(notes: NoteDTO[], nbEleves: number): Stats {
  const values = notes
    .filter((n) => n.statut === "PRESENT" && n.valeur != null)
    .map((n) => n.valeur as number);

  if (values.length === 0) {
    return {
      count: notes.length,
      nbEleves,
      avg: null,
      median: null,
      min: null,
      max: null,
      stdDev: null,
      passRate: null,
      histogram: [0, 0, 0, 0],
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const variance =
    values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const passRate = (values.filter((v) => v >= 10).length / values.length) * 100;

  const histogram = [0, 0, 0, 0];
  for (const v of values) {
    if (v < 5) histogram[0]++;
    else if (v < 10) histogram[1]++;
    else if (v < 15) histogram[2]++;
    else histogram[3]++;
  }

  return {
    count: notes.length,
    nbEleves,
    avg,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev,
    passRate,
    histogram,
  };
}

function gradeColor(val: number) {
  if (val >= 16) return "text-emerald-600";
  if (val >= 14) return "text-green-600";
  if (val >= 10) return "text-foreground";
  if (val >= 8) return "text-orange-600";
  return "text-red-600";
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
      ? "text-orange-700"
      : tone === "bad"
      ? "text-red-700"
      : "text-foreground";

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-heading text-xl font-bold ${toneClass}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export default function ExamenDetailsSheet({
  examen,
  open,
  onOpenChange,
  onEditNotes,
}: ExamenDetailsSheetProps) {
  const { data: notes = [], isLoading } = useNotesByExamen(
    examen?.id ?? 0,
    examen?.trimestre ?? 0
  );

  // Notify dialog state
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const notifyMutation = useNotifyForExamen();

  const stats = useMemo(
    () => (examen ? computeStats(notes, examen.nbEleves ?? 0) : null),
    [notes, examen]
  );

  const handleNotifyParents = () => {
    if (!examen) return;
    const channels: NotifChannel[] = [];
    if (notifySms) channels.push("SMS");
    if (notifyEmail) channels.push("EMAIL");
    if (channels.length === 0) {
      notify.error("Sélectionnez au moins un canal");
      return;
    }
    notifyMutation.mutate(
      { examenId: examen.id, channels },
      {
        onSuccess: (count) => {
          notify.success(`${count} notification(s) envoyée(s) aux parents`);
          setNotifyOpen(false);
        },
        onError: () => notify.error("Erreur lors de l'envoi des notifications"),
      }
    );
  };

  if (!examen) return null;

  const fillRate =
    examen.nbEleves > 0 ? Math.round((examen.nbNotes / examen.nbEleves) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            {examen.name}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{examen.moduleName}</Badge>
            <Badge variant="outline">{examen.classeName}</Badge>
            <Badge variant="outline">Trimestre {examen.trimestre}</Badge>
            <Badge variant="outline">Coeff. {examen.coeffEtatique}</Badge>
            {examen.teacherName && (
              <span className="text-xs">· {examen.teacherName}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Fill summary */}
        <div className="mt-4 rounded-lg border border-border/50 bg-card p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {examen.nbNotes}/{examen.nbEleves} notes saisies
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${
                  fillRate === 100
                    ? "bg-emerald-500"
                    : fillRate > 0
                    ? "bg-orange-500"
                    : "bg-muted"
                }`}
                style={{ width: `${fillRate}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{fillRate}%</span>
        </div>

        <Tabs defaultValue="stats" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="stats">
              <TrendingUp className="h-4 w-4 me-1.5" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="notes">
              <PenLine className="h-4 w-4 me-1.5" />
              Notes ({notes.length})
            </TabsTrigger>
          </TabsList>

          {/* Stats tab */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !stats || stats.avg === null ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Aucune note présente — saisissez des notes pour voir les statistiques.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard
                    label="Moyenne"
                    value={stats.avg.toFixed(2)}
                    tone={stats.avg >= 10 ? "good" : "bad"}
                  />
                  <StatCard label="Médiane" value={stats.median!.toFixed(2)} />
                  <StatCard
                    label="Min"
                    value={stats.min!.toFixed(2)}
                    tone="bad"
                  />
                  <StatCard
                    label="Max"
                    value={stats.max!.toFixed(2)}
                    tone="good"
                  />
                  <StatCard
                    label="Écart-type"
                    value={stats.stdDev!.toFixed(2)}
                    hint="Dispersion"
                  />
                  <StatCard
                    label="Réussite"
                    value={`${stats.passRate!.toFixed(0)}%`}
                    hint="≥ 10/20"
                    tone={stats.passRate! >= 50 ? "good" : "warn"}
                  />
                  <StatCard
                    label="Présents"
                    value={String(notes.filter((n) => n.statut === "PRESENT").length)}
                  />
                  <StatCard
                    label="Absents"
                    value={String(notes.filter((n) => n.statut === "ABSENT").length)}
                  />
                </div>

                {/* Histogram */}
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    Distribution des notes
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "0 – 5", color: "bg-red-500", count: stats.histogram[0] },
                      { label: "5 – 10", color: "bg-orange-500", count: stats.histogram[1] },
                      { label: "10 – 15", color: "bg-blue-500", count: stats.histogram[2] },
                      { label: "15 – 20", color: "bg-emerald-500", count: stats.histogram[3] },
                    ].map((bar) => {
                      const total = stats.histogram.reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (bar.count / total) * 100 : 0;
                      return (
                        <div key={bar.label} className="flex items-center gap-2">
                          <span className="text-xs w-14 text-muted-foreground">
                            {bar.label}
                          </span>
                          <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.4 }}
                              className={`h-full ${bar.color}`}
                            />
                          </div>
                          <span className="text-xs font-medium w-10 text-end">
                            {bar.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Notes tab */}
          <TabsContent value="notes" className="mt-4">
            <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/30 border-b border-border">
                    <tr>
                      <th className="py-2 px-3 text-start text-xs font-semibold text-muted-foreground w-8">
                        #
                      </th>
                      <th className="py-2 px-3 text-start text-xs font-semibold text-muted-foreground">
                        Élève
                      </th>
                      <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">
                        Note
                      </th>
                      <th className="py-2 px-3 text-start text-xs font-semibold text-muted-foreground">
                        Observation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-muted-foreground text-sm"
                        >
                          Aucune note saisie pour cet examen.
                        </td>
                      </tr>
                    ) : (
                      notes.map((n, i) => (
                        <tr
                          key={n.id}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/10"
                        >
                          <td className="py-2 px-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="py-2 px-3 font-medium">{n.studentName}</td>
                          <td className="py-2 px-3 text-center">
                            {n.statut === "ABSENT" ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Abs.
                              </Badge>
                            ) : n.statut === "EXEMPT" ? (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                Exempt
                              </Badge>
                            ) : n.valeur != null ? (
                              <span className={`font-bold ${gradeColor(n.valeur)}`}>
                                {n.valeur.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">
                            {n.observation || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-2 sticky bottom-0 bg-background pt-3 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setNotifyOpen(true)}
            disabled={examen.nbNotes === 0}
            className="gap-1.5"
            title={
              examen.nbNotes === 0
                ? "Aucune note saisie — rien à notifier"
                : "Envoyer les notes aux parents"
            }
          >
            <Send className="h-4 w-4" />
            Notifier les parents
          </Button>
          {onEditNotes && (
            <Button onClick={() => onEditNotes(examen)} className="gap-1.5">
              {fillRate === 100 ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Modifier les notes
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4" />
                  Saisir les notes
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>

      {/* Notify parents dialog */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notifier les parents</DialogTitle>
            <DialogDescription>
              Un message sera envoyé aux parents de chaque élève ayant une note saisie pour
              <strong> {examen.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Aperçu du message :</p>
              <p className="italic">
                « Bonjour, votre enfant {"{prénom}"} a obtenu {"{note}"}/20 en {examen.moduleName} ({examen.name} —
                Trimestre {examen.trimestre}). Cordialement, l'école. »
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Canaux d'envoi</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={notifySms}
                    onCheckedChange={(c) => setNotifySms(!!c)}
                  />
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={notifyEmail}
                    onCheckedChange={(c) => setNotifyEmail(!!c)}
                  />
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email</span>
                </label>
              </div>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-900">
              <strong>{examen.nbNotes}</strong> notification(s) seront envoyées (1 par parent
              avec note saisie).
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleNotifyParents}
              disabled={notifyMutation.isPending || (!notifySms && !notifyEmail)}
              className="gap-1.5"
            >
              {notifyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
