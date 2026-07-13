import { z } from "zod";

export const anneeScolaireSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(4, "Le libellé est requis")
      .regex(/^\d{4}\s*-\s*\d{4}$/, 'Format attendu: "2025-2026"'),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })
  .refine((v) => new Date(v.dateFin) > new Date(v.dateDebut), {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  })
  .refine((v) => {
    const m = v.label.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (!m) return true;
    return Number(m[2]) === Number(m[1]) + 1;
  }, {
    message: "Les deux années doivent être consécutives",
    path: ["label"],
  });

export type AnneeScolaireFormValues = z.infer<typeof anneeScolaireSchema>;

export const trimestreSchema = z
  .object({
    numero: z.coerce.number().int().min(1, "Min 1").max(4, "Max 4"),
    label: z.string().trim().min(2, "Libellé requis"),
    dateDebut: z.string().min(1, "Date début requise"),
    dateFin: z.string().min(1, "Date fin requise"),
    saisieNotesOuverte: z.boolean().optional().default(false),
  })
  .refine((v) => new Date(v.dateFin) > new Date(v.dateDebut), {
    message: "La date de fin doit être après la date de début",
    path: ["dateFin"],
  });

export type TrimestreFormValues = z.infer<typeof trimestreSchema>;

export const vacanceSchema = z
  .object({
    label: z.string().trim().min(2, "Libellé requis"),
    dateDebut: z.string().min(1, "Date début requise"),
    dateFin: z.string().min(1, "Date fin requise"),
  })
  .refine((v) => new Date(v.dateFin) >= new Date(v.dateDebut), {
    message: "La date de fin doit être ≥ à la date de début",
    path: ["dateFin"],
  });

export type VacanceFormValues = z.infer<typeof vacanceSchema>;

export const jourFerieSchema = z.object({
  label: z.string().trim().min(2, "Libellé requis"),
  date: z.string().min(1, "Date requise"),
});

export type JourFerieFormValues = z.infer<typeof jourFerieSchema>;
