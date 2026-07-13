import { z } from "zod";

export const createInscriptionSchema = z.object({
  nom: z.string().trim().min(2, "Le nom est requis (min 2 caractères)"),
  prenom: z.string().trim().min(2, "Le prénom est requis (min 2 caractères)"),
  dateNaissance: z
    .string()
    .min(1, "La date de naissance est requise")
    .refine((v) => new Date(v) < new Date(), { message: "La date doit être dans le passé" }),
  sexe: z.enum(["M", "F"]).optional(),
  lieuNaissance: z.string().optional(),
  adresse: z.string().optional(),
  nomParent: z.string().optional(),
  prenomParent: z.string().optional(),
  telephoneParent: z
    .string()
    .optional()
    .refine((v) => !v || /^[+\d\s-]{6,}$/.test(v), {
      message: "Numéro invalide",
    }),
  emailParent: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email invalide",
    }),
  niveauId: z.string().min(1, "Le niveau est requis"),
  anneeScolaire: z
    .string()
    .trim()
    .regex(/^\d{4}\s*-\s*\d{4}$/, 'Format "2025-2026" attendu'),
});

export type CreateInscriptionFormValues = z.infer<typeof createInscriptionSchema>;
