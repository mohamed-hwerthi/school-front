import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Loader2,
  Save,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useConseilClasse, useBulkCreatePassages } from "@/hooks/useConseilClasse";
import { notify } from "@/lib/toast";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import { DECISIONS, type DecisionType } from "@/types/passage";
import type { PropositionPassage } from "@/types/conseil-classe";

const DECISION_LABELS: Record<DecisionType, string> = {
  PASSAGE: "Passage",
  REDOUBLEMENT: "Redoublement",
  EXCLUSION: "Exclusion",
  TRANSFERT: "Transfert",
};

const DECISION_STYLES: Record<DecisionType, string> = {
  PASSAGE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REDOUBLEMENT: "bg-amber-100 text-amber-700 border-amber-200",
  EXCLUSION: "bg-red-100 text-red-700 border-red-200",
  TRANSFERT: "bg-blue-100 text-blue-700 border-blue-200",
};

const FALLBACK_ANNEE = getSelectedAnneeScolaire();

type RowEdit = { decision: DecisionType; motif: string };

function fmt(n: number | null): string {
  return n == null ? "—" : n.toFixed(2);
}

export default function ConseilClasse() {
  const { niveaux, isLoading: niveauxLoading } = useNiveaux();
  const [selectedNiveau, setSelectedNiveau] = useState(0);
  const [selectedClasse, setSelectedClasse] = useState(0);
  const { data: classes = [] } = useClasses(selectedNiveau || undefined);

  const { data: conseil, isLoading: conseilLoading } = useConseilClasse(selectedClasse);
  const bulkCreate = useBulkCreatePassages();

  // Editable decision/motif per student, seeded from the proposals.
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!conseil) return;
    const seed: Record<number, RowEdit> = {};
    for (const p of conseil.propositions) {
      seed[p.studentId] = { decision: p.decisionProposee, motif: "" };
    }
    setEdits(seed);
    setSubmitted(false);
  }, [conseil]);

  const propositions = useMemo(() => conseil?.propositions ?? [], [conseil]);

  const counts = useMemo(() => {
    const c: Record<DecisionType, number> = {
      PASSAGE: 0,
      REDOUBLEMENT: 0,
      EXCLUSION: 0,
      TRANSFERT: 0,
    };
    for (const p of propositions) {
      const d = edits[p.studentId]?.decision ?? p.decisionProposee;
      c[d] += 1;
    }
    return c;
  }, [propositions, edits]);

  const setDecision = (studentId: string, decision: DecisionType) => {
    setEdits((prev) => ({
      ...prev,
      [studentId]: { decision, motif: prev[studentId]?.motif ?? "" },
    }));
  };

  const setMotif = (studentId: string, motif: string) => {
    setEdits((prev) => ({
      ...prev,
      [studentId]: { decision: prev[studentId]?.decision ?? "REDOUBLEMENT", motif },
    }));
  };

  const resetEdits = () => {
    const seed: Record<number, RowEdit> = {};
    for (const p of propositions) {
      seed[p.studentId] = { decision: p.decisionProposee, motif: "" };
    }
    setEdits(seed);
  };

  const buildPayload = (p: PropositionPassage, edit: RowEdit) => {
    const decision = edit.decision;
    let nouveauNiveau = "";
    let nouvelleClasse = "";
    if (decision === "PASSAGE") {
      nouveauNiveau = p.niveauSuivant ?? "";
    } else if (decision === "REDOUBLEMENT") {
      nouveauNiveau = p.niveauActuel;
      nouvelleClasse = p.classeActuelle;
    }
    return {
      studentId: p.studentId,
      ancienNiveau: p.niveauActuel,
      nouveauNiveau,
      ancienneClasse: p.classeActuelle,
      nouvelleClasse,
      decision,
      anneeScolaire: conseil?.anneeScolaire ?? FALLBACK_ANNEE,
      motif: edit.motif.trim(),
    };
  };

  const handleSubmit = () => {
    if (!conseil || propositions.length === 0) return;

    // A PASSAGE needs a configured higher niveau.
    const blockedPassage = propositions.some(
      (p) =>
        (edits[p.studentId]?.decision ?? p.decisionProposee) === "PASSAGE" &&
        !p.niveauSuivant
    );
    if (blockedPassage) {
      notify.error(
        "Passage impossible",
        "Aucun niveau supérieur n'est configuré. Choisissez une autre décision pour les élèves concernés."
      );
      return;
    }

    // EXCLUSION / TRANSFERT require a motif (also enforced server-side).
    const missingMotif = propositions.some((p) => {
      const e = edits[p.studentId];
      const decision = e?.decision ?? p.decisionProposee;
      return (
        (decision === "EXCLUSION" || decision === "TRANSFERT") &&
        !(e?.motif ?? "").trim()
      );
    });
    if (missingMotif) {
      notify.error(
        "Motif requis",
        "Un motif est obligatoire pour les décisions Exclusion et Transfert."
      );
      return;
    }

    const passages = propositions.map((p) =>
      buildPayload(p, edits[p.studentId] ?? { decision: p.decisionProposee, motif: "" })
    );

    bulkCreate.mutate(
      { passages },
      {
        onSuccess: () => {
          notify.success(
            "Conseil de classe validé",
            `${passages.length} décision(s) enregistrée(s).`
          );
          setSubmitted(true);
        },
        onError: (err: Error) => {
          notify.error("Échec de l'enregistrement", err.message);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
            <GraduationCap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Conseil de classe</h1>
            <p className="text-sm text-slate-500">
              Moyennes annuelles et décisions de passage de fin d'année
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 print:hidden">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div>
              <Label>Niveau</Label>
              <Select
                value={selectedNiveau ? String(selectedNiveau) : ""}
                onValueChange={(v) => {
                  setSelectedNiveau(v);
                  setSelectedClasse(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={niveauxLoading ? "Chargement..." : "Sélectionnez un niveau"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classe</Label>
              <Select
                value={selectedClasse ? String(selectedClasse) : ""}
                onValueChange={(v) => setSelectedClasse(v)}
                disabled={!selectedNiveau}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {selectedClasse > 0 && conseilLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {selectedClasse > 0 && !conseilLoading && conseil && propositions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
              Aucune note saisie pour cette classe — impossible de calculer les moyennes annuelles.
            </CardContent>
          </Card>
        )}

        {/* Conseil */}
        {selectedClasse > 0 && !conseilLoading && conseil && propositions.length > 0 && (
          <>
            {/* Context bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                {propositions.length} élève(s)
              </Badge>
              <Badge variant="outline">Année : {conseil.anneeScolaire ?? FALLBACK_ANNEE}</Badge>
              <Badge variant="outline">Seuil de passage : {conseil.seuilPassage}/20</Badge>
              <Badge variant="outline">
                {conseil.niveauNom}
                {conseil.niveauSuivant ? ` → ${conseil.niveauSuivant}` : " (niveau terminal)"}
              </Badge>
            </div>

            {/* Live summary */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(DECISION_LABELS) as DecisionType[]).map((d) => (
                <Card key={d}>
                  <CardContent className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-500">{DECISION_LABELS[d]}</span>
                    <span className="text-xl font-bold text-slate-800">{counts[d]}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {submitted && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Décisions enregistrées. Elles sont consultables dans la section Année scolaire.
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Propositions — {conseil.classeNom}
                </CardTitle>
                <div className="flex gap-1 print:hidden">
                  <Button variant="ghost" size="sm" onClick={() => window.print()}>
                    <Printer className="me-1.5 h-3.5 w-3.5" />
                    Imprimer le PV
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetEdits} disabled={submitted}>
                    <RotateCcw className="me-1.5 h-3.5 w-3.5" />
                    Réinitialiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rang</TableHead>
                        <TableHead>Élève</TableHead>
                        <TableHead className="text-center">T1</TableHead>
                        <TableHead className="text-center">T2</TableHead>
                        <TableHead className="text-center">T3</TableHead>
                        <TableHead className="text-center">Moy. annuelle</TableHead>
                        <TableHead>Proposée</TableHead>
                        <TableHead className="w-44">Décision</TableHead>
                        <TableHead>Motif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {propositions.map((p) => {
                        const edit = edits[p.studentId] ?? {
                          decision: p.decisionProposee,
                          motif: "",
                        };
                        const overridden = edit.decision !== p.decisionProposee;
                        const annuelleOk =
                          p.moyenneAnnuelle != null &&
                          p.moyenneAnnuelle >= conseil.seuilPassage;
                        return (
                          <TableRow key={p.studentId}>
                            <TableCell className="text-slate-400">
                              {p.rang ?? "—"}
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">
                              {p.studentName}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">
                              {fmt(p.moyenneT1)}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">
                              {fmt(p.moyenneT2)}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">
                              {fmt(p.moyenneT3)}
                            </TableCell>
                            <TableCell
                              className={`text-center font-semibold ${
                                p.moyenneAnnuelle == null
                                  ? "text-slate-400"
                                  : annuelleOk
                                    ? "text-emerald-600"
                                    : "text-red-600"
                              }`}
                            >
                              {fmt(p.moyenneAnnuelle)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={DECISION_STYLES[p.decisionProposee]}
                              >
                                {DECISION_LABELS[p.decisionProposee]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={edit.decision}
                                onValueChange={(v) =>
                                  setDecision(p.studentId, v as DecisionType)
                                }
                                disabled={submitted}
                              >
                                <SelectTrigger
                                  className={overridden ? "border-purple-400" : ""}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DECISIONS.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {DECISION_LABELS[d]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={edit.motif}
                                onChange={(e) => setMotif(p.studentId, e.target.value)}
                                placeholder="Optionnel"
                                disabled={submitted}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={bulkCreate.isPending || submitted}
                  >
                    {bulkCreate.isPending ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="me-2 h-4 w-4" />
                    )}
                    Valider et enregistrer les passages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </div>
  );
}
