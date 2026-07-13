import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Info,
  RefreshCw,
  UserCog,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useActiveAnneeScolaire } from "@/hooks/useAnneeScolaire";
import { useGenerateEmploi, useTimetablePreviewCheck } from "@/hooks/useEmploiDuTemps";
import { notify } from "@/lib/toast";
import type {
  TimetableGenerateResponse,
  TimetablePreviewCheck,
} from "@/types/emploi-du-temps";

type Step = "check" | "running" | "result";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GenerationWizard({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { niveaux } = useNiveaux();
  const { data: activeAnnee } = useActiveAnneeScolaire();

  const [step, setStep] = useState<Step>("check");
  const [niveauId, setNiveauId] = useState<string | undefined>(undefined);
  const [timeout, setTimeout] = useState(60);
  const [result, setResult] = useState<TimetableGenerateResponse | null>(null);

  // Reset state every time the dialog opens
  useEffect(() => {
    if (open) {
      setStep("check");
      setResult(null);
    }
  }, [open]);

  const {
    data: preview,
    isLoading: previewLoading,
    refetch: refetchPreview,
  } = useTimetablePreviewCheck({ niveauId }, open && step === "check");

  const generate = useGenerateEmploi();

  const handleGenerate = () => {
    setStep("running");
    generate.mutate(
      {
        niveauId,
        anneeScolaireId: activeAnnee?.id,
        solverTimeoutSeconds: timeout,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setStep("result");
          if (data.status === "SOLVED") {
            notify.success(`Emploi du temps généré (${data.entries.length} cours placés)`);
          } else {
            notify.warning("Génération terminée avec des conflits non résolus");
          }
        },
        onError: (err) => {
          notify.error(err.message || "Erreur lors de la génération");
          setStep("check");
        },
      }
    );
  };

  const close = () => {
    if (step === "running") return; // don't close mid-solve
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Génération automatique de l'emploi du temps
          </DialogTitle>
          <DialogDescription>
            Le solveur charge volumes horaires, disponibilités enseignants et salles depuis la base.
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP HEADER (3 dots) ──────────────────────── */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(["check", "running", "result"] as Step[]).map((s, i) => {
            const active = s === step;
            const passed =
              (s === "check" && step !== "check") ||
              (s === "running" && step === "result");
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : passed
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {passed ? "✓" : i + 1}
                </div>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: CHECK ──────────────────────────────── */}
        {step === "check" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Niveau (optionnel)</Label>
                <Select
                  value={niveauId ? String(niveauId) : "all"}
                  onValueChange={(v) => setNiveauId(v === "all" ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={String(n.id)}>
                        {n.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timeout solveur (s)</Label>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={timeout}
                  onChange={(e) => setTimeout(Math.min(300, Math.max(10, Number(e.target.value))))}
                />
              </div>
            </div>

            {previewLoading || !preview ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin me-2" />
                Analyse des données...
              </div>
            ) : (
              <PreviewSummary
                preview={preview}
                onGoToTeachers={() => {
                  onClose();
                  navigate("/dashboard/enseignants");
                }}
              />
            )}

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="ghost" size="sm" onClick={() => refetchPreview()}>
                <RefreshCw className="h-4 w-4 me-1.5" />
                Recharger l'analyse
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={close}>Annuler</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!preview?.canGenerate || previewLoading}
                >
                  <Wand2 className="h-4 w-4 me-1.5" />
                  Lancer la génération
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP 2: RUNNING ────────────────────────────── */}
        {step === "running" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Solveur en cours...</p>
              <p className="text-sm text-muted-foreground mt-1">
                {timeout}s max — le solveur explore les combinaisons.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULT ─────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-4">
            <div
              className={`rounded-lg p-4 ${
                result.status === "SOLVED"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.status === "SOLVED" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span
                  className={`font-semibold ${
                    result.status === "SOLVED" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {result.status === "SOLVED"
                    ? "Emploi du temps généré avec succès"
                    : "Génération terminée avec des conflits"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 ms-7">
                Score : <strong>{result.score}</strong> · {result.entries.length} cours placés
              </p>
            </div>

            {result.unresolvedConflicts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Conflits non résolus ({result.unresolvedConflicts.length})
                </p>
                <ul className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {result.unresolvedConflicts.map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 flex items-start gap-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("check")}>
                Régénérer
              </Button>
              <Button onClick={close}>Fermer</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Preview summary card ───────────────────────────────── */

function PreviewSummary({
  preview,
  onGoToTeachers,
}: {
  preview: TimetablePreviewCheck;
  onGoToTeachers: () => void;
}) {
  const teachersWithDispos =
    preview.totalTeachersInvolved - preview.teachersWithoutDispos;
  const dispoCoverage =
    preview.totalTeachersInvolved > 0
      ? Math.round((teachersWithDispos / preview.totalTeachersInvolved) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Année" value={preview.anneeScolaireLabel ?? "—"} />
        <Stat
          label="Périmètre"
          value={preview.niveauName ?? "Tous les niveaux"}
        />
        <Stat
          label="Matières avec volume"
          value={`${preview.modulesWithVolume} / ${preview.totalModules}`}
        />
        <Stat
          label="Cours à placer"
          value={`${preview.totalLessonsToSchedule} h/sem`}
        />
        <Stat
          label="Enseignants impliqués"
          value={String(preview.totalTeachersInvolved)}
        />
        <Stat
          label="Salles disponibles"
          value={`${preview.totalAvailableRooms} (${preview.courseSlotsPerWeek} créneaux/sem)`}
        />
      </div>

      {/* ── Dispos enseignants ──────────────────────── */}
      {preview.totalTeachersInvolved > 0 && (
        <div className="rounded-lg border border-border/50 bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Disponibilités enseignants
              </span>
            </div>
            <span
              className={`text-xs font-medium ${
                dispoCoverage === 100
                  ? "text-emerald-600"
                  : dispoCoverage >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {teachersWithDispos} / {preview.totalTeachersInvolved} saisies (
              {dispoCoverage} %)
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                dispoCoverage === 100
                  ? "bg-emerald-500"
                  : dispoCoverage >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${dispoCoverage}%` }}
            />
          </div>

          {preview.teachersWithoutDispos === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tous les enseignants ont saisi leurs disponibilités.
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Sans dispos saisies, le solveur considère le prof{" "}
                <strong>disponible 100 %</strong> du temps. À éviter pour les
                vacataires et mi-temps.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.teachersWithoutDisposList.slice(0, 8).map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-800"
                  >
                    {t.name}
                  </span>
                ))}
                {preview.teachersWithoutDisposList.length > 8 && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{preview.teachersWithoutDisposList.length - 8} autres
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={onGoToTeachers}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Saisir les disponibilités maintenant
              </Button>
            </>
          )}
        </div>
      )}

      {Object.keys(preview.roomsByType).length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 flex flex-wrap gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="font-medium me-1">Salles par type :</span>
          {Object.entries(preview.roomsByType).map(([type, n]) => (
            <span key={type}>
              {type} ({n})
            </span>
          ))}
        </div>
      )}

      {preview.blockers.length > 0 && (
        <div className="space-y-1.5">
          {preview.blockers.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800"
            >
              <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="space-y-1.5">
          {preview.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {preview.canGenerate && preview.warnings.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Tous les prérequis sont satisfaits — vous pouvez lancer la génération.</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}
