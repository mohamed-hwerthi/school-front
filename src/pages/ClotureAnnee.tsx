import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CalendarPlus,
  PartyPopper,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllAnneesScolaires } from "@/hooks/useAnneeScolaire";
import { usePreChecks, useCloturer } from "@/hooks/useCloture";
import { notify } from "@/lib/toast";
import type { ClotureResult } from "@/types/cloture";

const STEPS = ["Vérifications", "Année suivante", "Confirmation"];

/** Suggest "2026-2027" from "2025-2026". */
function nextLabel(label: string): string {
  const m = label.match(/^(\d{4})-(\d{4})$/);
  return m ? `${Number(m[1]) + 1}-${Number(m[2]) + 1}` : "";
}

export default function ClotureAnnee() {
  const { data: annees = [] } = useAllAnneesScolaires();
  const cloturer = useCloturer();

  const [step, setStep] = useState(0);
  const [anneeId, setAnneeId] = useState(0);
  const [creerSuivante, setCreerSuivante] = useState(true);
  const [labelSuivante, setLabelSuivante] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [activer, setActiver] = useState(true);
  const [result, setResult] = useState<ClotureResult | null>(null);

  const { data: preChecks, isLoading: checksLoading } = usePreChecks(anneeId);

  const ouvertes = useMemo(() => annees.filter((a) => !a.cloturee), [annees]);
  const selectedAnnee = annees.find((a) => a.id === anneeId);

  const onSelectAnnee = (id: string) => {
    setAnneeId(id);
    const a = annees.find((x) => x.id === id);
    if (a) {
      setLabelSuivante(nextLabel(a.label));
      if (a.dateDebut) setDateDebut(addYear(a.dateDebut));
      if (a.dateFin) setDateFin(addYear(a.dateFin));
    }
  };

  const handleCloturer = () => {
    if (!anneeId) return;
    cloturer.mutate(
      {
        anneeId,
        request: {
          creerAnneeSuivante: creerSuivante,
          labelAnneeSuivante: creerSuivante ? labelSuivante.trim() : undefined,
          dateDebutSuivante: creerSuivante ? dateDebut : undefined,
          dateFinSuivante: creerSuivante ? dateFin : undefined,
          activerAnneeSuivante: creerSuivante && activer,
        },
      },
      {
        onSuccess: (res) => {
          setResult(res);
          notify.success("Année clôturée", res.message);
        },
        onError: (err: Error) => notify.error("Échec de la clôture", err.message),
      }
    );
  };

  const nextYearValid =
    !creerSuivante || (labelSuivante.trim() !== "" && dateDebut !== "" && dateFin !== "" && dateFin > dateDebut);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
            <Lock className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clôture de l'année scolaire</h1>
            <p className="text-sm text-slate-500">
              Vérifier, archiver l'année en cours et préparer la suivante
            </p>
          </div>
        </div>

        {result ? (
          /* ── Résultat ── */
          <Card className="mx-auto max-w-xl">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <PartyPopper className="h-10 w-10 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-800">Clôture effectuée</h2>
              <p className="text-sm text-slate-600">{result.message}</p>
              {result.nouvelleAnneeLabel && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  Nouvelle année « {result.nouvelleAnneeLabel} » · {result.trimestresCrees} trimestres
                </Badge>
              )}
              <Button
                className="mt-2"
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setStep(0);
                  setAnneeId(0);
                }}
              >
                Terminer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-6 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === step
                        ? "bg-rose-600 text-white"
                        : i < step
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${i === step ? "font-semibold text-slate-800" : "text-slate-400"}`}>
                    {s}
                  </span>
                  {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                </div>
              ))}
            </div>

            {/* ── Step 1 — Vérifications ── */}
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Année à clôturer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Année scolaire</Label>
                    <Select
                      value={anneeId ? String(anneeId) : ""}
                      onValueChange={(v) => onSelectAnnee(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une année ouverte" />
                      </SelectTrigger>
                      <SelectContent>
                        {ouvertes.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.label} {a.active ? "(active)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {anneeId && checksLoading && (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}

                  {preChecks && (
                    <div className="space-y-2">
                      {preChecks.checks.map((c) => (
                        <div
                          key={c.code}
                          className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          {c.ok ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          ) : c.blocking ? (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              {c.label}
                              {c.blocking && !c.ok && (
                                <Badge variant="outline" className="ms-2 bg-red-50 text-red-600">
                                  bloquant
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{c.detail}</div>
                          </div>
                        </div>
                      ))}
                      {!preChecks.cloturable && (
                        <p className="text-sm text-red-600">
                          Une vérification bloquante a échoué — clôture impossible.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setStep(1)}
                      disabled={!preChecks || !preChecks.cloturable}
                    >
                      Suivant <ChevronRight className="ms-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Step 2 — Année suivante ── */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarPlus className="h-4 w-4 text-rose-600" />
                    Année scolaire suivante
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={creerSuivante}
                      onCheckedChange={(v) => setCreerSuivante(v === true)}
                    />
                    <span className="text-sm text-slate-700">
                      Créer la nouvelle année scolaire (avec ses 3 trimestres)
                    </span>
                  </label>

                  {creerSuivante && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>Libellé</Label>
                        <Input
                          value={labelSuivante}
                          onChange={(e) => setLabelSuivante(e.target.value)}
                          placeholder="2026-2027"
                        />
                      </div>
                      <div>
                        <Label>Date de début</Label>
                        <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                      </div>
                      <div>
                        <Label>Date de fin</Label>
                        <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                      </div>
                      <label className="flex items-center gap-2 sm:col-span-2">
                        <Checkbox checked={activer} onCheckedChange={(v) => setActiver(v === true)} />
                        <span className="text-sm text-slate-700">
                          Activer immédiatement cette nouvelle année
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <ChevronLeft className="me-1 h-4 w-4" /> Précédent
                    </Button>
                    <Button onClick={() => setStep(2)} disabled={!nextYearValid}>
                      Suivant <ChevronRight className="ms-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Step 3 — Confirmation ── */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mb-1 inline h-4 w-4" /> La clôture est une opération
                    importante : l'année <strong>« {selectedAnnee?.label} »</strong> passera en
                    lecture seule (sa structure ne pourra plus être modifiée).
                  </div>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>• Clôture de l'année « {selectedAnnee?.label} »</li>
                    {creerSuivante && (
                      <li>
                        • Création de l'année « {labelSuivante} » ({dateDebut} → {dateFin}) avec 3
                        trimestres{activer ? ", activée immédiatement" : ""}
                      </li>
                    )}
                  </ul>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ChevronLeft className="me-1 h-4 w-4" /> Précédent
                    </Button>
                    <Button
                      onClick={handleCloturer}
                      disabled={cloturer.isPending}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      {cloturer.isPending ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="me-2 h-4 w-4" />
                      )}
                      Clôturer l'année
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

/** Adds one year to an ISO date string (YYYY-MM-DD). */
function addYear(iso: string): string {
  const m = iso.match(/^(\d{4})(-\d{2}-\d{2})$/);
  return m ? `${Number(m[1]) + 1}${m[2]}` : iso;
}
