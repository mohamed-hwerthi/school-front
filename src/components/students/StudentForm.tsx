import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentFormValues } from "@/lib/student-schema";
import { STATUTS } from "@/types/student";
import { useNiveaux } from "@/hooks/useNiveaux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function StudentForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: StudentFormProps) {
  const { niveaux, getClassesForNiveau } = useNiveaux();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      nomAr: "",
      prenomAr: "",
      niveau: "",
      classe: "",
      sexe: "M",
      dateNaissance: "",
      lieuNaissance: "",
      adresse: "",
      matricule: "",
      statut: "Actif",
      estBloque: false,
      nomParent: "",
      prenomParent: "",
      telephoneParent: "",
      emailParent: "",
      notes: "",
      ...defaultValues,
    },
  });

  const niveau = watch("niveau");
  const classe = watch("classe");
  const sexe = watch("sexe");
  const statut = watch("statut");
  const estBloque = watch("estBloque");
  const classes = niveau ? getClassesForNiveau(niveau) : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identité */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Identité de l'élève
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" {...register("nom")} placeholder="Nom" />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prénom *</Label>
            <Input id="prenom" {...register("prenom")} placeholder="Prénom" />
            {errors.prenom && (
              <p className="text-xs text-destructive">
                {errors.prenom.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nomAr">الاسم العائلي (Nom en arabe)</Label>
            <Input
              id="nomAr"
              {...register("nomAr")}
              placeholder="الاسم العائلي"
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prenomAr">الاسم الشخصي (Prénom en arabe)</Label>
            <Input
              id="prenomAr"
              {...register("prenomAr")}
              placeholder="الاسم الشخصي"
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexe *</Label>
            <Select
              value={sexe}
              onValueChange={(v) =>
                setValue("sexe", v as "M" | "F", { shouldValidate: true })
              }
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
            <Label htmlFor="dateNaissance">Date de naissance *</Label>
            <Input
              id="dateNaissance"
              type="date"
              {...register("dateNaissance")}
            />
            {errors.dateNaissance && (
              <p className="text-xs text-destructive">
                {errors.dateNaissance.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
            <Input
              id="lieuNaissance"
              {...register("lieuNaissance")}
              placeholder="Ville de naissance"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              {...register("adresse")}
              placeholder="Adresse complète"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="matricule">Matricule</Label>
            <Input
              id="matricule"
              {...register("matricule")}
              placeholder="N° matricule"
            />
          </div>
        </div>
      </div>

      {/* Scolarité */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Informations scolaires
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Niveau *</Label>
            <Select
              value={niveau}
              onValueChange={(v) => {
                setValue("niveau", v, { shouldValidate: true });
                setValue("classe", "", { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le niveau" />
              </SelectTrigger>
              <SelectContent>
                {niveaux.map((n) => (
                  <SelectItem key={n.nom} value={n.nom}>
                    {n.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.niveau && (
              <p className="text-xs text-destructive">
                {errors.niveau.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Classe *</Label>
            <Select
              value={classe}
              onValueChange={(v) =>
                setValue("classe", v, { shouldValidate: true })
              }
              disabled={!niveau}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    niveau
                      ? "Choisir la classe"
                      : "Sélectionnez d'abord un niveau"
                  }
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
            {errors.classe && (
              <p className="text-xs text-destructive">
                {errors.classe.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={statut}
              onValueChange={(v) =>
                setValue(
                  "statut",
                  v as "Actif" | "Inactif" | "En attente",
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="estBloque"
              checked={estBloque}
              onCheckedChange={(v) => setValue("estBloque", v)}
            />
            <Label htmlFor="estBloque" className="cursor-pointer">
              Élève bloqué
            </Label>
          </div>
        </div>
      </div>

      {/* Parent / Tuteur */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Parent / Tuteur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="nomParent">Nom du parent</Label>
            <Input
              id="nomParent"
              {...register("nomParent")}
              placeholder="Nom du parent"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prenomParent">Prénom du parent</Label>
            <Input
              id="prenomParent"
              {...register("prenomParent")}
              placeholder="Prénom du parent"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephoneParent">Téléphone du parent</Label>
            <Input
              id="telephoneParent"
              {...register("telephoneParent")}
              placeholder="06XXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emailParent">Email du parent</Label>
            <Input
              id="emailParent"
              type="email"
              {...register("emailParent")}
              placeholder="parent@email.com"
            />
            {errors.emailParent && (
              <p className="text-xs text-destructive">
                {errors.emailParent.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Informations supplémentaires
        </h3>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes / Observations</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Remarques, observations, besoins spécifiques..."
            rows={3}
          />
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
