import { z } from "zod";

export const livreSchema = z.object({
  titre: z.string().trim().min(2, "Titre requis"),
  auteur: z.string().optional(),
  isbn: z.string().optional(),
  categorie: z.string().optional(),
  quantite: z.coerce.number().int().min(0, "Min 0").optional(),
});

export type LivreFormValues = z.infer<typeof livreSchema>;

export const menuSchema = z.object({
  dateMenu: z.string().min(1, "Date requise"),
  jourSemaine: z.string().optional(),
  platPrincipal: z.string().trim().min(2, "Plat principal requis"),
  entree: z.string().optional(),
  accompagnement: z.string().optional(),
  dessert: z.string().optional(),
  typeRegime: z.string().optional(),
});

export type MenuFormValues = z.infer<typeof menuSchema>;

export const circuitSchema = z
  .object({
    nom: z.string().trim().min(2, "Nom requis"),
    description: z.string().optional(),
    vehiculeId: z.number().int().positive().optional(),
    heureDepart: z.string().min(1, "Heure départ requise"),
    heureRetour: z.string().min(1, "Heure retour requise"),
  })
  .refine((v) => v.heureRetour > v.heureDepart, {
    message: "Heure retour doit être après heure départ",
    path: ["heureRetour"],
  });

export type CircuitFormValues = z.infer<typeof circuitSchema>;

export const bourseSchema = z.object({
  studentId: z.coerce.number().int().positive("Élève requis"),
  label: z.string().trim().min(3, "Libellé requis (min 3 caractères)"),
  montant: z.coerce.number().positive("Montant > 0"),
  anneeScolaire: z.string().trim().min(1, "Année requise"),
  type: z.string().optional(),
  pourcentage: z.number().nullable().optional(),
  statut: z.string().optional(),
  dateDebut: z.string().nullable().optional(),
  dateFin: z.string().nullable().optional(),
  motif: z.string().optional(),
});

export type BourseFormValues = z.infer<typeof bourseSchema>;
