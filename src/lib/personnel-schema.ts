import { z } from "zod";

export const personnelSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  fonction: z.string().min(1, "La fonction est requise"),
  sexe: z.enum(["M", "F"], { required_error: "Le sexe est requis" }),
  dateNaissance: z.string().optional().default(""),
  telephone: z.string().optional().default(""),
  email: z.string().email("Email invalide").or(z.literal("")).optional().default(""),
  statut: z.enum(["Actif", "Inactif", "En attente"]).default("Actif"),
});

export type PersonnelFormValues = z.infer<typeof personnelSchema>;
