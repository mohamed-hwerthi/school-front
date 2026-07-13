import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Loader2,
  ArrowRight,
  Users,
  UserCheck,
  Sparkles,
  UserMinus,
  FileCheck,
  Printer,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scolariteApi } from "@/api/scolarite.api";
import { useAllAnneesScolaires } from "@/hooks/useAnneeScolaire";
import { useReinscrire, useSuiviReinscription } from "@/hooks/useScolarite";
import { notify } from "@/lib/toast";
import type { ReinscriptionResult, AttestationReussite } from "@/types/scolarite";

export default function Reinscriptions() {
  const { data: annees = [] } = useAllAnneesScolaires();
  const reinscrire = useReinscrire();

  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [result, setResult] = useState<ReinscriptionResult | null>(null);

  const [suiviAnnee, setSuiviAnnee] = useState("");
  const { data: suivi, isLoading: suiviLoading } = useSuiviReinscription(suiviAnnee);

  // Attestation de réussite (ANN-042)
  const [attYear, setAttYear] = useState("");
  const [attStudent, setAttStudent] = useState("");
  const [attResult, setAttResult] = useState<AttestationReussite | null>(null);
  const [attLoading, setAttLoading] = useState(false);

  const handleAttestation = async () => {
    if (!attYear || !attStudent) {
      notify.error("Champs requis", "Sélectionnez l'année et le numéro de l'élève.");
      return;
    }
    setAttLoading(true);
    try {
      setAttResult(await scolariteApi.getAttestationReussite(Number(attStudent), attYear));
    } catch (e) {
      setAttResult(null);
      notify.error("Erreur", e instanceof Error ? e.message : "Élève introuvable.");
    } finally {
      setAttLoading(false);
    }
  };

  const labels = useMemo(() => annees.map((a) => a.label), [annees]);

  const handleReinscrire = () => {
    if (!source || !dest) {
      notify.error("Champs requis", "Sélectionnez l'année source et l'année de destination.");
      return;
    }
    if (source === dest) {
      notify.error("Années identiques", "La destination doit différer de la source.");
      return;
    }
    reinscrire.mutate(
      { source, dest },
      {
        onSuccess: (res) => {
          setResult(res);
          notify.success("Réinscription effectuée", res.message);
        },
        onError: (err: Error) => notify.error("Échec de la réinscription", err.message),
      }
    );
  };

  const suiviCards = suivi
    ? [
        { label: "Inscrits", value: suivi.totalInscrits, icon: Users, color: "#6366f1" },
        { label: "Réinscrits", value: suivi.reinscrits, icon: UserCheck, color: "#10b981" },
        { label: "Nouveaux", value: suivi.nouveaux, icon: Sparkles, color: "#3b82f6" },
        { label: "Partis", value: suivi.partis, icon: UserMinus, color: "#ef4444" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
            <UserPlus className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Réinscriptions</h1>
            <p className="text-sm text-slate-500">
              Reconduire les élèves admis et suivre les effectifs d'une année à l'autre
            </p>
          </div>
        </div>

        {/* ── Réinscription en masse (ANN-050) ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Réinscription des élèves admis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Crée la scolarité de l'année de destination pour chaque élève ayant une décision
              de <strong>passage</strong> sur l'année source.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px]">
                <Label>Année source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Année terminée" />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="mb-2 h-5 w-5 text-slate-400" />
              <div className="min-w-[160px]">
                <Label>Année de destination</Label>
                <Select value={dest} onValueChange={setDest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nouvelle année" />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleReinscrire} disabled={reinscrire.isPending}>
                {reinscrire.isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="me-2 h-4 w-4" />
                )}
                Réinscrire les admis
              </Button>
            </div>
            {result && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <UserCheck className="h-4 w-4" />
                {result.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Suivi réinscrits / partis (ANN-051) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi des effectifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label>Année scolaire</Label>
              <Select value={suiviAnnee} onValueChange={setSuiviAnnee}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une année" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {suiviAnnee && suiviLoading && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {suivi && (
              <>
                {suivi.anneePrecedente && (
                  <Badge variant="outline">
                    Comparé à {suivi.anneePrecedente}
                  </Badge>
                )}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {suiviCards.map((c) => {
                    const Icon = c.icon;
                    return (
                      <Card key={c.label}>
                        <CardContent className="flex items-center gap-3 py-4">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${c.color}1a` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: c.color }} />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-slate-800">{c.value}</div>
                            <div className="text-xs text-slate-500">{c.label}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Attestation de réussite (ANN-042) ── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Attestation de réussite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 print:hidden">
              <div className="min-w-[150px]">
                <Label>Année scolaire</Label>
                <Select value={attYear} onValueChange={setAttYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>N° élève</Label>
                <Input
                  type="number"
                  value={attStudent}
                  onChange={(e) => setAttStudent(e.target.value)}
                  placeholder="ID"
                />
              </div>
              <Button variant="outline" onClick={handleAttestation} disabled={attLoading}>
                {attLoading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="me-2 h-4 w-4" />
                )}
                Générer
              </Button>
              {attResult && (
                <Button variant="ghost" onClick={() => window.print()}>
                  <Printer className="me-2 h-4 w-4" /> Imprimer
                </Button>
              )}
            </div>
            {attResult && (
              <div
                className={`rounded-lg border px-4 py-4 ${
                  attResult.eligible
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="text-sm font-semibold text-slate-800">{attResult.studentName}</div>
                <div className="text-xs text-slate-500">Année scolaire {attResult.anneeScolaire}</div>
                <div
                  className={`mt-2 text-sm ${
                    attResult.eligible ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {attResult.eligible ? "✓ " : "⚠ "}
                  {attResult.message}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
