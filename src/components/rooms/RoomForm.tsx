import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomFormSchema, type RoomFormValues } from "@/lib/room-schema";
import { ROOM_TYPES, ROOM_STATUTS } from "@/types/room";
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

interface RoomFormProps {
  defaultValues?: Partial<RoomFormValues>;
  onSubmit: (data: RoomFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function RoomForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
  isSubmitting = false,
}: RoomFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      nom: "",
      type: "Salle de classe",
      capacite: 30,
      etage: 0,
      equipements: "",
      statut: "Disponible",
      ...defaultValues,
    },
  });

  const type = watch("type");
  const statut = watch("statut");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom de la salle *</Label>
            <Input id="nom" {...register("nom")} placeholder="Ex: Salle A1" />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select
              value={type}
              onValueChange={(v) => setValue("type", v as RoomFormValues["type"], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le type" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacite">Capacité *</Label>
            <Input
              id="capacite"
              type="number"
              min={1}
              {...register("capacite")}
              placeholder="30"
            />
            {errors.capacite && (
              <p className="text-xs text-destructive">{errors.capacite.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="etage">Étage *</Label>
            <Input
              id="etage"
              type="number"
              min={0}
              {...register("etage")}
              placeholder="0"
            />
            {errors.etage && (
              <p className="text-xs text-destructive">{errors.etage.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="equipements">Équipements</Label>
            <Input
              id="equipements"
              {...register("equipements")}
              placeholder="Tableau blanc, Projecteur, Climatisation (séparés par des virgules)"
            />
            <p className="text-xs text-muted-foreground">Séparez les équipements par des virgules</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Statut</Label>
            <Select
              value={statut}
              onValueChange={(v) =>
                setValue("statut", v as RoomFormValues["statut"], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_STATUTS.map((s) => (
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
        <Button type="submit" className="bg-gradient-primary shadow-btn" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
