import { z } from "zod";

export const quizSchema = z.object({
  titre: z.string().trim().min(3, "Titre requis (min 3 caractères)"),
  description: z.string().optional(),
  dureeMinutes: z.coerce.number().int().positive("Durée > 0").max(600, "Max 600 min"),
  noteTotale: z.coerce.number().positive("Note totale > 0").max(100, "Max 100"),
  tentativesMax: z.coerce.number().int().positive("Min 1").max(10, "Max 10"),
  statut: z.string().optional().default("BROUILLON"),
  classeId: z.number().int().positive().optional(),
  moduleId: z.number().int().positive().optional(),
});

export type QuizFormValues = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  texte: z.string().trim().min(3, "Énoncé requis (min 3 caractères)"),
  typeQuestion: z.string().min(1, "Type requis"),
  points: z.coerce.number().positive("Points > 0").max(100, "Max 100"),
  ordre: z.coerce.number().int().positive().optional().default(1),
  choix: z.array(z.any()).optional().default([]),
});

export type QuestionFormValues = z.infer<typeof questionSchema>;
