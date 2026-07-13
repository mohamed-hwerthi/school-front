import { z } from "zod";

export const depenseSchema = z.object({
  categorieId: z.string().min(1, "Catégorie requise"),
  libelle: z.string().trim().min(3, "Libellé requis (min 3 caractères)"),
  montant: z.coerce.number().positive("Montant > 0"),
  dateDepense: z.string().min(1, "Date requise"),
  modePaiement: z.string().nullable().optional(),
  fournisseur: z.string().optional().default(""),
  reference: z.string().optional().default(""),
  recurrente: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
  anneeScolaire: z.string().trim().min(1, "Année scolaire requise"),
});

export type DepenseFormValues = z.infer<typeof depenseSchema>;

export const relanceSchema = z.object({
  studentId: z.string().min(1, "Élève requis"),
  type: z.string().min(1, "Type requis"),
  message: z.string().trim().min(5, "Message trop court (min 5 caractères)"),
  destinataire: z.string().trim().min(1, "Destinataire requis"),
  anneeScolaire: z.string().trim().min(1, "Année requise"),
});

export type RelanceFormValues = z.infer<typeof relanceSchema>;

export const factureSchema = z.object({
  eleveId: z.string().min(1, "Élève requis"),
  montantTotal: z.coerce.number().positive("Montant > 0"),
  dateEmission: z.string().optional(),
  dateEcheance: z.string().optional(),
  description: z.string().optional(),
  anneeScolaire: z.string().optional(),
});

export type FactureFormValues = z.infer<typeof factureSchema>;

export const echeancierSchema = z
  .object({
    eleveId: z.string().min(1, "Élève requis"),
    montantTotal: z.coerce.number().positive("Montant > 0"),
    nombreEcheances: z.coerce.number().int().min(2, "Min 2 échéances").max(24, "Max 24"),
    dateDebut: z.string().min(1, "Date début requise"),
    frequence: z.string().optional().default("MENSUEL"),
  });

export type EcheancierFormValues = z.infer<typeof echeancierSchema>;

export const remiseSchema = z.object({
  eleveId: z.string().min(1, "Élève requis"),
  motif: z.string().trim().min(3, "Motif requis (min 3 caractères)"),
  pourcentage: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%").optional(),
  montant: z.coerce.number().min(0, "Min 0").optional(),
}).refine((v) => (v.pourcentage ?? 0) > 0 || (v.montant ?? 0) > 0, {
  message: "Pourcentage ou montant requis",
  path: ["pourcentage"],
});

export type RemiseFormValues = z.infer<typeof remiseSchema>;

export const penaliteSchema = z.object({
  eleveId: z.string().min(1, "Élève requis"),
  motif: z.string().trim().min(3, "Motif requis (min 3 caractères)"),
  montant: z.coerce.number().positive("Montant > 0"),
  dateEmission: z.string().optional(),
});

export type PenaliteFormValues = z.infer<typeof penaliteSchema>;
