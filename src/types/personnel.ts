export type Personnel = {
  id: string;
  nom: string;
  prenom: string;
  fonction: string;
  sexe: "M" | "F";
  telephone: string;
  email: string;
  dateNaissance: string;
  dateEmbauche: string;
  statut: "Actif" | "Inactif" | "En attente";
};

/**
 * Common job titles proposed in the form. The field is free-form on the
 * backend, so "Autre" lets the user type any other role.
 */
export const FONCTIONS_PERSONNEL = [
  "Secrétaire",
  "Comptable",
  "Surveillant",
  "Gardien",
  "Femme de ménage",
  "Agent d'entretien",
  "Infirmier(ère)",
  "Chauffeur",
  "Documentaliste",
  "Cuisinier(ère)",
  "Magasinier",
  "Technicien",
] as const;

export const STATUTS_PERSONNEL = ["Actif", "Inactif", "En attente"] as const;
