import { z } from "zod";

export const paiementSchema = z
  .object({
    eleveId: z.string().min(1, "L'élève est requis"),
    typeFraisId: z.string().min(1, "Le type de frais est requis"),
    mois: z.string().optional().default(""),
    // Champ technique : porte la fréquence du type de frais choisi, pour
    // n'exiger un mois que sur un frais MENSUEL. Non envoyé à l'API.
    frequence: z.string().optional().default(""),
    montantDu: z.coerce.number().min(0, "Le montant dû doit être positif"),
    montantPaye: z.coerce.number().min(0, "Le montant payé doit être positif"),
    datePaiement: z.string().optional().default(""),
    modePaiement: z.string().min(1, "Le mode de paiement est requis"),
    statut: z.enum(["Payé", "Partiel", "En attente", "En retard"]).default("En attente"),
    reference: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const mensuel = !data.frequence || data.frequence === "MENSUEL";
    if (mensuel && !data.mois) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mois"],
        message: "Le mois est requis",
      });
    }
  });

export type PaiementFormValues = z.infer<typeof paiementSchema>;

export const communicationSchema = z.object({
  eleveId: z.string().min(1, "L'élève est requis"),
  type: z.enum(["SMS", "Email"], { required_error: "Le type est requis" }),
  objet: z.string().min(1, "L'objet est requis"),
  contenu: z.string().min(1, "Le contenu est requis"),
});

export type CommunicationFormValues = z.infer<typeof communicationSchema>;
