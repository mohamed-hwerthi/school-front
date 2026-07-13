import { ShieldX, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <ShieldX className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold text-foreground">403 - Accès refusé</h1>
      <p className="max-w-md text-muted-foreground">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </button>
    </div>
  );
}
