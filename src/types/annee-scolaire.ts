export interface AnneeScolaire {
  id: string;
  label: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
  cloturee: boolean;
}

export interface Trimestre {
  id: string;
  anneeScolaireId: string;
  numero: number;
  label: string;
  dateDebut: string;
  dateFin: string;
  saisieNotesOuverte: boolean;
}

export interface Vacance {
  id: string;
  anneeScolaireId: string;
  label: string;
  dateDebut: string;
  dateFin: string;
}

export interface JourFerie {
  id: string;
  anneeScolaireId: string;
  label: string;
  date: string;
}
