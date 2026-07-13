export interface SuiviEleve {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  moyenneParTrimestre: number[];
  totalAbsences: number;
  totalRetards: number;
  totalIncidents: number;
  paiementsStatus: string;
  scoreRisque: number;
  niveauRisque: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
}

export interface ClasseStats {
  classeId: string;
  classeName: string;
  moyenne: number;
  tauxReussite: number;
  tauxPresence: number;
  effectif: number;
}

export interface ComparaisonClasses {
  classes: ClasseStats[];
}

export interface Kpi {
  nom: string;
  type: string;
  valeurActuelle: number;
  valeurCible: number;
  seuilAlerte: number;
  statut: "OK" | "ALERTE" | "CRITIQUE";
  tendance: "UP" | "DOWN" | "STABLE";
}

export interface Cohorte {
  anneeScolaire: string;
  effectifInitial: number;
  effectifFinal: number;
  tauxRetention: number;
  moyenneGenerale: number;
}

export interface KpiConfig {
  id: string;
  nom: string;
  description: string;
  type: string;
  valeurCible: number;
  seuilAlerte: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KpiConfigRequest {
  nom: string;
  description?: string;
  type: string;
  valeurCible: number;
  seuilAlerte: number;
  actif?: boolean;
}
