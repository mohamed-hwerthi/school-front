import { ShieldAlert, Inbox } from "lucide-react";
import { useCurrentUser } from "@/hooks/useRbac";

interface ScopedEmptyStateProps {
  /** Message to show when the role has full visibility (default empty state). */
  emptyLabel?: string;
  /** Message to show when the role is naturally scoped (teacher/parent). */
  scopedLabel?: string;
  /** Optional icon override. */
  icon?: React.ElementType;
}

/**
 * Renders an empty-state block whose copy adapts to the current user's role:
 * - Staff (admin/director/comptable): "Aucune donnée"
 * - ENSEIGNANT: "Vous n'avez accès qu'à vos classes — aucune donnée à afficher."
 * - PARENT: "Vous n'avez accès qu'aux dossiers de vos enfants — aucune donnée à afficher."
 *
 * Use this in lists/tables that may legitimately come back empty for a non-staff
 * role due to row-level scoping (so the user understands WHY it's empty rather
 * than thinking the system is broken).
 */
export function ScopedEmptyState({
  emptyLabel = "Aucune donnée à afficher.",
  scopedLabel,
  icon: Icon,
}: ScopedEmptyStateProps) {
  const { role } = useCurrentUser();

  let message = emptyLabel;
  let UseIcon = Icon ?? Inbox;

  if (role === "ENSEIGNANT") {
    message = scopedLabel
      ?? "Vous n'avez accès qu'à vos classes — aucune donnée à afficher.";
    UseIcon = Icon ?? ShieldAlert;
  } else if (role === "PARENT") {
    message = scopedLabel
      ?? "Vous n'avez accès qu'aux dossiers de vos enfants — aucune donnée à afficher.";
    UseIcon = Icon ?? ShieldAlert;
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
      <UseIcon className="h-10 w-10 mb-3 opacity-40" />
      <p className="text-sm max-w-md">{message}</p>
    </div>
  );
}
