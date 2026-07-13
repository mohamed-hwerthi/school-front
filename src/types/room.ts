export type RoomType =
  | "Salle de classe"
  | "Laboratoire"
  | "Salle informatique"
  | "Bibliothèque"
  | "Salle de sport"
  | "Salle polyvalente";

export type RoomStatus = "Disponible" | "Occupée" | "En maintenance";

export type Room = {
  id: string;
  nom: string;
  type: RoomType;
  capacite: number;
  etage: number;
  equipements: string[];
  statut: RoomStatus;
};

export type TimeSlot = {
  id: string;
  salleId: string;
  jour: Jour;
  heureDebut: string;
  heureFin: string;
  matiere: string;
  enseignant: string;
  classe: string;
  niveau: string;
};

export type Jour = "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi" | "Samedi";

export const JOURS: Jour[] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const HEURES = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

export const ROOM_TYPES: RoomType[] = [
  "Salle de classe",
  "Laboratoire",
  "Salle informatique",
  "Bibliothèque",
  "Salle de sport",
  "Salle polyvalente",
];

export const ROOM_STATUTS: RoomStatus[] = ["Disponible", "Occupée", "En maintenance"];

export const MATIERES = [
  "Mathématiques",
  "Français",
  "Arabe",
  "Sciences",
  "Histoire-Géo",
  "Éducation islamique",
  "Éducation physique",
  "Informatique",
  "Arts plastiques",
  "Musique",
];
