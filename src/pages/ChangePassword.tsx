import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Changement de mot de passe. Imposé à la première connexion des comptes créés
 * par l'établissement (user.mustChangePassword) : c'est ce passage qui rend le
 * mot de passe provisoire définitivement inconsultable côté administration.
 */
export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  /**
   * Compte dont le mot de passe a été fourni par l'établissement : on le
   * signale, sans bloquer l'accès au reste de l'application.
   */
  const provisional = !!user?.mustChangePassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      await refreshUser();
      toast.success("Mot de passe modifié");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <KeyRound className="h-5 w-5 text-violet-700" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">
              Changer de mot de passe
            </h1>
            {provisional && (
              <p className="text-xs text-amber-700">
                Vous utilisez le mot de passe remis par l'établissement.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field
            label={provisional ? "Mot de passe reçu" : "Mot de passe actuel"}
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <Field
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
          )}

          <Button type="submit" className="w-full gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {submitting ? "Enregistrement…" : "Valider"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Annuler
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground transition-all focus:border-primary focus:bg-card focus:outline-none"
      />
    </div>
  );
}
