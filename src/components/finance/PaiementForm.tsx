import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paiementSchema, type PaiementFormValues } from "@/lib/finance-schema";
import { useAllStudents } from "@/hooks/useStudents";
import { useTypesFrais } from "@/hooks/useFinance";
import { MODES_PAIEMENT, MOIS_SCOLAIRES, MOIS_LABELS } from "@/types/finance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCY } from "@/config/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaiementFormProps {
  defaultValues?: Partial<PaiementFormValues>;
  onSubmit: (data: PaiementFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function PaiementForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: PaiementFormProps) {
  const { data: students = [] } = useAllStudents();
  const { data: typesFrais = [] } = useTypesFrais();
  const activeStudents = students.filter((s) => s.statut === "Actif");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      eleveId: "",
      typeFraisId: "",
      mois: "",
      montantDu: 0,
      montantPaye: 0,
      datePaiement: "",
      modePaiement: "",
      statut: "En attente",
      reference: "",
      notes: "",
      ...defaultValues,
    },
  });

  const eleveId = watch("eleveId");
  const typeFraisId = watch("typeFraisId");
  const mois = watch("mois");
  const modePaiement = watch("modePaiement");
  const montantDu = watch("montantDu");
  const montantPaye = watch("montantPaye");

  // Un mois n'a de sens que pour un frais MENSUEL : des frais d'inscription
  // se règlent une fois pour l'année.
  const typeFraisSelectionne = typesFrais.find((t) => String(t.id) === typeFraisId);
  const exigeMois = !typeFraisSelectionne || typeFraisSelectionne.frequence === "MENSUEL";

  // Le statut n'est pas un choix : le serveur le recalcule depuis les montants
  // (computeStatut). On se contente de montrer ce qui sera enregistré.
  const statutCalcule =
    Number(montantPaye) <= 0
      ? "En attente"
      : Number(montantPaye) >= Number(montantDu)
        ? "Payé"
        : "Partiel";

  // ── Cascade Niveau → Classe → Élève ──────────────────────────────
  const [selectedNiveau, setSelectedNiveau] = useState<string>("");
  const [selectedClasse, setSelectedClasse] = useState<string>("");

  const niveaux = useMemo(
    () => Array.from(new Set(activeStudents.map((s) => s.niveau).filter(Boolean))).sort(),
    [activeStudents]
  );

  const classes = useMemo(() => {
    const filtered = selectedNiveau
      ? activeStudents.filter((s) => s.niveau === selectedNiveau)
      : activeStudents;
    return Array.from(new Set(filtered.map((s) => s.classe).filter(Boolean))).sort();
  }, [activeStudents, selectedNiveau]);

  const filteredStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      if (selectedNiveau && s.niveau !== selectedNiveau) return false;
      if (selectedClasse && s.classe !== selectedClasse) return false;
      return true;
    });
  }, [activeStudents, selectedNiveau, selectedClasse]);

  // En edition: si un eleveId est deja set, pre-remplir niveau/classe a partir de l'eleve
  useEffect(() => {
    if (!eleveId) return;
    const current = activeStudents.find((s) => String(s.id) === String(eleveId));
    if (current) {
      if (!selectedNiveau) setSelectedNiveau(current.niveau ?? "");
      if (!selectedClasse) setSelectedClasse(current.classe ?? "");
    }
  }, [eleveId, activeStudents, selectedNiveau, selectedClasse]);

  const handleNiveauChange = (v: string) => {
    setSelectedNiveau(v);
    setSelectedClasse("");
    setValue("eleveId", "", { shouldValidate: false });
  };

  const handleClasseChange = (v: string) => {
    setSelectedClasse(v);
    setValue("eleveId", "", { shouldValidate: false });
  };

  const handleTypeFraisChange = (value: string) => {
    setValue("typeFraisId", value, { shouldValidate: true });
    const tf = typesFrais.find((t) => String(t.id) === value);
    if (tf) {
      setValue("montantDu", tf.montantMensuel);
      setValue("frequence", tf.frequence, { shouldValidate: true });
      // Un frais non mensuel ne porte pas de mois : on efface l'ancienne valeur.
      setValue("mois", tf.frequence === "MENSUEL" ? mois : "", { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Niveau *</Label>
            <Select value={selectedNiveau} onValueChange={handleNiveauChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le niveau" />
              </SelectTrigger>
              <SelectContent>
                {niveaux.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Classe *</Label>
            <Select
              value={selectedClasse}
              onValueChange={handleClasseChange}
              disabled={!selectedNiveau}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedNiveau ? "Choisir la classe" : "Choisir d'abord un niveau"}
                />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Élève *</Label>
            <Select
              value={eleveId ? String(eleveId) : ""}
              onValueChange={(v) => setValue("eleveId", v, { shouldValidate: true })}
              disabled={!selectedClasse}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedClasse ? "Choisir un élève" : "Choisir d'abord une classe"}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.prenom} {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eleveId && (
              <p className="text-xs text-destructive">{errors.eleveId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Type de frais *</Label>
            <Select
              value={typeFraisId ? String(typeFraisId) : ""}
              onValueChange={handleTypeFraisChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le type" />
              </SelectTrigger>
              <SelectContent>
                {typesFrais.filter((t) => t.actif).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nom} ({t.montantMensuel} {CURRENCY})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.typeFraisId && (
              <p className="text-xs text-destructive">{errors.typeFraisId.message}</p>
            )}
          </div>

          {exigeMois ? (
            <div className="space-y-1.5">
              <Label>Mois *</Label>
              <Select
                value={mois}
                onValueChange={(v) => setValue("mois", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le mois" />
                </SelectTrigger>
                <SelectContent>
                  {MOIS_SCOLAIRES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MOIS_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mois && (
                <p className="text-xs text-destructive">{errors.mois.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Mois</Label>
              <Input value="Sans objet" readOnly disabled className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Un frais {typeFraisSelectionne?.frequence === "ANNUEL" ? "annuel" : "ponctuel"} se
                règle une fois pour l'année scolaire.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="montantDu">Montant dû ({CURRENCY})</Label>
            <Input
              id="montantDu"
              type="number"
              {...register("montantDu", { valueAsNumber: true })}
              readOnly
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="montantPaye">Montant payé ({CURRENCY}) *</Label>
            <Input
              id="montantPaye"
              type="number"
              {...register("montantPaye", { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.montantPaye && (
              <p className="text-xs text-destructive">{errors.montantPaye.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="datePaiement">Date de paiement</Label>
            <Input
              id="datePaiement"
              type="date"
              {...register("datePaiement")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mode de paiement *</Label>
            <Select
              value={modePaiement}
              onValueChange={(v) => setValue("modePaiement", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le mode" />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.modePaiement && (
              <p className="text-xs text-destructive">{errors.modePaiement.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Input value={statutCalcule} readOnly disabled className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Déduit des montants : payé intégralement, partiel, ou en attente.
            </p>
          </div>

          {/* La référence est produite par le serveur à la création
              (PAY-2025-09-001) : on l'affiche en lecture seule, jamais en saisie. */}
          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={defaultValues?.reference || "Générée automatiquement"}
              readOnly
              disabled
              className="text-muted-foreground"
            />
            {!defaultValues?.reference && (
              <p className="text-xs text-muted-foreground">
                Attribuée à l'enregistrement, au format PAY-2025-09-001.
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="bg-gradient-primary shadow-btn">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
