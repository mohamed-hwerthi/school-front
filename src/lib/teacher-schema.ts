import { z } from "zod";

export const teacherSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  specialite: z.string().optional().default(""),
  sexe: z.enum(["M", "F"], { required_error: "Le sexe est requis" }),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  telephone: z.string().optional().default(""),
  email: z.string().email("Email invalide").or(z.literal("")).optional().default(""),
  statut: z.enum(["Actif", "Inactif", "En attente"]).default("Actif"),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
