import { useMemo } from "react";
import { useTypesFrais, usePaiementsByStudent } from "@/hooks/useFinance";
import type { Student } from "@/types/student";
import { MOIS_SCOLAIRES, MOIS_LABELS } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Mail, FileDown } from "lucide-react";
import { CURRENCY } from "@/config/currency";
import { useSchool } from "@/hooks/useSchool";
import { generateFacturePDF } from "@/lib/generateFacturePDF";

interface SuiviEleveCardProps {
  student: Student;
  onAppel: () => void;
  onSMS: () => void;
  onEmail: () => void;
}

const statusColors: Record<string, string> = {
  "Payé": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Partiel": "bg-amber-100 text-amber-700 border-amber-200",
  "En retard": "bg-red-100 text-red-700 border-red-200",
  "En attente": "bg-gray-100 text-gray-500 border-gray-200",
};

export function SuiviEleveCard({ student, onAppel, onSMS, onEmail }: SuiviEleveCardProps) {
  const { data: typesFrais = [] } = useTypesFrais();
  const { data: paiements = [] } = usePaiementsByStudent(student.id);
  const { school } = useSchool();

  const handleDownloadFacture = () => {
    const tfMap: Record<number, string> = {};
    typesFrais.forEach((tf) => { tfMap[tf.id] = tf.nom; });
    generateFacturePDF(
      { nom: student.nom, prenom: student.prenom, classe: student.classe },
      paiements,
      tfMap,
      "2025-2026",
      school
    );
  };

  const grid = useMemo(() => {
    const rows: {
      typeFrais: { id: string; nom: string };
      cells: Record<string, { statut: string; montantPaye: number; montantDu: number }>;
    }[] = [];

    for (const tf of typesFrais) {
      const cells: Record<string, { statut: string; montantPaye: number; montantDu: number }> = {};
      for (const mois of MOIS_SCOLAIRES) {
        const p = paiements.find((p) => p.typeFraisId === tf.id && p.mois === mois);
        if (p) {
          cells[mois] = { statut: p.statut, montantPaye: p.montantPaye, montantDu: p.montantDu };
        } else {
          cells[mois] = { statut: "", montantPaye: 0, montantDu: 0 };
        }
      }
      // Only show rows that have at least one record
      const hasRecords = Object.values(cells).some((c) => c.statut !== "");
      if (hasRecords) {
        rows.push({ typeFrais: tf, cells });
      }
    }
    return rows;
  }, [typesFrais, paiements]);

  const totals = useMemo(() => {
    let totalDu = 0;
    let totalPaye = 0;
    for (const p of paiements) {
      totalDu += p.montantDu;
      totalPaye += p.montantPaye;
    }
    return { totalDu, totalPaye, solde: totalDu - totalPaye };
  }, [paiements]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-xs text-blue-600 font-medium">Total dû</p>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {totals.totalDu.toLocaleString()} {CURRENCY}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-xs text-emerald-600 font-medium">Total payé</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {totals.totalPaye.toLocaleString()} {CURRENCY}
          </p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${
          totals.solde > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
        }`}>
          <p className={`text-xs font-medium ${totals.solde > 0 ? "text-red-600" : "text-emerald-600"}`}>
            Solde restant
          </p>
          <p className={`text-xl font-bold mt-1 ${totals.solde > 0 ? "text-red-700" : "text-emerald-700"}`}>
            {totals.solde.toLocaleString()} {CURRENCY}
          </p>
        </div>
      </div>

      {/* Grid */}
      {grid.length > 0 ? (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2.5 px-3 text-start font-semibold text-muted-foreground sticky start-0 bg-muted/30 z-10 min-w-[120px]">
                    Type de frais
                  </th>
                  {MOIS_SCOLAIRES.map((m) => (
                    <th key={m} className="py-2.5 px-2 text-center font-semibold text-muted-foreground min-w-[70px]">
                      {MOIS_LABELS[m]?.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.typeFrais.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-3 font-medium text-foreground sticky start-0 bg-card z-10">
                      {row.typeFrais.nom}
                    </td>
                    {MOIS_SCOLAIRES.map((mois) => {
                      const cell = row.cells[mois];
                      if (!cell || !cell.statut) {
                        return <td key={mois} className="py-2 px-2 text-center">—</td>;
                      }
                      return (
                        <td key={mois} className="py-1.5 px-1 text-center">
                          <span
                            className={`inline-block rounded-md border px-2 py-1 text-[10px] font-medium ${
                              statusColors[cell.statut] ?? "bg-gray-100 text-gray-500"
                            }`}
                            title={`${cell.montantPaye}/${cell.montantDu} ${CURRENCY}`}
                          >
                            {cell.statut === "Payé" ? "✓" : cell.statut === "Partiel" ? "◐" : cell.statut === "En retard" ? "✗" : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">Aucun paiement enregistré pour cet élève</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground font-medium">Légende :</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border bg-emerald-100 border-emerald-200 text-center text-[10px] leading-4 text-emerald-700">✓</span>
          Payé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border bg-amber-100 border-amber-200 text-center text-[10px] leading-4 text-amber-700">◐</span>
          Partiel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border bg-red-100 border-red-200 text-center text-[10px] leading-4 text-red-700">✗</span>
          En retard
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border bg-gray-100 border-gray-200 text-center text-[10px] leading-4 text-gray-500">—</span>
          En attente
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onAppel}>
          <Phone className="h-3.5 w-3.5" />
          Appeler
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onSMS}>
          <MessageSquare className="h-3.5 w-3.5" />
          SMS
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEmail}>
          <Mail className="h-3.5 w-3.5" />
          Email
        </Button>
        {paiements.length > 0 && (
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn ms-auto" onClick={handleDownloadFacture}>
            <FileDown className="h-3.5 w-3.5" />
            Facture PDF
          </Button>
        )}
      </div>
    </div>
  );
}
