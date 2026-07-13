export type TypeAction = "Création" | "Modification" | "Suppression" | "Connexion" | "Export" | "Import" | "Paiement" | "Communication";

export type ModuleAction = "Élèves" | "Enseignants" | "Finance" | "Salles" | "Configuration" | "Évaluations" | "Circulaires" | "Rapports" | "Système";

export type ActionLog = {
  id: string;
  type: TypeAction;
  module: ModuleAction;
  description: string;
  utilisateur: string;
  date: string;
  heure: string;
  details: string;
  ipAddress: string;
};

export const TYPES_ACTION: TypeAction[] = [
  "Création",
  "Modification",
  "Suppression",
  "Connexion",
  "Export",
  "Import",
  "Paiement",
  "Communication",
];

export const MODULES_ACTION: ModuleAction[] = [
  "Élèves",
  "Enseignants",
  "Finance",
  "Salles",
  "Configuration",
  "Évaluations",
  "Circulaires",
  "Rapports",
  "Système",
];
