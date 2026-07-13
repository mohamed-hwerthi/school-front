import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personnelSchema, type PersonnelFormValues } from "@/lib/personnel-schema";
import { FONCTIONS_PERSONNEL, STATUTS_PERSONNEL } from "@/types/personnel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AUTRE = "__autre__";

interface PersonnelFormProps {
  defaultValues?: Partial<PersonnelFormValues>;
  onSubmit: (data: PersonnelFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function PersonnelForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: PersonnelFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      fonction: "",
      sexe: "M",
      dateNaissance: "",
      telephone: "",
      email: "",
      statut: "Actif",
      ...defaultValues,
    },
  });

  const fonction = watch("fonction");
  const sexe = watch("sexe");
  const statut = watch("statut");

  // An existing custom fonction (not in the preset list) starts in "Autre" mode.
  const initialFonction = defaultValues?.fonction ?? "";
  const [isCustom, setIsCustom] = useState(
    initialFonction !== "" &&
      !FONCTIONS_PERSONNEL.includes(initialFonction as (typeof FONCTIONS_PERSONNEL)[number])
  );

  // Value shown in the Select trigger.
  const selectValue = isCustom
    ? AUTRE
    : FONCTIONS_PERSONNEL.includes(fonction as (typeof FONCTIONS_PERSONNEL)[number])
      ? fonction
      : "";

  const handleFonctionSelect = (v: string) => {
    if (v === AUTRE) {
      setIsCustom(true);
      setValue("fonction", "", { shouldValidate: false });
    } else {
      setIsCustom(false);
      setValue("fonction", v, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prénom *</Label>
            <Input id="prenom" {...register("prenom")} placeholder="Prénom" />
            {errors.prenom && (
              <p className="text-xs text-destructive">{errors.prenom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" {...register("nom")} placeholder="Nom" />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Fonction *</Label>
            <Select value={selectValue} onValueChange={handleFonctionSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la fonction" />
              </SelectTrigger>
              <SelectContent>
                {FONCTIONS_PERSONNEL.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
                <SelectItem value={AUTRE}>Autre…</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                {...register("fonction")}
                placeholder="Préciser la fonction"
                className="mt-2"
                autoFocus
              />
            )}
            {errors.fonction && (
              <p className="text-xs text-destructive">{errors.fonction.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Sexe *</Label>
            <Select
              value={sexe}
              onValueChange={(v) => setValue("sexe", v as "M" | "F", { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Féminin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateNaissance">Date de naissance</Label>
            <Input id="dateNaissance" type="date" {...register("dateNaissance")} />
            {errors.dateNaissance && (
              <p className="text-xs text-destructive">{errors.dateNaissance.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" {...register("telephone")} placeholder="06XXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="email@ecole.ma" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={statut}
              onValueChange={(v) =>
                setValue("statut", v as "Actif" | "Inactif" | "En attente", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_PERSONNEL.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
