import { LayoutGrid } from "lucide-react";
import { useTypesFrais, useAllPaiements } from "@/hooks/useFinance";
import { useAllStudents } from "@/hooks/useStudents";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import { FinanceSkeleton } from "@/components/skeletons/FinanceSkeleton";
import { TableauPaiements } from "@/components/finance/TableauPaiements";

export default function TableauPaiementsPage() {
  const anneeScolaire = getSelectedAnneeScolaire();
  const { data: typesFrais = [], isLoading: loadingTypes } = useTypesFrais();
  const { data: paiements = [], isLoading: loadingPaiements } = useAllPaiements(anneeScolaire);
  const { data: students = [], isLoading: loadingStudents } = useAllStudents();

  if (loadingTypes || loadingPaiements || loadingStudents) return <FinanceSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-btn">
          <LayoutGrid className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tableau des paiements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Qui a payé quoi — {anneeScolaire}. Cliquez sur une case pour encaisser ou imprimer un reçu.
          </p>
        </div>
      </div>

      <TableauPaiements
        students={students}
        typesFrais={typesFrais}
        paiements={paiements}
        anneeScolaire={anneeScolaire}
      />
    </div>
  );
}
