import { useMemo, useState } from "react";
import {
  Search,
  FileDown,
  Wallet,
  TrendingDown,
  UserCheck,
  Receipt,
  Briefcase,
  FileText,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateFichePaie, useUpdateFichePaie } from "@/hooks/useRh";
import type { FichePaie } from "@/types/rh";
import { generateFichePaiePDF } from "@/lib/generateFichePaiePDF";
import { useSchool } from "@/hooks/useSchool";
import { CURRENCY } from "@/config/currency";

/** Un employé, quelle que soit son origine (enseignant ou personnel). */
export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  type: "ENSEIGNANT" | "PERSONNEL";
  fonction?: string;
  salaireBase?: number;
}

/**
 * La paie suit l'année civile : `FichePaie` stocke `mois` (1-12) et `annee`
 * en entiers, indépendamment de l'année scolaire.
 */
const MOIS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

/** Libellés complets, attendus par la fiche de paie imprimée. */
const MOIS_COMPLETS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

type EtatMois = "paye" | "etabli" | "vide";

interface CelluleMois {
  fiche?: FichePaie;
  etat: EtatMois;
}

/** Pastille d'état — symbole + texte, jamais la couleur seule. */
function EtatPastille({ etat, montant }: { etat: EtatMois; montant?: number }) {
  const style =
    etat === "paye"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20"
      : etat === "etabli"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20"
        : "bg-muted text-muted-foreground ring-border";
  const symbole = etat === "paye" ? "●" : etat === "etabli" ? "◑" : "○";
  return (
    <span
      className={`inline-flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${style}`}
      title={etat === "paye" ? "Payé" : etat === "etabli" ? "Fiche établie, non payée" : "Aucune fiche"}
    >
      <span aria-hidden>{symbole}</span>
      {montant != null && <span className="tabular-nums">{fmt(montant)}</span>}
    </span>
  );
}

interface Props {
  employes: Employe[];
  fiches: FichePaie[];
  annee: number;
  onChangeAnnee: (a: number) => void;
}

export function TableauSalaires({ employes, fiches, annee, onChangeAnnee }: Props) {
  const createFiche = useCreateFichePaie();
  const updateFiche = useUpdateFichePaie();

  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("all");
  const [selection, setSelection] = useState<{ employe: Employe; mois: number } | null>(null);

  /** Fiches indexées par employé + mois, pour éviter un balayage par cellule. */
  const index = useMemo(() => {
    const map = new Map<string, FichePaie>();
    for (const f of fiches) {
      if (f.annee !== annee) continue;
      map.set(`${f.employeId}|${f.mois}`, f);
    }
    return map;
  }, [fiches, annee]);

  const lignes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employes
      .filter((e) => (filtreType === "all" ? true : e.type === filtreType))
      .filter((e) => (q ? `${e.prenom} ${e.nom}`.toLowerCase().includes(q) : true))
      .map((e) => {
        const cells: CelluleMois[] = MOIS.map((_, i) => {
          const fiche = index.get(`${e.id}|${i + 1}`);
          const etat: EtatMois = !fiche ? "vide" : fiche.paye ? "paye" : "etabli";
          return { fiche, etat };
        });
        const verse = cells.reduce((a, c) => a + (c.etat === "paye" ? c.fiche!.salaireNet : 0), 0);
        const etabli = cells.reduce((a, c) => a + (c.fiche ? c.fiche.salaireNet : 0), 0);
        const moisPayes = cells.filter((c) => c.etat === "paye").length;
        return { employe: e, cells, verse, etabli, moisPayes };
      })
      .sort((a, b) => a.moisPayes - b.moisPayes); // les moins payés d'abord
  }, [employes, index, search, filtreType]);

  const synthese = useMemo(() => {
    const verse = lignes.reduce((a, l) => a + l.verse, 0);
    const etabli = lignes.reduce((a, l) => a + l.etabli, 0);
    const enAttente = Math.max(0, etabli - verse);
    const aJour = lignes.filter((l) => l.cells.every((c) => c.etat !== "etabli")).length;
    return { verse, etabli, enAttente, aJour, total: lignes.length };
  }, [lignes]);

  const annees = useMemo(() => {
    const now = new Date().getFullYear();
    return [now + 1, now, now - 1, now - 2];
  }, []);

  const exporter = () => {
    const entetes = ["Employé", "Type", ...MOIS, "Établi", "Versé"];
    const corps = lignes.map((l) => [
      `${l.employe.prenom} ${l.employe.nom}`,
      l.employe.type,
      ...l.cells.map((c) => (c.fiche ? `${c.fiche.salaireNet}${c.etat === "paye" ? "" : " (non payé)"}` : "")),
      String(l.etabli),
      String(l.verse),
    ]);
    const csv = [entetes, ...corps]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `salaires_${annee}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Synthèse ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Masse salariale établie", value: `${fmt(synthese.etabli)} ${CURRENCY}`, icon: Wallet },
          { label: "Versé", value: `${fmt(synthese.verse)} ${CURRENCY}`, icon: Receipt },
          { label: "En attente de versement", value: `${fmt(synthese.enAttente)} ${CURRENCY}`, icon: TrendingDown },
          { label: "Employés sans impayé", value: `${synthese.aJour} / ${synthese.total}`, icon: UserCheck },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5">
                <s.icon className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            className="ps-9"
          />
        </div>
        <Select value={String(annee)} onValueChange={(v) => onChangeAnnee(Number(v))}>
          <SelectTrigger className="lg:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {annees.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreType} onValueChange={setFiltreType}>
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les employés</SelectItem>
            <SelectItem value="ENSEIGNANT">Enseignants</SelectItem>
            <SelectItem value="PERSONNEL">Personnel</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={exporter}>
          <FileDown className="h-4 w-4" /> Exporter
        </Button>
      </div>

      {/* ── Tableau ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky start-0 z-10 bg-muted/40 py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[200px]">
                  Employé
                </th>
                {MOIS.map((m) => (
                  <th
                    key={m}
                    className="py-3.5 px-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[64px]"
                  >
                    {m}
                  </th>
                ))}
                <th className="py-3.5 px-5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[130px]">
                  Versé / Établi
                </th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={MOIS.length + 2} className="py-14 text-center text-muted-foreground">
                    Aucun employé ne correspond aux filtres
                  </td>
                </tr>
              ) : (
                lignes.map((l) => (
                  <tr
                    key={`${l.employe.type}-${l.employe.id}`}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="sticky start-0 z-10 bg-card py-3 px-5">
                      <p className="font-medium text-foreground truncate">
                        {l.employe.prenom} {l.employe.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.employe.type === "ENSEIGNANT" ? "Enseignant" : "Personnel"}
                        {l.employe.fonction ? ` · ${l.employe.fonction}` : ""}
                      </p>
                    </td>

                    {l.cells.map((c, i) => (
                      <td key={i} className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => setSelection({ employe: l.employe, mois: i + 1 })}
                          className="rounded-lg hover:bg-muted/60 transition-colors p-0.5"
                          aria-label={`${MOIS[i]} — ${l.employe.prenom} ${l.employe.nom}`}
                        >
                          <EtatPastille etat={c.etat} montant={c.fiche?.salaireNet} />
                        </button>
                      </td>
                    ))}

                    <td className="py-3 px-5 text-end">
                      <p className="font-semibold tabular-nums">
                        {fmt(l.verse)} / {fmt(l.etabli)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {l.moisPayes} mois payé{l.moisPayes > 1 ? "s" : ""}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selection && (
        <MoisModal
          employe={selection.employe}
          mois={selection.mois}
          annee={annee}
          fiche={index.get(`${selection.employe.id}|${selection.mois}`)}
          onClose={() => setSelection(null)}
          onCreate={(data) =>
            createFiche.mutate(data, {
              onSuccess: () => {
                notify.success("Fiche de paie enregistrée");
                setSelection(null);
              },
              onError: (e: Error) => notify.error(e.message),
            })
          }
          onUpdate={(id, data) =>
            updateFiche.mutate(
              { id, data },
              {
                onSuccess: () => {
                  notify.success("Fiche de paie mise à jour");
                  setSelection(null);
                },
                onError: (e: Error) => notify.error(e.message),
              }
            )
          }
          saving={createFiche.isPending || updateFiche.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal d'un mois : établir ou solder une fiche de paie
// ─────────────────────────────────────────────────────────────

interface MoisModalProps {
  employe: Employe;
  mois: number;
  annee: number;
  fiche?: FichePaie;
  onClose: () => void;
  onCreate: (data: {
    employeId: string;
    employeType: string;
    mois: number;
    annee: number;
    salaireBase: number;
    primes: number;
    retenues: number;
    salaireNet: number;
    datePaiement?: string;
    paye: boolean;
  }) => void;
  onUpdate: (id: string, data: Parameters<MoisModalProps["onCreate"]>[0]) => void;
  saving: boolean;
}

function MoisModal({ employe, mois, annee, fiche, onClose, onCreate, onUpdate, saving }: MoisModalProps) {
  const { school } = useSchool();
  const [base, setBase] = useState(String(fiche?.salaireBase ?? employe.salaireBase ?? ""));
  const [primes, setPrimes] = useState(String(fiche?.primes ?? 0));
  const [retenues, setRetenues] = useState(String(fiche?.retenues ?? 0));
  const [paye, setPaye] = useState(fiche?.paye ?? true);
  const [date, setDate] = useState(
    fiche?.datePaiement ?? new Date().toISOString().split("T")[0]
  );
  const [erreur, setErreur] = useState("");

  // Le net est déduit, jamais saisi : il doit toujours valoir base + primes − retenues.
  const net = Math.max(0, (Number(base) || 0) + (Number(primes) || 0) - (Number(retenues) || 0));

  const imprimer = () => {
    if (!fiche) return;
    generateFichePaiePDF(
      {
        reference: `FP-${fiche.annee}-${String(fiche.mois).padStart(2, "0")}-${String(fiche.id).slice(-3)}`,
        employeName: `${employe.prenom} ${employe.nom}`,
        employeType: fiche.employeType,
        moisLabel: MOIS_COMPLETS[fiche.mois - 1],
        annee: fiche.annee,
        salaireBase: fiche.salaireBase,
        primes: fiche.primes,
        retenues: fiche.retenues,
        salaireNet: fiche.salaireNet,
        datePaiement: fiche.datePaiement ?? null,
        paye: fiche.paye,
        commentaire: fiche.commentaire ?? null,
      },
      school
    );
  };

  const enregistrer = () => {
    if (!base.trim() || Number(base) <= 0) {
      setErreur("Le salaire de base doit être supérieur à 0.");
      return;
    }
    setErreur("");
    const data = {
      employeId: employe.id,
      employeType: employe.type,
      mois,
      annee,
      salaireBase: Number(base),
      primes: Number(primes) || 0,
      retenues: Number(retenues) || 0,
      salaireNet: net,
      datePaiement: paye ? date : undefined,
      paye,
    };
    if (fiche) onUpdate(fiche.id, data);
    else onCreate(data);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
            {employe.prenom} {employe.nom}
          </DialogTitle>
          <DialogDescription>
            {MOIS[mois - 1]} {annee} ·{" "}
            {employe.type === "ENSEIGNANT" ? "Enseignant" : "Personnel"}
            {fiche ? " · fiche existante" : " · aucune fiche pour ce mois"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="base">Salaire de base</Label>
            <Input id="base" type="number" min="0" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primes">Primes</Label>
            <Input id="primes" type="number" min="0" step="0.01" value={primes} onChange={(e) => setPrimes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="retenues">Retenues</Label>
            <Input id="retenues" type="number" min="0" step="0.01" value={retenues} onChange={(e) => setRetenues(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Salaire net</span>
          <span className="text-lg font-bold tabular-nums">{fmt(net)} {CURRENCY}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={paye ? "true" : "false"} onValueChange={(v) => setPaye(v === "true")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Payé</SelectItem>
                <SelectItem value="false">Établie, non payée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paye && (
            <div className="space-y-1.5">
              <Label htmlFor="datePaie">Date de versement</Label>
              <Input id="datePaie" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
        </div>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        <div className="flex justify-end gap-2">
          {fiche && (
            <Button variant="outline" className="gap-1.5 me-auto" onClick={imprimer}>
              <FileText className="h-4 w-4" /> Fiche de paie PDF
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={enregistrer} disabled={saving} className="bg-gradient-primary shadow-btn">
            {saving ? "Enregistrement…" : fiche ? "Mettre à jour" : "Créer la fiche"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
