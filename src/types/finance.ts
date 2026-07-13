export type TypeFrais = {
  id: string;
  nom: string;
  montantMensuel: number;
  description: string;
  actif: boolean;
};

export type StatutPaiement = "Payé" | "Partiel" | "En attente" | "En retard";
export type ModePaiement = "Espèces" | "Virement" | "Chèque" | "Carte bancaire" | "Prélèvement";
export type TypeCommunication = "SMS" | "Email" | "Appel";

export type Paiement = {
  id: string;
  eleveId: string;
  typeFraisId: string;
  mois: string;
  montantDu: number;
  montantPaye: number;
  datePaiement: string | null;
  modePaiement: ModePaiement | null;
  statut: StatutPaiement;
  reference: string;
  notes: string;
};

export type Communication = {
  id: string;
  eleveId: string;
  type: TypeCommunication;
  objet: string;
  contenu: string;
  date: string;
  statut: "Envoyé" | "Échoué" | "En attente";
};

export const MODES_PAIEMENT: ModePaiement[] = [
  "Espèces",
  "Virement",
  "Chèque",
  "Carte bancaire",
  "Prélèvement",
];

export const STATUTS_PAIEMENT: StatutPaiement[] = [
  "Payé",
  "Partiel",
  "En attente",
  "En retard",
];

export const MOIS_SCOLAIRES = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const;

export const MOIS_LABELS: Record<string, string> = {
  Sep: "Septembre",
  Oct: "Octobre",
  Nov: "Novembre",
  Dec: "Décembre",
  Jan: "Janvier",
  Feb: "Février",
  Mar: "Mars",
  Apr: "Avril",
  May: "Mai",
  Jun: "Juin",
};
