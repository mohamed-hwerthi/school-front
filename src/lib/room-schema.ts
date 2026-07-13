import { z } from "zod";

export const roomFormSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.enum([
    "Salle de classe",
    "Laboratoire",
    "Salle informatique",
    "Bibliothèque",
    "Salle de sport",
    "Salle polyvalente",
  ], { required_error: "Le type est requis" }),
  capacite: z.coerce.number().min(1, "La capacité doit être au moins 1"),
  etage: z.coerce.number().min(0, "L'étage doit être positif"),
  equipements: z.string().optional().default(""),
  statut: z.enum(["Disponible", "Occupée", "En maintenance"]).default("Disponible"),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

export const timeSlotFormSchema = z.object({
  salleId: z.coerce.number().min(1, "La salle est requise"),
  jour: z.enum(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"], {
    required_error: "Le jour est requis",
  }),
  heureDebut: z.string().min(1, "L'heure de début est requise"),
  heureFin: z.string().min(1, "L'heure de fin est requise"),
  matiere: z.string().min(1, "La matière est requise"),
  enseignant: z.string().min(1, "L'enseignant est requis"),
  classe: z.string().min(1, "La classe est requise"),
  niveau: z.string().min(1, "Le niveau est requis"),
});

export type TimeSlotFormValues = z.infer<typeof timeSlotFormSchema>;
