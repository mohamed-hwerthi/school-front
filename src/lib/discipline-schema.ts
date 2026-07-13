import { z } from "zod";

export const incidentSchema = z.object({
  titre: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
  date: z.string().min(1, "Date requise"),
  type: z.string().min(1, "Type requis"),
  description: z.string().optional().default(""),
  gravite: z.string().min(1, "Gravité requise"),
  lieu: z.string().optional().default(""),
  elevesImpliques: z.array(z.any()).optional().default([]),
  signaleParId: z.string().optional(),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;

export const sanctionSchema = z
  .object({
    eleveId: z.string().min(1, "Sélectionnez un élève"),
    incidentId: z.string().optional(),
    typeSanction: z.string().min(1, "Type requis"),
    description: z.string().optional().default(""),
    dateDebut: z.string().min(1, "Date début requise"),
    dateFin: z.string().optional().default(""),
    notifieParent: z.boolean().optional().default(false),
  })
  .refine((v) => !v.dateFin || new Date(v.dateFin) >= new Date(v.dateDebut), {
    message: "La date de fin doit être ≥ à la date de début",
    path: ["dateFin"],
  });

export type SanctionFormValues = z.infer<typeof sanctionSchema>;
