import { useState } from "react";
import { notify } from "@/lib/toast";
import { integrationsApi } from "@/api/integrations.api";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Send } from "lucide-react";
import { CURRENCY } from "@/config/currency";

interface CommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  type: "SMS" | "Email";
  solde: number;
}

const SMS_TEMPLATES = [
  {
    label: "Rappel de paiement",
    objet: "Rappel paiement",
    contenu: "Bonjour, nous vous rappelons que les frais scolaires de {prenom} {nom} sont en attente. Montant dû : {montant} {devise}. Merci de régulariser.",
  },
  {
    label: "Retard de paiement",
    objet: "Retard paiement",
    contenu: "Bonjour, les frais scolaires de {prenom} {nom} sont en retard. Solde restant : {montant} {devise}. Merci de procéder au paiement rapidement.",
  },
];

const EMAIL_TEMPLATES = [
  {
    label: "Rappel de paiement",
    objet: "Rappel de paiement - {prenom} {nom}",
    contenu: "Cher parent,\n\nNous vous rappelons que les frais scolaires de votre enfant {prenom} {nom} ({classe}) sont en attente de paiement.\n\nMontant dû : {montant} {devise}\n\nNous vous prions de bien vouloir régulariser votre situation dans les meilleurs délais.\n\nCordialement,\nL'administration scolaire",
  },
  {
    label: "Relance retard",
    objet: "Relance - Retard de paiement - {prenom} {nom}",
    contenu: "Cher parent,\n\nMalgré nos précédents rappels, les frais scolaires de {prenom} {nom} restent impayés.\n\nSolde restant : {montant} {devise}\n\nNous vous prions de bien vouloir régulariser votre situation sous 15 jours.\n\nCordialement,\nL'administration scolaire",
  },
];

export function CommunicationDialog({
  open,
  onOpenChange,
  student,
  type,
  solde,
}: CommunicationDialogProps) {
  const templates = type === "SMS" ? SMS_TEMPLATES : EMAIL_TEMPLATES;

  const [objet, setObjet] = useState("");
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);

  const applyTemplate = (templateIdx: string) => {
    const t = templates[Number(templateIdx)];
    if (!t || !student) return;
    const replacements: Record<string, string> = {
      "{prenom}": student.prenom,
      "{nom}": student.nom,
      "{montant}": String(solde),
      "{classe}": student.classe,
      "{devise}": CURRENCY,
    };
    let obj = t.objet;
    let cont = t.contenu;
    for (const [key, val] of Object.entries(replacements)) {
      obj = obj.replaceAll(key, val);
      cont = cont.replaceAll(key, val);
    }
    setObjet(obj);
    setContenu(cont);
  };

  const handleSend = async () => {
    if (!student || !objet.trim() || !contenu.trim()) return;

    // Validate destination is present (telephoneParent / emailParent)
    if (type === "SMS" && !student.telephoneParent?.trim()) {
      notify.error("Aucun numéro de téléphone parent renseigné");
      return;
    }
    if (type === "Email" && !student.emailParent?.trim()) {
      notify.error("Aucun email parent renseigné");
      return;
    }

    setSending(true);
    try {
      if (type === "SMS") {
        await integrationsApi.sendSms({
          phoneNumber: student.telephoneParent!.trim(),
          message: contenu,
        });
      } else {
        await integrationsApi.sendEmail({
          to: student.emailParent!.trim(),
          subject: objet,
          body: contenu,
        });
      }
      notify.success(
        `${type} envoyé`,
        `À ${student.prenomParent ?? ""} ${student.nomParent ?? student.nom}`.trim()
      );
      setObjet("");
      setContenu("");
      onOpenChange(false);
    } catch (e) {
      notify.error(
        e instanceof Error ? e.message : `Erreur lors de l'envoi du ${type}`
      );
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setObjet("");
      setContenu("");
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {type === "SMS" ? "Envoyer un SMS" : "Envoyer un Email"}
          </DialogTitle>
          <DialogDescription>
            {student
              ? `Destinataire : ${student.prenomParent ?? ""} ${student.nomParent ?? student.nom} ${
                  type === "SMS"
                    ? `(${student.telephoneParent})`
                    : `(${student.emailParent})`
                }`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="com-objet">Objet</Label>
            <Input
              id="com-objet"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Objet du message"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="com-contenu">Contenu</Label>
            <Textarea
              id="com-contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Contenu du message..."
              rows={type === "Email" ? 8 : 4}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button
            onClick={handleSend}
            disabled={!objet.trim() || !contenu.trim() || sending}
            className="gap-1.5 bg-gradient-primary shadow-btn"
          >
            <Send className="h-4 w-4" />
            {sending ? "Envoi…" : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
