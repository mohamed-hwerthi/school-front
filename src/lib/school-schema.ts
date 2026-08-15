import { z } from "zod";

export const schoolSchema = z.object({
  nom: z.string().min(1, "Le nom de l'école est requis"),
  nomAr: z.string().optional().default(""),
  logo: z.string().optional().default(""),
  adresse: z.string().optional().default(""),
  adresseAr: z.string().optional().default(""),
  telephone: z.string().optional().default(""),
  email: z.string().email("Email invalide").or(z.literal("")).optional().default(""),
  siteWeb: z.string().optional().default(""),
  directeur: z.string().optional().default(""),
  directeurAr: z.string().optional().default(""),
  delegationRegionale: z.string().optional().default(""),
  delegationRegionaleAr: z.string().optional().default(""),
  anneeCreation: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;
