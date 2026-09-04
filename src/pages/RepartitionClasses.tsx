import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Loader2,
  Save,
  Users,
  Wand2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
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
import { useRepartition, useSaveRepartition } from "@/hooks/useRepartition";
import { notify } from "@/lib/toast";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import type { RepartitionNiveau } from "@/types/repartition";

/** Libellé de l'année d'accueil : "2025-2026" → "2026-2027". */
function anneeSuivante(annee: string): string {
  const [debut, fin] = annee.split("-").map(Number);
  return Number.isNaN(debut) || Number.isNaN(fin) ? annee : `${debut + 1}-${fin + 1}`;
}

export default function RepartitionClasses() {
  const anneeScolaire = getSelectedAnneeScolaire();
  const { data, isLoading } = useRepartition(anneeScolaire);
  const save = useSaveRepartition();

  /** Classe d'accueil retenue par élève — amorcée sur l'affectation ou la proposition. */
  const [choix, setChoix] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    const seed: Record<string, string> = {};
    for (const niveau of data.niveaux) {
      for (const e of niveau.eleves) {
        const classe = e.classeAffectee ?? e.classeProposee;
        if (classe) seed[e.studentId] = classe;
      }
    }
    setChoix(seed);
  }, [data]);

  const niveaux = useMemo(() => data?.niveaux ?? [], [data]);
  const totalPromus = niveaux.reduce((n, niv) => n + niv.eleves.length, 0);
  const totalAffectes = niveaux.reduce(
    (n, niv) => n + niv.eleves.filter((e) => choix[e.studentId]).length,
    0,
  );

  /** Effectifs par classe, recalculés à chaque changement — l'équilibrage reste visible. */
  const effectifs = (niveau: RepartitionNiveau): Record<string, number> => {
    const counts: Record<string, number> = {};
    niveau.classes.forEach((c) => (counts[c.nom] = 0));
    for (const e of niveau.eleves) {
      const c = choix[e.studentId];
      if (c && c in counts) counts[c] += 1;
    }
    return counts;
  };

  const appliquerProposition = (niveau: RepartitionNiveau) => {
    setChoix((prev) => {
      const next = { ...prev };
      for (const e of niveau.eleves) {
        const classe = e.classeAffectee ?? e.classeProposee;
        if (classe) next[e.studentId] = classe;
      }
      return next;
    });
  };

  /** Classes dont l'effectif retenu dépasse la capacité configurée. */
  const depassements = useMemo(
    () =>
      niveaux.flatMap((niveau) => {
        const counts: Record<string, number> = {};
        niveau.classes.forEach((c) => (counts[c.nom] = 0));
        for (const e of niveau.eleves) {
          const c = choix[e.studentId];
          if (c && c in counts) counts[c] += 1;
        }
        return niveau.classes
          .filter((c) => c.capacite != null && counts[c.nom] > c.capacite)
          .map((c) => `${c.nom} (${counts[c.nom]}/${c.capacite})`);
      }),
    [niveaux, choix],
  );

  const enregistrer = () => {
    const affectations = Object.entries(choix).map(([studentId, classe]) => ({
      studentId,
      classe,
    }));
    if (affectations.length === 0) return;

    if (depassements.length > 0) {
      notify.warning(
        "Capacité dépassée",
        `${depassements.join(", ")} — la répartition est enregistrée quand même.`,
      );
    }

    save.mutate(
      { anneeScolaire, affectations },
      {
        onSuccess: (res) => notify.success("Répartition enregistrée", res.message),
        onError: (err: Error) => notify.error("Échec de l'enregistrement", err.message),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
            <LayoutGrid className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Répartition des classes</h1>
            <p className="text-sm text-slate-500">
              Élèves promus par le conseil de classe, à placer dans les classes de{" "}
              {anneeSuivante(anneeScolaire)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de la répartition…
            </CardContent>
          </Card>
        ) : totalPromus === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Aucun élève promu sur {anneeScolaire}. Validez d'abord les décisions dans
              « Conseil de classe ».
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {totalPromus} élève(s) promu(s)
              </Badge>
              <Badge
                variant="outline"
                className={
                  totalAffectes === totalPromus
                    ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "gap-1.5 border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {totalAffectes === totalPromus ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {totalAffectes} / {totalPromus} affecté(s)
              </Badge>
              {depassements.length > 0 && (
                <Badge variant="outline" className="gap-1.5 border-red-200 bg-red-50 text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Capacité dépassée : {depassements.join(", ")}
                </Badge>
              )}
              {data && data.nonRepartissables > 0 && (
                <Badge variant="outline" className="gap-1.5 border-red-200 bg-red-50 text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {data.nonRepartissables} sans classe configurée au niveau d'accueil
                </Badge>
              )}
              <Button
                className="ms-auto"
                onClick={enregistrer}
                disabled={save.isPending || totalAffectes === 0}
              >
                {save.isPending ? (
                  <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="me-1.5 h-4 w-4" />
                )}
                Enregistrer la répartition
              </Button>
            </div>

            <div className="space-y-6">
              {niveaux.map((niveau) => {
                const counts = effectifs(niveau);
                return (
                  <Card key={niveau.niveauNom}>
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                      <CardTitle className="text-base">
                        Vers {niveau.niveauNom}
                        <span className="ms-2 text-sm font-normal text-slate-500">
                          {niveau.eleves.length} élève(s)
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {niveau.classes.map((c) => {
                          const plein = c.capacite != null && counts[c.nom] > c.capacite;
                          return (
                            <Badge
                              key={c.nom}
                              variant="secondary"
                              className={`tabular-nums ${plein ? "border-red-200 bg-red-50 text-red-700" : ""}`}
                              title={
                                c.capacite == null
                                  ? "Capacité non plafonnée"
                                  : `Capacité : ${c.capacite} élèves`
                              }
                            >
                              {c.nom} : {counts[c.nom]}
                              {c.capacite != null && ` / ${c.capacite}`}
                            </Badge>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => appliquerProposition(niveau)}
                          disabled={niveau.classes.length === 0}
                        >
                          <Wand2 className="me-1.5 h-3.5 w-3.5" />
                          Section conservée
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {niveau.classes.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Aucune classe n'est configurée en {niveau.niveauNom} — créez-les dans
                          « Scolarité → Niveaux » avant de répartir ces élèves.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Élève</TableHead>
                                <TableHead className="w-20 text-center">Sexe</TableHead>
                                <TableHead className="w-32">Classe actuelle</TableHead>
                                <TableHead className="w-44">Classe d'accueil</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {niveau.eleves.map((e) => (
                                <TableRow key={e.studentId}>
                                  <TableCell className="font-medium">{e.studentName}</TableCell>
                                  <TableCell className="text-center text-slate-500">
                                    {e.sexe ?? "—"}
                                  </TableCell>
                                  <TableCell className="text-slate-500">
                                    {e.ancienneClasse ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={choix[e.studentId] ?? ""}
                                      onValueChange={(v) =>
                                        setChoix((prev) => ({ ...prev, [e.studentId]: v }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="À affecter" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {niveau.classes.map((c) => (
                                          <SelectItem key={c.nom} value={c.nom}>
                                            {c.nom}
                                            {c.capacite != null &&
                                              ` (${counts[c.nom]}/${c.capacite})`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
