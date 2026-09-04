import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import { useFichesPaie } from "@/hooks/useRh";
import { useTeachers } from "@/hooks/useTeachers";
import { usePersonnelList } from "@/hooks/usePersonnel";
import { FinanceSkeleton } from "@/components/skeletons/FinanceSkeleton";
import { TableauSalaires, type Employe } from "@/components/finance/TableauSalaires";

export default function TableauSalairesPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const { data: fiches = [], isLoading: loadingFiches } = useFichesPaie();
  const { teachers, loading: loadingTeachers } = useTeachers();
  const { data: personnelList = [], isLoading: loadingPersonnel } = usePersonnelList();

  /** Enseignants et personnel sont deux sources distinctes, réunies ici. */
  const employes = useMemo<Employe[]>(
    () => [
      ...teachers.map((t) => ({
        id: t.id,
        nom: t.nom,
        prenom: t.prenom,
        type: "ENSEIGNANT" as const,
      })),
      ...personnelList.map((p) => ({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        type: "PERSONNEL" as const,
      })),
    ],
    [teachers, personnelList]
  );

  if (loadingFiches || loadingTeachers || loadingPersonnel) return <FinanceSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-btn">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tableau des salaires</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Qui a été payé, quel mois — {annee}. Cliquez sur un mois pour établir ou solder une fiche.
          </p>
        </div>
      </div>

      <TableauSalaires
        employes={employes}
        fiches={fiches}
        annee={annee}
        onChangeAnnee={setAnnee}
      />
    </div>
  );
}
