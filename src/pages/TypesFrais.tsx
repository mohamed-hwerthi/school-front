import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  AlertTriangle,
  Layers,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTypesFrais,
  useCreateTypeFrais,
  useUpdateTypeFrais,
  useDeleteTypeFrais,
} from "@/hooks/useFinance";
import { useNiveaux } from "@/hooks/useNiveaux";
import type { TypeFrais, FrequenceFrais } from "@/types/finance";
import type { TypeFraisRequest } from "@/api/finance.api";
import { CURRENCY } from "@/config/currency";

const FREQUENCES: { value: FrequenceFrais; label: string }[] = [
  { value: "MENSUEL", label: "Mensuel" },
  { value: "TRIMESTRIEL", label: "Trimestriel" },
  { value: "ANNUEL", label: "Annuel" },
  { value: "UNIQUE", label: "Paiement unique" },
];

const frequenceLabel = (f: FrequenceFrais) =>
  FREQUENCES.find((x) => x.value === f)?.label ?? f;

/** Chaque fréquence a sa teinte, pour repérer un type d'un coup d'œil. */
const FREQUENCE_STYLE: Record<FrequenceFrais, string> = {
  MENSUEL:
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-400/20",
  TRIMESTRIEL:
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-400/20",
  ANNUEL:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20",
  UNIQUE:
    "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-400/20",
};

type FormState = {
  nom: string;
  montant: string;
  frequence: FrequenceFrais;
  description: string;
  actif: boolean;
  /** Vide = le frais concerne tous les niveaux. */
  niveauIds: string[];
};

const EMPTY_FORM: FormState = {
  nom: "",
  montant: "",
  frequence: "MENSUEL",
  description: "",
  actif: true,
  niveauIds: [],
};

export default function TypesFrais() {
  const { data: types = [], isLoading } = useTypesFrais();
  const { niveaux = [] } = useNiveaux();
  const createType = useCreateTypeFrais();
  const updateType = useUpdateTypeFrais();
  const deleteType = useDeleteTypeFrais();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TypeFrais | null>(null);
  const [toDelete, setToDelete] = useState<TypeFrais | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const busy = createType.isPending || updateType.isPending;

  // Un montant à 0 vient du paramétrage par défaut : l'école doit le fixer.
  const aConfigurer = types.filter((t) => t.montantMensuel === 0).length;
  const actifs = types.filter((t) => t.actif).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (t: TypeFrais) => {
    setEditing(t);
    setForm({
      nom: t.nom,
      montant: t.montantMensuel ? String(t.montantMensuel) : "",
      frequence: t.frequence,
      description: t.description,
      actif: t.actif,
      niveauIds: t.niveauIds ?? [],
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const montant = Number(form.montant);

    if (!form.nom.trim()) {
      setError("Le nom est requis.");
      return;
    }
    // Le backend refuse un montant <= 0 (@Positive) : on le dit ici plutôt
    // que de laisser partir une requête vouée au 400.
    if (!form.montant.trim() || Number.isNaN(montant) || montant <= 0) {
      setError("Le montant doit être un nombre supérieur à 0.");
      return;
    }

    const payload: TypeFraisRequest = {
      nom: form.nom.trim(),
      montant,
      frequence: form.frequence,
      description: form.description.trim() || undefined,
      actif: form.actif,
      niveauIds: form.niveauIds,
    };

    const onSuccess = () => {
      notify.success(editing ? "Type de frais modifié" : "Type de frais créé");
      setDialogOpen(false);
    };
    const onError = () => notify.error("Erreur lors de l'enregistrement");

    if (editing) {
      updateType.mutate({ id: editing.id, data: payload }, { onSuccess, onError });
    } else {
      createType.mutate(payload, { onSuccess, onError });
    }
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteType.mutate(toDelete.id, {
      onSuccess: () => {
        notify.success("Type de frais supprimé");
        setToDelete(null);
      },
      // Un type déjà utilisé par un paiement est protégé par la contrainte
      // ON DELETE RESTRICT côté base.
      onError: () => {
        notify.error("Suppression impossible : ce type est utilisé par des paiements.");
        setToDelete(null);
      },
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-btn">
            <Tag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Types de frais</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Définissez les frais facturés aux élèves — scolarité, cantine, transport…
            </p>
          </div>
        </div>
        <Button className="bg-gradient-primary shadow-btn gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouveau type de frais
        </Button>
      </div>

      {/* ── Synthèse ── */}
      {!isLoading && types.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5">
                <Layers className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Types définis</p>
                <p className="text-xl font-bold tabular-nums">{types.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5">
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold tabular-nums">{actifs}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${aConfigurer > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-muted"}`}>
                <CircleAlert className={`h-[18px] w-[18px] ${aConfigurer > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sans montant</p>
                <p className="text-xl font-bold tabular-nums">{aConfigurer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Montants par défaut restés à 0 ── */}
      {aConfigurer > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {aConfigurer} type{aConfigurer > 1 ? "s" : ""} de frais sans montant
            </p>
            <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
              Ces types ont été créés avec un montant à 0. Renseignez le montant réel
              de votre établissement avant de facturer.
            </p>
          </div>
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom</th>
                <th className="py-3.5 px-5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">Montant</th>
                <th className="py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fréquence</th>
                <th className="py-3.5 px-5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">Niveaux</th>
                <th className="py-3.5 px-5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
                <th className="py-3.5 px-5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td colSpan={6} className="py-4 px-5">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    {/* Aucun type : le module paiements est bloqué tant que rien n'existe. */}
                    <div className="flex flex-col items-center text-center gap-3 px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Tag className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Aucun type de frais</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                          Tant qu'aucun type n'est défini, aucun paiement ne peut être
                          enregistré. Créez-en un pour débloquer le module Finance.
                        </p>
                      </div>
                      <Button className="bg-gradient-primary shadow-btn gap-2 mt-1" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Créer le premier type
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                types.map((t) => (
                  <tr
                    key={t.id}
                    className="group border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <span className="flex items-center gap-2.5 font-medium text-foreground">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                        </span>
                        {t.nom}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-end whitespace-nowrap">
                      {t.montantMensuel === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <CircleAlert className="h-3.5 w-3.5" /> À configurer
                        </span>
                      ) : (
                        <span className="font-semibold tabular-nums">
                          {t.montantMensuel.toLocaleString("fr-FR")}{" "}
                          <span className="text-xs font-normal text-muted-foreground">{CURRENCY}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${FREQUENCE_STYLE[t.frequence]}`}>
                        {frequenceLabel(t.frequence)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground max-w-xs truncate">
                      {!t.niveauIds || t.niveauIds.length === 0
                        ? "Tous"
                        : niveaux
                            .filter((n) => t.niveauIds.includes(n.id))
                            .map((n) => n.nom)
                            .join(", ") || "Tous"}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Badge variant={t.actif ? "default" : "secondary"}>
                        {t.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="py-4 px-5">
                      {/* Actions estompées au repos, nettes au survol de la ligne. */}
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(t)}
                          aria-label={`Modifier ${t.nom}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setToDelete(t)}
                          aria-label={`Supprimer ${t.nom}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Création / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le type de frais" : "Nouveau type de frais"}
            </DialogTitle>
            <DialogDescription>
              Ce type devient sélectionnable lors de l'enregistrement d'un paiement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex : Frais de scolarité"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="montant">Montant ({CURRENCY}) *</Label>
                <Input
                  id="montant"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frequence">Fréquence *</Label>
                <Select
                  value={form.frequence}
                  onValueChange={(v) => setForm({ ...form, frequence: v as FrequenceFrais })}
                >
                  <SelectTrigger id="frequence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description facultative…"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Niveaux concernés</Label>
              <div className="flex flex-wrap gap-1.5">
                {niveaux.map((n) => {
                  const choisi = form.niveauIds.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          niveauIds: choisi
                            ? form.niveauIds.filter((x) => x !== n.id)
                            : [...form.niveauIds, n.id],
                        })
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                        choisi
                          ? "bg-primary/10 text-primary ring-primary/30"
                          : "bg-muted text-muted-foreground ring-border hover:bg-muted/70"
                      }`}
                    >
                      {n.nom}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Aucun niveau sélectionné = le frais s'applique à tous les élèves.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actif">Statut</Label>
              <Select
                value={form.actif ? "true" : "false"}
                onValueChange={(v) => setForm({ ...form, actif: v === "true" })}
              >
                <SelectTrigger id="actif">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Actif</SelectItem>
                  <SelectItem value="false">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Un type inactif n'apparaît plus dans le formulaire de paiement.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={busy}>
              {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce type de frais ?</DialogTitle>
            <DialogDescription>
              « {toDelete?.nom} » sera supprimé définitivement. La suppression est
              refusée si des paiements y sont déjà rattachés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteType.isPending}
            >
              {deleteType.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
