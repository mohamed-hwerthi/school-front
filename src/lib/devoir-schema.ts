import { z } from "zod";

export const devoirSchema = z.object({
  titre: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
  dateLimite: z
    .string()
    .min(1, "Date limite requise")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: "Date invalide" }),
  type: z.string().min(1, "Type requis"),
  pointsMax: z.coerce.number().int().positive("Doit être > 0").max(100, "Max 100"),
  statut: z.string().optional().default("PUBLIE"),
  description: z.string().optional(),
  classeId: z.string().optional(),
  enseignantId: z.string().optional(),
  moduleId: z.string().optional(),
  fichierUrl: z.string().optional(),
});

export type DevoirFormValues = z.infer<typeof devoirSchema>;

export const ressourceSchema = z.object({
  titre: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
  type: z.string().min(1, "Type requis"),
  description: z.string().optional(),
  url: z.string().optional(),
  fichierUrl: z.string().optional(),
  classeId: z.string().optional(),
  moduleId: z.string().optional(),
});

export type RessourceFormValues = z.infer<typeof ressourceSchema>;
