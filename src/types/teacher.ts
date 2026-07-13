export type Teacher = {
  id: string;
  nom: string;
  prenom: string;
  sexe: "M" | "F";
  specialite: string;
  telephone: string;
  email: string;
  dateNaissance: string;
  dateEmbauche: string;
  statut: "Actif" | "Inactif" | "En attente";
};

export const SPECIALITES = [
  "Mathématiques",
  "Français",
  "Arabe",
  "Sciences",
  "Histoire-Géographie",
  "Éducation islamique",
  "Éducation physique",
  "Anglais",
  "Informatique",
  "Arts plastiques",
];

export const STATUTS_ENSEIGNANT = ["Actif", "Inactif", "En attente"] as const;
