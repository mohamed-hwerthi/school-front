export type GraviteType = 'LEGERE' | 'MOYENNE' | 'GRAVE' | 'TRES_GRAVE';

export type TypeIncident =
  | 'BAGARRE'
  | 'INSOLENCE'
  | 'VANDALISME'
  | 'TRICHERIE'
  | 'RETARD_REPETE'
  | 'ABSENCE_INJUSTIFIEE'
  | 'AUTRE';

export type TypeSanction =
  | 'AVERTISSEMENT'
  | 'BLAME'
  | 'EXCLUSION_TEMPORAIRE'
  | 'EXCLUSION_DEFINITIVE'
  | 'TRAVAIL_SUPPLEMENTAIRE'
  | 'CONVOCATION_PARENT';

export type StatutSanction = 'ACTIVE' | 'LEVEE' | 'EXPIREE';

export interface IncidentEleve {
  id?: string;
  eleveId: string;
  roleEleve?: string;
}

export interface Incident {
  id: string;
  titre: string;
  description?: string;
  date: string;
  type: TypeIncident;
  gravite: GraviteType;
  lieu?: string;
  signaleParId?: string;
  elevesImpliques: IncidentEleve[];
  createdAt: string;
  updatedAt?: string;
}

export interface Sanction {
  id: string;
  incidentId?: string;
  eleveId: string;
  eleveNom?: string;
  typeSanction: TypeSanction;
  description?: string;
  dateDebut: string;
  dateFin?: string;
  notifieParent: boolean;
  niveau: number;
  statut: StatutSanction;
  approuvePar?: number;
  commentaireApprobation?: string;
  createdAt: string;
}

export interface SanctionSuggestion {
  eleveId: string;
  currentMaxNiveau: number;
  suggestedNiveau: number;
  suggestedType: TypeSanction;
  requiresApproval: boolean;
  activeSanctionsCount: number;
}

export interface EvenementDisciplinaire {
  date: string;
  type: 'INCIDENT' | 'SANCTION';
  description: string;
  gravite?: string;
  niveau?: number;
  statut?: string;
  id: string;
}

export interface DossierDisciplinaire {
  eleveId: string;
  eleveNom?: string;
  totalIncidents: number;
  totalSanctions: number;
  niveauActuel: number;
  timeline: EvenementDisciplinaire[];
}
