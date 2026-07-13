import { z } from "zod";

export const paiementSchema = z.object({
  eleveId: z.string().min(1, "L'élève est requis"),
  typeFraisId: z.string().min(1, "Le type de frais est requis"),
  mois: z.string().min(1, "Le mois est requis"),
  montantDu: z.coerce.number().min(0, "Le montant dû doit être positif"),
  montantPaye: z.coerce.number().min(0, "Le montant payé doit être positif"),
  datePaiement: z.string().optional().default(""),
  modePaiement: z.string().min(1, "Le mode de paiement est requis"),
  statut: z.enum(["Payé", "Partiel", "En attente", "En retard"]).default("En attente"),
  reference: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type PaiementFormValues = z.infer<typeof paiementSchema>;

export const communicationSchema = z.object({
  eleveId: z.string().min(1, "L'élève est requis"),
  type: z.enum(["SMS", "Email"], { required_error: "Le type est requis" }),
  objet: z.string().min(1, "L'objet est requis"),
  contenu: z.string().min(1, "Le contenu est requis"),
});

export type CommunicationFormValues = z.infer<typeof communicationSchema>;
