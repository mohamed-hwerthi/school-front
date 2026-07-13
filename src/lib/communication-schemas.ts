import { z } from "zod";

export const annonceSchema = z.object({
  titre: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
  contenu: z.string().trim().min(5, "Contenu requis (min 5 caractères)"),
  type: z.string().optional(),
  datePublication: z.string().optional(),
  dateExpiration: z.string().optional(),
  audience: z.string().optional(),
});

export type AnnonceFormValues = z.infer<typeof annonceSchema>;

export const reunionSchema = z
  .object({
    title: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
    description: z.string().optional(),
    date: z.string().min(1, "Date requise"),
    heureDebut: z.string().min(1, "Heure début requise"),
    heureFin: z.string().min(1, "Heure fin requise"),
    lieu: z.string().optional(),
    type: z.string().optional(),
    classeId: z.number().int().positive().optional(),
    enseignantId: z.number().int().positive().optional(),
  })
  .refine((v) => v.heureFin > v.heureDebut, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["heureFin"],
  });

export type ReunionFormValues = z.infer<typeof reunionSchema>;

export const fichePaieSchema = z.object({
  employeId: z.string().min(1, "Employé requis"),
  employeType: z.string().optional(),
  mois: z.coerce.number().int().min(1, "Min 1").max(12, "Max 12"),
  annee: z.coerce.number().int().min(2000, "Année invalide").max(2100, "Année invalide"),
  salaireBase: z.coerce.number().min(0, "Min 0"),
  primes: z.coerce.number().min(0, "Min 0").optional(),
  retenues: z.coerce.number().min(0, "Min 0").optional(),
  salaireNet: z.coerce.number().optional(),
  paye: z.boolean().optional(),
  commentaire: z.string().optional(),
});

export type FichePaieFormValues = z.infer<typeof fichePaieSchema>;

export const contratSchema = z
  .object({
    enseignantId: z.string().min(1, "Enseignant requis"),
    typeContrat: z.string().min(1, "Type requis"),
    dateDebut: z.string().min(1, "Date début requise"),
    dateFin: z.string().optional(),
    salaire: z.coerce.number().positive("Salaire requis"),
  })
  .refine((v) => !v.dateFin || new Date(v.dateFin) > new Date(v.dateDebut), {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });

export type ContratFormValues = z.infer<typeof contratSchema>;

export const congeSchema = z
  .object({
    enseignantId: z.string().min(1, "Enseignant requis"),
    type: z.string().optional(),
    dateDebut: z.string().min(1, "Date début requise"),
    dateFin: z.string().min(1, "Date fin requise"),
    motif: z.string().optional(),
  })
  .refine((v) => new Date(v.dateFin) >= new Date(v.dateDebut), {
    message: "La date de fin doit être ≥ à la date de début",
    path: ["dateFin"],
  });

export type CongeFormValues = z.infer<typeof congeSchema>;
