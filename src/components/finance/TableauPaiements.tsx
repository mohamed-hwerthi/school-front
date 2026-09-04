import { useMemo, useState } from "react";
import {
  Search,
  FileDown,
  Wallet,
  TrendingDown,
  UserCheck,
  Receipt,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
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
import { useCreatePaiement } from "@/hooks/useFinance";
import { useNiveaux } from "@/hooks/useNiveaux";
import {
  MOIS_SCOLAIRES,
  MOIS_LABELS,
  MODES_PAIEMENT,
} from "@/types/finance";
import type { Paiement, TypeFrais, ModePaiement } from "@/types/finance";
import type { Student } from "@/types/student";
import { CURRENCY } from "@/config/currency";
import { generateRecuPDF, type RecuData } from "@/lib/generateRecuPDF";
import { generateFacturePDF } from "@/lib/generateFacturePDF";
import { useSchool } from "@/hooks/useSchool";

interface Props {
  students: Student[];
  typesFrais: TypeFrais[];
  paiements: Paiement[];
  anneeScolaire: string;
}

/** Nombre d'échéances attendues sur l'année, selon la fréquence du frais. */
function echeances(t: TypeFrais): number {
  switch (t.frequence) {
    case "MENSUEL":
      return MOIS_SCOLAIRES.length;
    case "TRIMESTRIEL":
      return 3;
    default:
      return 1;
  }
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

type CellState = "paye" | "partiel" | "vide" | "hors";

interface Cell {
  attendu: number;
  paye: number;
  etat: CellState;
  /** Échéances soldées, pour les frais à plusieurs versements. */
  reglees: number;
  total: number;
  paiements: Paiement[];
}

/** Pastille d'état — jamais la couleur seule : symbole + texte. */
function EtatBadge({ etat, label }: { etat: CellState; label: string }) {
  const style =
    etat === "paye"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20"
      : etat === "partiel"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20"
        : "bg-muted text-muted-foreground ring-border";
  const symbole = etat === "paye" ? "●" : etat === "partiel" ? "◑" : etat === "hors" ? "—" : "○";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      <span aria-hidden>{symbole}</span>
      {label}
    </span>
  );
}

export function TableauPaiements({ students, typesFrais, paiements, anneeScolaire }: Props) {
  const { school } = useSchool();
  const { niveaux = [] } = useNiveaux();
  const createPaiement = useCreatePaiement();

  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("all");
  const [filtreClasse, setFiltreClasse] = useState("all");
  const [filtreEtat, setFiltreEtat] = useState("all");
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(25);
  const [selection, setSelection] = useState<{ student: Student; type: TypeFrais } | null>(null);
  const [eleveOuvert, setEleveOuvert] = useState<Student | null>(null);

  const typesActifs = useMemo(() => typesFrais.filter((t) => t.actif), [typesFrais]);

  /**
   * students.niveau est un libellé ("1ère année"), pas une clé étrangère :
   * on traduit les identifiants du type de frais en noms pour comparer.
   */
  const nomsParType = useMemo(() => {
    const parId = new Map(niveaux.map((n) => [n.id, n.nom]));
    const map = new Map<string, Set<string>>();
    for (const t of typesFrais) {
      const noms = (t.niveauIds ?? [])
        .map((id) => parId.get(id))
        .filter((x): x is string => Boolean(x));
      map.set(t.id, new Set(noms));
    }
    return map;
  }, [typesFrais, niveaux]);

  const niveauxEleves = useMemo(
    () => Array.from(new Set(students.map((s) => s.niveau).filter(Boolean))).sort(),
    [students]
  );

  // Les classes proposées suivent le niveau choisi : sinon on offre des
  // combinaisons qui ne renvoient aucune ligne.
  const classes = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((s) => (filtreNiveau === "all" ? true : s.niveau === filtreNiveau))
            .map((s) => s.classe)
            .filter(Boolean)
        )
      ).sort(),
    [students, filtreNiveau]
  );

  /** Index paiements par élève + type de frais, pour éviter un balayage par cellule. */
  const parEleveEtType = useMemo(() => {
    const map = new Map<string, Paiement[]>();
    for (const p of paiements) {
      const k = `${p.eleveId}|${p.typeFraisId}`;
      const arr = map.get(k);
      if (arr) arr.push(p);
      else map.set(k, [p]);
    }
    return map;
  }, [paiements]);

  const cellule = useMemo(() => {
    return (student: Student, type: TypeFrais): Cell => {
      const liste = parEleveEtType.get(`${student.id}|${type.id}`) ?? [];
      // Un frais sans niveau déclaré concerne tout le monde.
      const noms = nomsParType.get(type.id);
      const concerne = !noms || noms.size === 0 || noms.has(student.niveau);
      if (!concerne) {
        // Frais réservé à d'autres niveaux : il ne doit rien peser dans les totaux.
        return { attendu: 0, paye: 0, etat: "hors", reglees: 0, total: 0, paiements: [] };
      }
      const total = echeances(type);
      const attendu = type.montantMensuel * total;
      const paye = liste.reduce((s, p) => s + p.montantPaye, 0);
      const reglees = liste.filter((p) => p.montantPaye >= p.montantDu && p.montantDu > 0).length;
      const etat: CellState = attendu > 0 && paye >= attendu ? "paye" : paye > 0 ? "partiel" : "vide";
      return { attendu, paye, etat, reglees, total, paiements: liste };
    };
  }, [parEleveEtType, nomsParType]);

  const lignes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => s.statut === "Actif")
      .filter((s) => (filtreNiveau === "all" ? true : s.niveau === filtreNiveau))
      .filter((s) => (filtreClasse === "all" ? true : s.classe === filtreClasse))
      .filter((s) => (q ? `${s.prenom} ${s.nom}`.toLowerCase().includes(q) : true))
      .map((s) => {
        const cells = typesActifs.map((t) => cellule(s, t));
        const attendu = cells.reduce((a, c) => a + c.attendu, 0);
        const paye = cells.reduce((a, c) => a + c.paye, 0);
        return { student: s, cells, attendu, paye, reste: Math.max(0, attendu - paye) };
      })
      .filter((l) => {
        if (filtreEtat === "ajour") return l.attendu > 0 && l.paye >= l.attendu;
        if (filtreEtat === "retard") return l.reste > 0 && l.paye > 0;
        if (filtreEtat === "rien") return l.paye === 0;
        return true;
      })
      .sort((a, b) => b.reste - a.reste); // le plus gros reste dû en premier
  }, [students, typesActifs, cellule, search, filtreNiveau, filtreClasse, filtreEtat]);

  const nbPages = Math.max(1, Math.ceil(lignes.length / taillePage));
  const pageCourante = Math.min(page, nbPages);
  const lignesPage = useMemo(
    () => lignes.slice((pageCourante - 1) * taillePage, pageCourante * taillePage),
    [lignes, pageCourante, taillePage]
  );

  /** Tout changement de filtre ramène à la première page. */
  const majFiltre = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  // La synthèse porte sur TOUTES les lignes filtrées, pas sur la page affichée :
  // un total qui changerait en tournant les pages n'aurait aucun sens.
  const synthese = useMemo(() => {
    const attendu = lignes.reduce((a, l) => a + l.attendu, 0);
    const paye = lignes.reduce((a, l) => a + l.paye, 0);
    const aJour = lignes.filter((l) => l.attendu > 0 && l.paye >= l.attendu).length;
    return { attendu, paye, reste: Math.max(0, attendu - paye), aJour, total: lignes.length };
  }, [lignes]);

  const exporter = () => {
    const entetes = ["Élève", "Classe", ...typesActifs.map((t) => t.nom), "Attendu", "Payé", "Reste"];
    const corps = lignes.map((l) => [
      `${l.student.prenom} ${l.student.nom}`,
      l.student.classe,
      ...l.cells.map((c) => `${c.paye}/${c.attendu}`),
      String(l.attendu),
      String(l.paye),
      String(l.reste),
    ]);
    const csv = [entetes, ...corps]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements_${anneeScolaire}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Synthèse ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Attendu", value: `${fmt(synthese.attendu)} ${CURRENCY}`, icon: Wallet },
          { label: "Encaissé", value: `${fmt(synthese.paye)} ${CURRENCY}`, icon: Receipt },
          { label: "Reste à percevoir", value: `${fmt(synthese.reste)} ${CURRENCY}`, icon: TrendingDown },
          { label: "Élèves à jour", value: `${synthese.aJour} / ${synthese.total}`, icon: UserCheck },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5">
                <s.icon className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un élève…"
            className="ps-9"
          />
        </div>
        <Select
          value={filtreNiveau}
          onValueChange={majFiltre((v) => {
            setFiltreNiveau(v);
            setFiltreClasse("all"); // la classe retenue peut ne plus exister
          })}
        >
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {niveauxEleves.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreClasse} onValueChange={majFiltre(setFiltreClasse)}>
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreEtat} onValueChange={majFiltre(setFiltreEtat)}>
          <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            <SelectItem value="ajour">À jour</SelectItem>
            <SelectItem value="retard">Paiement partiel</SelectItem>
            <SelectItem value="rien">Rien payé</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={exporter}>
          <FileDown className="h-4 w-4" /> Exporter
        </Button>
      </div>

      {typesActifs.length === 0 ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Aucun type de frais actif</p>
          <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
            Configurez vos frais dans Finance → Types de frais pour alimenter ce tableau.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {/* Colonne élève figée : sans elle, on perd le nom en défilant. */}
                  <th className="sticky start-0 z-10 bg-muted/40 py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[190px]">
                    Élève
                  </th>
                  {typesActifs.map((t) => (
                    <th
                      key={t.id}
                      className="py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[150px]"
                    >
                      {t.nom}
                    </th>
                  ))}
                  <th className="py-3.5 px-5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[150px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lignesPage.length === 0 ? (
                  <tr>
                    <td colSpan={typesActifs.length + 2} className="py-14 text-center text-muted-foreground">
                      Aucun élève ne correspond aux filtres
                    </td>
                  </tr>
                ) : (
                  lignesPage.map((l) => {
                    const pct = l.attendu > 0 ? Math.round((l.paye / l.attendu) * 100) : 0;
                    return (
                      <tr key={l.student.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="sticky start-0 z-10 bg-card py-3 px-5">
                          <button
                            type="button"
                            onClick={() => setEleveOuvert(l.student)}
                            className="text-start rounded-lg px-1 py-0.5 -mx-1 hover:bg-muted/60 transition-colors w-full"
                            aria-label={`Détail des paiements de ${l.student.prenom} ${l.student.nom}`}
                          >
                            <p className="font-medium text-foreground truncate">
                              {l.student.prenom} {l.student.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {l.student.classe} · {l.student.niveau}
                            </p>
                          </button>
                        </td>

                        {l.cells.map((c, i) => {
                          const t = typesActifs[i];
                          const label =
                            c.etat === "hors"
                              ? "Non concerné"
                              : c.total > 1
                              ? `${c.reglees}/${c.total}`
                              : c.etat === "paye"
                                ? "Payé"
                                : c.etat === "partiel"
                                  ? "Partiel"
                                  : "Non payé";
                          return (
                            <td key={t.id} className="py-3 px-5">
                              <button
                                type="button"
                                disabled={c.etat === "hors"}
                                onClick={() => setSelection({ student: l.student, type: t })}
                                className="text-start rounded-lg px-1 py-0.5 -mx-1 enabled:hover:bg-muted/60 transition-colors disabled:cursor-default"
                                aria-label={`${t.nom} — ${l.student.prenom} ${l.student.nom}`}
                              >
                                <EtatBadge etat={c.etat} label={label} />
                                {c.etat !== "hors" && (
                                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                                    {c.paye > 0 ? `${fmt(c.paye)} / ${fmt(c.attendu)}` : `— / ${fmt(c.attendu)}`}
                                  </p>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-3 px-5 text-end">
                          <p className="font-semibold tabular-nums">
                            {fmt(l.paye)} / {fmt(l.attendu)}
                          </p>
                          <div className="mt-1 h-1.5 w-28 ms-auto rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-transparent"}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{pct} %</p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {lignes.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/60 px-5 py-3">
              <p className="text-xs text-muted-foreground tabular-nums">
                {(pageCourante - 1) * taillePage + 1}–
                {Math.min(pageCourante * taillePage, lignes.length)} sur {lignes.length} élève
                {lignes.length > 1 ? "s" : ""}
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Par page</span>
                  <Select
                    value={String(taillePage)}
                    onValueChange={(v) => {
                      setTaillePage(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[74px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pageCourante <= 1}
                    onClick={() => setPage(pageCourante - 1)}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums px-1">
                    {pageCourante} / {nbPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pageCourante >= nbPages}
                    onClick={() => setPage(pageCourante + 1)}
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {eleveOuvert && (
        <EleveModal
          student={eleveOuvert}
          types={typesActifs}
          cellule={cellule}
          anneeScolaire={anneeScolaire}
          school={school}
          onClose={() => setEleveOuvert(null)}
          onEncaisser={(type) => {
            setEleveOuvert(null);
            setSelection({ student: eleveOuvert, type });
          }}
        />
      )}

      {selection && (
        <CelluleModal
          student={selection.student}
          type={selection.type}
          cell={cellule(selection.student, selection.type)}
          anneeScolaire={anneeScolaire}
          onClose={() => setSelection(null)}
          onSubmit={(data, cb) =>
            createPaiement.mutate(data, {
              onSuccess: () => {
                notify.success("Paiement enregistré");
                cb();
              },
              onError: (e: Error) => notify.error(e.message),
            })
          }
          saving={createPaiement.isPending}
          school={school}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal d'un élève : tous ses frais, tous ses paiements, actions
// ─────────────────────────────────────────────────────────────

interface EleveModalProps {
  student: Student;
  types: TypeFrais[];
  cellule: (s: Student, t: TypeFrais) => Cell;
  anneeScolaire: string;
  school: ReturnType<typeof useSchool>["school"];
  onClose: () => void;
  onEncaisser: (type: TypeFrais) => void;
}

function EleveModal({
  student,
  types,
  cellule,
  anneeScolaire,
  school,
  onClose,
  onEncaisser,
}: EleveModalProps) {
  const lignes = types.map((t) => ({ type: t, cell: cellule(student, t) }));
  const attendu = lignes.reduce((a, l) => a + l.cell.attendu, 0);
  const paye = lignes.reduce((a, l) => a + l.cell.paye, 0);
  const reste = Math.max(0, attendu - paye);
  const pct = attendu > 0 ? Math.round((paye / attendu) * 100) : 0;

  // Tous les paiements de l'élève, du plus récent au plus ancien.
  const tousPaiements = lignes
    .flatMap((l) => l.cell.paiements.map((p) => ({ p, type: l.type })))
    .sort((a, b) => (b.p.datePaiement ?? "").localeCompare(a.p.datePaiement ?? ""));

  const imprimerRecu = (p: Paiement, type: TypeFrais) => {
    const recu: RecuData = {
      reference: p.reference || `PAY-${p.id}`,
      studentName: `${student.prenom} ${student.nom}`,
      classe: student.classe,
      parentName: `${student.prenomParent ?? ""} ${student.nomParent ?? ""}`.trim(),
      parentTelephone: student.telephoneParent ?? "",
      typeFrais: type.nom,
      mois: p.mois,
      anneeScolaire,
      montantDu: p.montantDu,
      montantPaye: p.montantPaye,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
      statut: p.statut,
    };
    generateRecuPDF(recu, school);
  };

  const imprimerFacture = () => {
    const noms: Record<number, string> = {};
    types.forEach((t, i) => {
      noms[i] = t.nom;
    });
    generateFacturePDF(
      {
        nom: student.nom,
        prenom: student.prenom,
        classe: student.classe,
        parentName: `${student.prenomParent ?? ""} ${student.nomParent ?? ""}`.trim(),
        parentTelephone: student.telephoneParent ?? "",
      },
      tousPaiements.map((x) => x.p),
      noms,
      anneeScolaire,
      school
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-muted-foreground shrink-0" />
            {student.prenom} {student.nom}
          </DialogTitle>
          <DialogDescription>
            {student.classe} · {student.niveau} · {anneeScolaire}
            {student.nomParent ? ` · Parent : ${student.prenomParent ?? ""} ${student.nomParent}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* ── Synthèse de l'élève ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Attendu", v: `${fmt(attendu)} ${CURRENCY}` },
            { l: "Payé", v: `${fmt(paye)} ${CURRENCY}` },
            { l: "Reste", v: `${fmt(reste)} ${CURRENCY}` },
            { l: "Avancement", v: `${pct} %` },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{x.l}</p>
              <p className="text-base font-bold tabular-nums">{x.v}</p>
            </div>
          ))}
        </div>

        {/* ── Détail par type de frais ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Frais
          </p>
          <div className="rounded-xl border border-border/60 divide-y divide-border/50">
            {lignes.map(({ type, cell }) => {
              const label =
                cell.etat === "hors"
                  ? "Non concerné"
                  : cell.total > 1
                    ? `${cell.reglees}/${cell.total}`
                    : cell.etat === "paye"
                      ? "Payé"
                      : cell.etat === "partiel"
                        ? "Partiel"
                        : "Non payé";
              return (
                <div key={type.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{type.nom}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {cell.etat === "hors"
                        ? "Ne concerne pas ce niveau"
                        : `${fmt(cell.paye)} / ${fmt(cell.attendu)} ${CURRENCY}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <EtatBadge etat={cell.etat} label={label} />
                    {cell.etat !== "hors" && (
                      <Button variant="outline" size="sm" onClick={() => onEncaisser(type)}>
                        Encaisser
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Historique des paiements ── */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paiements enregistrés
            </p>
            {tousPaiements.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={imprimerFacture}>
                <FileText className="h-3.5 w-3.5" /> Facture complète
              </Button>
            )}
          </div>
          {tousPaiements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun paiement enregistré pour cet élève cette année.
            </p>
          ) : (
            <div className="rounded-xl border border-border/60 divide-y divide-border/50">
              {tousPaiements.map(({ p, type }) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {type.nom}
                      {p.mois ? ` · ${MOIS_LABELS[p.mois] ?? p.mois}` : ""} ·{" "}
                      {fmt(p.montantPaye)} / {fmt(p.montantDu)} {CURRENCY}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.reference} · {p.datePaiement ?? "sans date"} · {p.modePaiement ?? "—"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => imprimerRecu(p, type)}
                  >
                    <Receipt className="h-3.5 w-3.5" /> Reçu
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal d'une cellule : détail, saisie, reçu
// ─────────────────────────────────────────────────────────────

interface ModalProps {
  student: Student;
  type: TypeFrais;
  cell: Cell;
  anneeScolaire: string;
  onClose: () => void;
  onSubmit: (
    data: {
      eleveId: string;
      typeFraisId: string;
      mois: string;
      montantDu: number;
      montantPaye: number;
      datePaiement: string;
      modePaiement: string;
      anneeScolaire: string;
    },
    onDone: () => void
  ) => void;
  saving: boolean;
  school: ReturnType<typeof useSchool>["school"];
}

function CelluleModal({
  student,
  type,
  cell,
  anneeScolaire,
  onClose,
  onSubmit,
  saving,
  school,
}: ModalProps) {
  const mensuel = type.frequence === "MENSUEL";
  const reste = Math.max(0, cell.attendu - cell.paye);

  const [mois, setMois] = useState<string>(() => {
    if (!mensuel) return "";
    // Premier mois non soldé : c'est celui qu'on veut encaisser.
    const regles = new Set(
      cell.paiements.filter((p) => p.montantPaye >= p.montantDu).map((p) => p.mois)
    );
    return MOIS_SCOLAIRES.find((m) => !regles.has(m)) ?? MOIS_SCOLAIRES[0];
  });
  const [montant, setMontant] = useState<string>(
    String(mensuel ? type.montantMensuel : Math.max(reste, 0))
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<ModePaiement>("Espèces");
  const [erreur, setErreur] = useState("");

  const imprimer = (p: Paiement) => {
    const recu: RecuData = {
      reference: p.reference || `PAY-${p.id}`,
      studentName: `${student.prenom} ${student.nom}`,
      classe: student.classe,
      parentName: `${student.prenomParent ?? ""} ${student.nomParent ?? ""}`.trim(),
      parentTelephone: student.telephoneParent ?? "",
      typeFrais: type.nom,
      mois: p.mois,
      anneeScolaire,
      montantDu: p.montantDu,
      montantPaye: p.montantPaye,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
      statut: p.statut,
    };
    generateRecuPDF(recu, school);
  };

  const enregistrer = () => {
    const m = Number(montant);
    if (Number.isNaN(m) || m <= 0) {
      setErreur("Le montant doit être supérieur à 0.");
      return;
    }
    if (mensuel && !mois) {
      setErreur("Choisissez le mois réglé.");
      return;
    }
    setErreur("");
    onSubmit(
      {
        eleveId: student.id,
        typeFraisId: type.id,
        mois: mensuel ? mois : "",
        montantDu: mensuel ? type.montantMensuel : cell.attendu,
        montantPaye: m,
        datePaiement: date,
        modePaiement: mode,
        anneeScolaire,
      },
      onClose
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student.prenom} {student.nom} — {type.nom}
          </DialogTitle>
          <DialogDescription>
            {student.classe} · {anneeScolaire} · attendu {fmt(cell.attendu)} {CURRENCY}, payé{" "}
            {fmt(cell.paye)} {CURRENCY}, reste{" "}
            <strong className="text-foreground">{fmt(reste)} {CURRENCY}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* ── Échéances mensuelles ── */}
        {mensuel && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Mois de l'année scolaire
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MOIS_SCOLAIRES.map((m) => {
                const p = cell.paiements.find((x) => x.mois === m);
                const solde = p && p.montantPaye >= p.montantDu;
                const actif = mois === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMois(m)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                      solde
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20"
                        : p
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20"
                          : "bg-muted text-muted-foreground ring-border"
                    } ${actif ? "outline outline-2 outline-primary" : ""}`}
                  >
                    {MOIS_LABELS[m]?.slice(0, 4)}
                    {solde ? " ●" : p ? " ◑" : " ○"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Saisie ── */}
        <div className="rounded-xl border border-border/60 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Enregistrer un paiement
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="montant">Montant ({CURRENCY})</Label>
              <Input
                id="montant"
                type="number"
                min="0"
                step="0.01"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as ModePaiement)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button onClick={enregistrer} disabled={saving} className="bg-gradient-primary shadow-btn">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>

        {/* ── Paiements déjà enregistrés ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Paiements enregistrés
          </p>
          {cell.paiements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun paiement pour ce frais.</p>
          ) : (
            <div className="rounded-xl border border-border/60 divide-y divide-border/50">
              {cell.paiements.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.mois ? MOIS_LABELS[p.mois] ?? p.mois : "—"} · {fmt(p.montantPaye)} /{" "}
                      {fmt(p.montantDu)} {CURRENCY}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.reference} · {p.datePaiement ?? "sans date"} · {p.modePaiement ?? "—"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => imprimer(p)}>
                    <Receipt className="h-3.5 w-3.5" /> Reçu
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
