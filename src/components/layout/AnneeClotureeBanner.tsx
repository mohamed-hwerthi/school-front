import { Lock } from "lucide-react";
import { useAnneeContext } from "@/hooks/useAnneeContext";

/**
 * Une année clôturée est figée côté serveur : toute écriture est refusée (409).
 * Ce bandeau dit pourquoi, plutôt que de laisser l'utilisateur buter sur des
 * erreurs en cascade.
 */
export function AnneeClotureeBanner() {
  const { selectedAnnee } = useAnneeContext();
  if (!selectedAnnee?.cloturee) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Lock className="h-4 w-4 shrink-0" />
      <span>
        Année <strong>{selectedAnnee.label}</strong> clôturée — consultation uniquement. Ses
        données ne sont plus modifiables ; sélectionnez l'année en cours pour travailler.
      </span>
    </div>
  );
}
