/** Organisation des classes de la rentrée suivante (ANN-052). */

export interface RepartitionEleve {
  studentId: string;
  studentName: string;
  sexe: string | null;
  /** Classe de l'année écoulée (ex. "1A"). */
  ancienneClasse: string | null;
  /** Classe d'accueil déjà enregistrée — null tant qu'elle ne l'est pas. */
  classeAffectee: string | null;
  /** Proposition automatique, à confirmer ou à modifier. */
  classeProposee: string | null;
}

/** Une classe d'accueil possible et sa capacité. */
export interface ClasseCible {
  classeId: string;
  /** Nom affiché (ex. "2A"). */
  nom: string;
  /** Section (ex. "A"). */
  letter: string;
  /** Capacité d'accueil ; null = non plafonnée. */
  capacite: number | null;
}

export interface RepartitionNiveau {
  niveauId: string | null;
  niveauNom: string;
  /** Classes ouvertes au niveau d'accueil, avec leur capacité. */
  classes: ClasseCible[];
  eleves: RepartitionEleve[];
}

export interface Repartition {
  anneeScolaire: string;
  niveaux: RepartitionNiveau[];
  /** Élèves promus vers un niveau sans aucune classe configurée. */
  nonRepartissables: number;
}

export interface RepartitionRequest {
  anneeScolaire: string;
  affectations: { studentId: string; classe: string }[];
}

export interface RepartitionResult {
  nbAffectes: number;
  nbIgnores: number;
  message: string;
}
