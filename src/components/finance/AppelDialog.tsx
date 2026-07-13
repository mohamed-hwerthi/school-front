import { useEffect, useState } from "react";
import { notify } from "@/lib/toast";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone } from "lucide-react";
import { useCreateAppelParent } from "@/hooks/useAppelsParents";
import { useAuth } from "@/hooks/useAuth";

interface AppelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

const MOTIFS = [
  { value: "PAIEMENT", label: "Paiement / Finance" },
  { value: "ABSENCE", label: "Absence / Discipline" },
  { value: "PEDAGOGIE", label: "Pédagogie / Notes" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "AUTRE", label: "Autre" },
] as const;

export function AppelDialog({ open, onOpenChange, student }: AppelDialogProps) {
  const { user } = useAuth();
  const create = useCreateAppelParent();

  const [notes, setNotes] = useState("");
  const [motif, setMotif] = useState<string>("PAIEMENT");

  // Reset on open
  useEffect(() => {
    if (open) {
      setNotes("");
      setMotif("PAIEMENT");
    }
  }, [open]);

  const handleSave = async () => {
    if (!student || !notes.trim()) return;
    const appelePar = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || undefined
      : undefined;
    try {
      await create.mutateAsync({
        eleveId: student.id,
        appelePar,
        telephone: student.telephoneParent ?? undefined,
        motif,
        notes: notes.trim(),
      });
      notify.success(
        "Appel enregistré",
        `Appel à ${student.prenomParent ?? ""} ${student.nomParent ?? student.nom}`.trim()
      );
      onOpenChange(false);
    } catch (e) {
      notify.error(
        e instanceof Error ? e.message : "Erreur lors de l'enregistrement"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Enregistrer un appel
          </DialogTitle>
          <DialogDescription>
            {student
              ? `Appel à ${student.prenomParent ?? ""} ${student.nomParent ?? student.nom} — ${
                  student.telephoneParent ?? "(numéro non renseigné)"
                }`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Motif</Label>
            <Select value={motif} onValueChange={setMotif}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIFS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appel-notes">Notes de l'appel *</Label>
            <Textarea
              id="appel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Résumé de la conversation, décisions prises, prochaine action…"
              rows={5}
            />
          </div>

          {student && (
            <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              <p>
                Enregistré par :{" "}
                <strong className="text-foreground">
                  {user?.firstName} {user?.lastName}
                </strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!notes.trim() || create.isPending}
          >
            {create.isPending ? "Enregistrement…" : "Enregistrer l'appel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

