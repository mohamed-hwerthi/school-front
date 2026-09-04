import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileDown,
  Loader2,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMouvementsFinanciers } from "@/hooks/useTresorerie";
import type { LigneMois, TresorerieDetailDTO } from "@/api/tresorerie.api";
import { CURRENCY } from "@/config/currency";

interface Props {
  data: TresorerieDetailDTO;
}

/** Montants toujours en clair : ce tableau sert a rapprocher des chiffres, pas a estimer. */
function fmt(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Zero grise pour que l'oeil accroche uniquement les cellules qui portent un montant. */
function Montant({ value, className = "" }: { value: number; className?: string }) {
  if (!value) return <span className="text-muted-foreground/40">—</span>;
  return <span className={className}>{fmt(value)}</span>;
}

const MOIS_FR: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril", 5: "Mai", 6: "Juin",
  7: "Juillet", 8: "Août", 9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

function libelleMois(l: LigneMois): string {
  if (l.moisNumero == null || l.annee == null) return l.libelle;
  return `${MOIS_FR[l.moisNumero]} ${l.annee}`;
}

const SOURCE_LABELS: Record<string, string> = {
  PAIEMENT: "Paiement élève",
  DEPENSE: "Dépense",
  SALAIRE: "Salaire",
  CAISSE: "Caisse",
};

export default function TableauFinancierMensuel({ data }: Props) {
  const [detaille, setDetaille] = useState(true);
  const [moisOuvert, setMoisOuvert] = useState<string | null>(null);

  const { colonnesEntrees, colonnesSorties, lignes, total } = data;

  // En mode resume on masque la ventilation et on ne garde que les totaux.
  const colsE = detaille ? colonnesEntrees : [];
  const colsS = detaille ? colonnesSorties : [];

  // Nombre de colonnes reel — sert au colSpan de la ligne de detail.
  const nbColonnes = 1 + colsE.length + 1 + colsS.length + 1 + 2 + 3;

  const aDesEngagements = useMemo(
    () => total.montantDu > 0 || total.impayesEleves > 0 || total.salairesAVerser > 0,
    [total]
  );

  const exporter = () => {
    const entetes = [
      "Mois",
      ...colonnesEntrees.map((c) => `Entrée · ${c}`),
      "Total entrées",
      ...colonnesSorties.map((c) => `Sortie · ${c}`),
      "Total sorties",
      "Différence",
      "Solde cumulé",
      "Montant dû",
      "Impayés élèves",
      "Salaires à verser",
    ];
    const ligneVersTableau = (l: LigneMois) => [
      libelleMois(l),
      ...colonnesEntrees.map((c) => l.entrees[c] ?? 0),
      l.totalEntrees,
      ...colonnesSorties.map((c) => l.sorties[c] ?? 0),
      l.totalSorties,
      l.solde,
      l.soldeCumule,
      l.montantDu,
      l.impayesEleves,
      l.salairesAVerser,
    ];
    const corps = [...lignes.map(ligneVersTableau), ligneVersTableau(total)];
    const csv = [entetes, ...corps]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances_${data.anneeScolaire}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thBase =
    "py-2.5 px-3 text-end text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap";
  const tdBase = "py-2.5 px-3 text-end tabular-nums whitespace-nowrap";

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Table2 className="h-4 w-4 text-primary" />
            Grand livre mensuel — {data.anneeScolaire}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toutes les entrées et toutes les sorties, mois par mois. Cliquez sur une
            ligne pour voir le détail des mouvements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDetaille((d) => !d)}>
            {detaille ? "Vue résumée" : "Vue détaillée"}
          </Button>
          <Button variant="outline" size="sm" onClick={exporter}>
            <FileDown className="h-4 w-4 me-1.5" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* ── Bandeau de groupes ── */}
          <thead>
            <tr className="text-[10px] uppercase tracking-wider">
              <th className="sticky start-0 z-20 bg-card py-2 px-4 text-start" />
              <th
                colSpan={colsE.length + 1}
                className="bg-emerald-50 py-2 px-3 text-center font-bold text-emerald-700 border-x border-border/40"
              >
                Entrées
              </th>
              <th
                colSpan={colsS.length + 1}
                className="bg-red-50 py-2 px-3 text-center font-bold text-red-700 border-e border-border/40"
              >
                Sorties
              </th>
              <th
                colSpan={2}
                className="bg-blue-50 py-2 px-3 text-center font-bold text-blue-700 border-e border-border/40"
              >
                Solde
              </th>
              <th
                colSpan={3}
                className="bg-amber-50 py-2 px-3 text-center font-bold text-amber-700"
              >
                Échéances &amp; impayés
              </th>
            </tr>
            <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
              <th className="sticky start-0 z-20 bg-muted/40 py-2.5 px-4 text-start text-[11px] font-semibold uppercase tracking-wide min-w-[150px]">
                Mois
              </th>
              {colsE.map((c) => (
                <th key={`e-${c}`} className={thBase}>
                  {c}
                </th>
              ))}
              <th className={`${thBase} bg-emerald-50/60 text-emerald-700`}>Total</th>
              {colsS.map((c) => (
                <th key={`s-${c}`} className={thBase}>
                  {c}
                </th>
              ))}
              <th className={`${thBase} bg-red-50/60 text-red-700`}>Total</th>
              <th className={`${thBase} bg-blue-50/60 text-blue-700`}>Différence</th>
              <th className={`${thBase} bg-blue-50/60 text-blue-700`}>Cumulé</th>
              <th className={thBase}>Échéances</th>
              <th className={thBase}>Impayés élèves</th>
              <th className={thBase}>Salaires à verser</th>
            </tr>
          </thead>

          <tbody>
            {lignes.map((l) => {
              const vide = l.nbMouvements === 0;
              const ouvert = moisOuvert === l.cle;
              return (
                <Fragment key={l.cle}>
                  <tr
                    onClick={() => !vide && setMoisOuvert(ouvert ? null : l.cle)}
                    className={`border-b border-border/40 transition-colors ${
                      vide
                        ? "text-muted-foreground/60"
                        : "cursor-pointer hover:bg-muted/40"
                    } ${ouvert ? "bg-muted/50" : ""}`}
                  >
                    <td className="sticky start-0 z-10 bg-card py-2.5 px-4 text-start font-medium">
                      <span className="flex items-center gap-1.5">
                        {vide ? (
                          <span className="w-4" />
                        ) : ouvert ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        {libelleMois(l)}
                      </span>
                    </td>

                    {colsE.map((c) => (
                      <td key={`e-${c}`} className={tdBase}>
                        <Montant value={l.entrees[c] ?? 0} />
                      </td>
                    ))}
                    <td className={`${tdBase} bg-emerald-50/40 font-semibold text-emerald-700`}>
                      <Montant value={l.totalEntrees} />
                    </td>

                    {colsS.map((c) => (
                      <td key={`s-${c}`} className={tdBase}>
                        <Montant value={l.sorties[c] ?? 0} />
                      </td>
                    ))}
                    <td className={`${tdBase} bg-red-50/40 font-semibold text-red-700`}>
                      <Montant value={l.totalSorties} />
                    </td>

                    <td
                      className={`${tdBase} bg-blue-50/40 font-bold ${
                        l.solde < 0 ? "text-red-600" : "text-emerald-700"
                      }`}
                    >
                      <Montant value={l.solde} />
                    </td>
                    <td
                      className={`${tdBase} bg-blue-50/40 font-medium ${
                        l.soldeCumule < 0 ? "text-red-600" : "text-foreground"
                      }`}
                    >
                      <Montant value={l.soldeCumule} />
                    </td>

                    <td className={tdBase}>
                      <Montant value={l.montantDu} />
                    </td>
                    <td className={`${tdBase} ${l.impayesEleves > 0 ? "text-amber-700 font-medium" : ""}`}>
                      <Montant value={l.impayesEleves} />
                    </td>
                    <td className={`${tdBase} ${l.salairesAVerser > 0 ? "text-amber-700 font-medium" : ""}`}>
                      <Montant value={l.salairesAVerser} />
                    </td>
                  </tr>

                  {ouvert && (
                    <tr className="bg-muted/20">
                      <td colSpan={nbColonnes} className="p-0">
                        <DetailMouvements moisCle={l.cle} libelle={libelleMois(l)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>

          {/* ── Total annuel ── */}
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/60 font-bold">
              <td className="sticky start-0 z-10 bg-muted/60 py-3 px-4 text-start">
                Total {data.anneeScolaire}
              </td>
              {colsE.map((c) => (
                <td key={`te-${c}`} className={tdBase}>
                  <Montant value={total.entrees[c] ?? 0} />
                </td>
              ))}
              <td className={`${tdBase} bg-emerald-100/60 text-emerald-800`}>
                <Montant value={total.totalEntrees} />
              </td>
              {colsS.map((c) => (
                <td key={`ts-${c}`} className={tdBase}>
                  <Montant value={total.sorties[c] ?? 0} />
                </td>
              ))}
              <td className={`${tdBase} bg-red-100/60 text-red-800`}>
                <Montant value={total.totalSorties} />
              </td>
              <td
                className={`${tdBase} bg-blue-100/60 ${
                  total.solde < 0 ? "text-red-700" : "text-emerald-800"
                }`}
              >
                <Montant value={total.solde} />
              </td>
              <td className={`${tdBase} bg-blue-100/60`}>
                <Montant value={total.soldeCumule} />
              </td>
              <td className={tdBase}>
                <Montant value={total.montantDu} />
              </td>
              <td className={`${tdBase} text-amber-800`}>
                <Montant value={total.impayesEleves} />
              </td>
              <td className={`${tdBase} text-amber-800`}>
                <Montant value={total.salairesAVerser} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Lecture du tableau ── */}
      <div className="border-t border-border/40 bg-muted/20 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Entrées et sorties</span> sont
          rattachées au mois où l'argent a réellement bougé (date d'encaissement,
          date de dépense, date de versement du salaire) — c'est ce qui fait la
          trésorerie. La <span className="font-medium text-foreground">différence</span>{" "}
          est le résultat du mois, le{" "}
          <span className="font-medium text-foreground">cumulé</span> le solde depuis
          septembre.
        </p>
        {aDesEngagements && (
          <p className="mt-1.5">
            <span className="font-medium text-foreground">Échéances &amp; impayés</span> est
            un tout autre plan : ce qui est attendu mais pas encore réglé, rattaché au mois de
            l'échéance. Ces colonnes n'entrent jamais dans le solde. Total non encaissé
            à ce jour : {fmt(total.impayesEleves)} {CURRENCY} côté élèves,{" "}
            {fmt(total.salairesAVerser)} {CURRENCY} côté salaires.
          </p>
        )}
      </div>
    </div>
  );
}

/** Detail ligne a ligne d'un mois, charge a l'ouverture. */
function DetailMouvements({ moisCle, libelle }: { moisCle: string; libelle: string }) {
  const { data: mouvements, isLoading } = useMouvementsFinanciers(moisCle);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Chargement des mouvements…
      </div>
    );
  }

  if (!mouvements?.length) {
    return (
      <div className="px-6 py-5 text-xs text-muted-foreground">
        Aucun mouvement sur {libelle}.
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {mouvements.length} mouvement{mouvements.length > 1 ? "s" : ""} — {libelle}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="py-2 px-3 text-start font-medium">Date</th>
              <th className="py-2 px-3 text-start font-medium">Type</th>
              <th className="py-2 px-3 text-start font-medium">Catégorie</th>
              <th className="py-2 px-3 text-start font-medium">Libellé</th>
              <th className="py-2 px-3 text-start font-medium">Tiers</th>
              <th className="py-2 px-3 text-start font-medium">Mode</th>
              <th className="py-2 px-3 text-start font-medium">Référence</th>
              <th className="py-2 px-3 text-end font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {mouvements.map((m) => (
              <tr key={`${m.source}-${m.id}`} className="border-t border-border/40">
                <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                  {new Date(m.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      m.sens === "ENTREE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {SOURCE_LABELS[m.source] ?? m.source}
                  </span>
                </td>
                <td className="py-2 px-3 whitespace-nowrap">{m.categorie}</td>
                <td className="py-2 px-3">{m.libelle}</td>
                <td className="py-2 px-3 whitespace-nowrap">{m.tiers ?? "—"}</td>
                <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                  {m.modePaiement ?? "—"}
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                  {m.reference ?? "—"}
                </td>
                <td
                  className={`py-2 px-3 text-end tabular-nums font-medium whitespace-nowrap ${
                    m.sens === "ENTREE" ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {m.sens === "ENTREE" ? "+" : "−"}
                  {fmt(m.montant)} {CURRENCY}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
