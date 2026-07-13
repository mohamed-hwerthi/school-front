export type VehiculeStatut = 'ACTIF' | 'EN_PANNE' | 'EN_MAINTENANCE';

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque?: string;
  modele?: string;
  capacite: number;
  chauffeurNom?: string;
  chauffeurTelephone?: string;
  dateAssurance?: string;
  dateControleTechnique?: string;
  statut: VehiculeStatut;
  createdAt: string;
  updatedAt: string;
}

export interface Arret {
  id?: string;
  circuitId?: string;
  nom: string;
  adresse?: string;
  ordre: number;
  heurePassage?: string;
  latitude?: number;
  longitude?: number;
}

export interface Circuit {
  id: string;
  nom: string;
  description?: string;
  vehiculeId?: string;
  vehiculeImmatriculation?: string;
  heureDepart?: string;
  heureRetour?: string;
  distanceKm?: number;
  coutMensuel?: number;
  actif: boolean;
  arrets: Arret[];
  nbEleves?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AffectationTransport {
  id: string;
  eleveId: string;
  circuitId: string;
  circuitNom?: string;
  arretId?: string;
  arretNom?: string;
  anneeScolaire: string;
  actif: boolean;
  createdAt: string;
}

export interface TransportStats {
  totalCircuits: number;
  totalVehicules: number;
  totalEleves: number;
  tauxRemplissage: number;
}

export interface CreateCircuitRequest {
  nom: string;
  description?: string;
  vehiculeId?: string;
  heureDepart?: string;
  heureRetour?: string;
  distanceKm?: number;
  coutMensuel?: number;
  arrets?: Arret[];
}

export interface CreateAffectationRequest {
  eleveId: string;
  circuitId: string;
  arretId?: string;
  anneeScolaire: string;
}
