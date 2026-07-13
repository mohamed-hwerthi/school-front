export type Student = {
  id: string;
  nom: string;
  prenom: string;
  nomAr: string;
  prenomAr: string;
  classe: string;
  niveau: string;
  sexe: "M" | "F";
  dateNaissance: string;
  lieuNaissance: string;
  adresse: string;
  matricule: string;
  email?: string;
  dateInscription: string;
  statut: "Actif" | "Inactif" | "En attente";
  estBloque: boolean;
  nomParent: string;
  prenomParent: string;
  telephoneParent: string;
  emailParent: string;
  notes?: string;
};

export const STATUTS = ["Actif", "Inactif", "En attente"] as const;
