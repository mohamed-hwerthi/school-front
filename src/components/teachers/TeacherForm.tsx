import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherSchema, type TeacherFormValues } from "@/lib/teacher-schema";
import { STATUTS_ENSEIGNANT } from "@/types/teacher";
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

interface TeacherFormProps {
  defaultValues?: Partial<TeacherFormValues>;
  onSubmit: (data: TeacherFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function TeacherForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: TeacherFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      specialite: "",
      sexe: "M",
      dateNaissance: "",
      telephone: "",
      email: "",
      statut: "Actif",
      ...defaultValues,
    },
  });

  const sexe = watch("sexe");
  const statut = watch("statut");

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
            <Label htmlFor="dateNaissance">Date de naissance *</Label>
            <Input
              id="dateNaissance"
              type="date"
              {...register("dateNaissance")}
            />
            {errors.dateNaissance && (
              <p className="text-xs text-destructive">{errors.dateNaissance.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              {...register("telephone")}
              placeholder="06XXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@ecole.ma"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
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
                {STATUTS_ENSEIGNANT.map((s) => (
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
