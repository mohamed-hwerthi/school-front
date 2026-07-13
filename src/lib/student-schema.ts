import { z } from "zod";

export const studentSchema = z.object({
  // Identité
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  nomAr: z.string().optional().default(""),
  prenomAr: z.string().optional().default(""),
  sexe: z.enum(["M", "F"], { required_error: "Le sexe est requis" }),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  lieuNaissance: z.string().optional().default(""),
  adresse: z.string().optional().default(""),
  matricule: z.string().optional().default(""),

  // Scolarité
  niveau: z.string().min(1, "Le niveau est requis"),
  classe: z.string().min(1, "La classe est requise"),
  statut: z.enum(["Actif", "Inactif", "En attente"]).default("Actif"),
  estBloque: z.boolean().default(false),

  // Parent / Tuteur
  nomParent: z.string().optional().default(""),
  prenomParent: z.string().optional().default(""),
  telephoneParent: z.string().optional().default(""),
  emailParent: z
    .string()
    .email("Email parent invalide")
    .or(z.literal(""))
    .optional()
    .default(""),

  // Divers
  notes: z.string().optional().default(""),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
