import { useState } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  UserPlus,
  ShieldOff,
  ShieldCheck,
  Printer,
  Mail,
  MailX,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useTeacherAccount,
  useCreateTeacherAccount,
  useResetTeacherPassword,
  useSendTeacherCredentials,
  useSetTeacherAccountActive,
} from "@/hooks/useTeacherAccount";
import type { TeacherCredentials } from "@/api/teacher-account.api";
import type { Teacher } from "@/types/teacher";

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : null;

/** Ouvre une fenêtre d'impression avec la fiche d'identifiants à remettre à l'enseignant. */
function printCredentials(creds: TeacherCredentials, schoolName?: string) {
  const win = window.open("", "_blank", "width=700,height=800");
  if (!win) {
    toast.error("Impression bloquée par le navigateur. Autorisez les fenêtres pop-up.");
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Identifiants - ${creds.teacherName}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #1e293b; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 13px; margin-bottom: 28px; }
  table { border-collapse: collapse; width: 100%; max-width: 460px; margin-bottom: 24px; }
  td { border: 1px solid #cbd5e1; padding: 12px 14px; font-size: 14px; }
  td.label { background: #f8fafc; font-weight: 600; width: 40%; }
  code { font-family: monospace; font-size: 17px; letter-spacing: 1px; }
  .note { font-size: 12px; color: #64748b; max-width: 460px; line-height: 1.6; }
  .cut { border-top: 1px dashed #94a3b8; margin: 32px 0 12px; }
</style></head><body>
  <h1>Accès à l'espace enseignant</h1>
  <div class="sub">${schoolName ?? "EcoleNet"} — enseignant : <strong>${creds.teacherName}</strong></div>
  <table>
    <tr><td class="label">Identifiant</td><td><code>${creds.username}</code></td></tr>
    <tr><td class="label">Mot de passe</td><td><code>${creds.password}</code></td></tr>
  </table>
  <p class="note">
    Conservez ce document. Un mot de passe personnel vous sera demandé à la première connexion.
  </p>
  <div class="cut"></div>
</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

interface Props {
  teacher: Teacher;
  schoolName?: string;
}

export function TeacherAccountCard({ teacher, schoolName }: Props) {
  const { data: account, isLoading } = useTeacherAccount(teacher.id);
  const createMutation = useCreateTeacherAccount(teacher.id);
  const resetMutation = useResetTeacherPassword(teacher.id);
  const sendMutation = useSendTeacherCredentials(teacher.id);
  const activeMutation = useSetTeacherAccountActive(teacher.id);

  const [credentials, setCredentials] = useState<TeacherCredentials | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  };

  const onCreate = () =>
    createMutation.mutate(undefined, {
      onSuccess: (creds) => {
        setCredentials(creds);
        toast.success("Compte créé");
      },
      onError: (e) => toast.error(e.message),
    });

  const onReset = () =>
    resetMutation.mutate(undefined, {
      onSuccess: (creds) => {
        setCredentials(creds);
        setConfirmReset(false);
        toast.success("Nouveau mot de passe généré");
      },
      onError: (e) => toast.error(e.message),
    });

  const onSendByEmail = () =>
    sendMutation.mutate(undefined, {
      onSuccess: (creds) =>
        creds.emailSent
          ? toast.success(`Identifiants envoyés à ${creds.email}`)
          : toast.warning(
              "L'envoi n'a pas abouti — vérifiez la configuration email (MAIL_ENABLED)."
            ),
      onError: (e) => toast.error(e.message),
    });

  const onToggleActive = () => {
    if (!account?.exists) return;
    activeMutation.mutate(!account.active, {
      onSuccess: (a) => toast.success(a.active ? "Compte réactivé" : "Compte désactivé"),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <KeyRound className="h-4 w-4 text-violet-600" />
          Gestion du compte
        </h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : account?.blockedReason === "NO_MATRICULE" ? (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Cet enseignant n'a pas de matricule : l'identifiant de connexion ne peut pas être
              généré.
            </span>
          </div>
        ) : !account?.exists ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucun compte pour cet enseignant. L'identifiant sera son matricule{" "}
              <span className="font-mono text-foreground">{account?.username}</span>.
            </p>
            <Button size="sm" className="gap-1.5" onClick={onCreate} disabled={createMutation.isPending}>
              <UserPlus className="h-4 w-4" />
              {createMutation.isPending ? "Création…" : "Créer le compte"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <Row label="Identifiant">
              <div className="flex items-center gap-2">
                <span className="font-mono text-foreground">{account.username}</span>
                <CopyButton
                  onClick={() => copy(account.username!, "username")}
                  copied={copied === "username"}
                />
              </div>
            </Row>

            <Row label="Mot de passe">
              {account.passwordVisible ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground tracking-wider">{account.password}</span>
                  <CopyButton
                    onClick={() => copy(account.password!, "password")}
                    copied={copied === "password"}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  Défini par l'enseignant — non consultable
                </span>
              )}
            </Row>

            <Row label="Statut">
              <div className="flex flex-wrap items-center gap-1.5">
                {account.active ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Actif</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Désactivé</Badge>
                )}
                {account.locked && (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1">
                    <Lock className="h-3 w-3" />
                    Verrouillé
                  </Badge>
                )}
                {account.mustChangePassword && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    Mot de passe à changer
                  </Badge>
                )}
              </div>
            </Row>

            <Row label="Dernier accès">
              <span className="text-muted-foreground">
                {formatDate(account.lastLoginAt) ?? "Jamais connecté"}
              </span>
            </Row>

            <Row label="Email">
              {account.email ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {account.email}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground italic">
                  <MailX className="h-3.5 w-3.5" />
                  Aucun — identifiants à remettre en main propre
                </span>
              )}
            </Row>

            <div className="flex flex-wrap gap-2 pt-2">
              {/* Renvoi possible uniquement tant que le mot de passe est lisible. */}
              {account.email && account.passwordVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onSendByEmail}
                  disabled={sendMutation.isPending}
                >
                  <Mail className="h-4 w-4" />
                  {sendMutation.isPending ? "Envoi…" : "Envoyer par email"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setConfirmReset(true)}
                disabled={resetMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Nouveau mot de passe
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 ${account.active ? "text-red-600 hover:text-red-600" : "text-emerald-700 hover:text-emerald-700"}`}
                onClick={onToggleActive}
                disabled={activeMutation.isPending}
              >
                {account.active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {account.active ? "Désactiver" : "Réactiver"}
              </Button>
              {account.passwordVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    printCredentials(
                      {
                        username: account.username!,
                        password: account.password!,
                        teacherName: `${teacher.prenom} ${teacher.nom}`,
                        email: account.email,
                        emailSent: false,
                      },
                      schoolName
                    )
                  }
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation de régénération */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Générer un nouveau mot de passe ?</DialogTitle>
            <DialogDescription>
              L'ancien mot de passe cessera immédiatement de fonctionner. L'enseignant devra
              utiliser le nouveau pour se connecter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={onReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Génération…" : "Générer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identifiants fraîchement générés */}
      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identifiants enseignant</DialogTitle>
            <DialogDescription>À remettre à {credentials?.teacherName}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <CredsRow
              label="Identifiant"
              value={credentials?.username ?? ""}
              onCopy={() => copy(credentials!.username, "m-username")}
              copied={copied === "m-username"}
            />
            <CredsRow
              label="Mot de passe"
              value={credentials?.password ?? ""}
              onCopy={() => copy(credentials!.password, "m-password")}
              copied={copied === "m-password"}
            />
          </div>

          {credentials?.emailSent ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Envoyés par email à {credentials.email}
            </p>
          ) : credentials?.email ? (
            <p className="text-xs text-amber-700 flex items-start gap-1.5">
              <MailX className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                L'envoi à {credentials.email} n'a pas abouti. Imprimez la fiche ou communiquez les
                identifiants directement.
              </span>
            </p>
          ) : (
            <p className="text-xs text-amber-700 flex items-start gap-1.5">
              <MailX className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Aucun email sur la fiche — remettez ces identifiants en main propre.
              </span>
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => credentials && printCredentials(credentials, schoolName)}
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <DialogClose asChild>
              <Button>Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="text-end">{children}</div>
    </div>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClick}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CredsRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-foreground tracking-wider">{value}</span>
        <CopyButton onClick={onCopy} copied={copied} />
      </div>
    </div>
  );
}
