export type NotificationType = 'INFO' | 'WARNING' | 'ALERT' | 'FINANCE' | 'ABSENCE' | 'NOTE' | 'DISCIPLINE';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export type AnnonceType = 'GENERAL' | 'URGENT' | 'EVENEMENT' | 'REUNION';
export type DestinatairesType = 'TOUS' | 'PARENTS' | 'ENSEIGNANTS' | 'ELEVES' | 'CLASSE';

export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  type: AnnonceType;
  destinataires: DestinatairesType;
  classeId?: string;
  auteurId?: string;
  auteurName?: string;
  datePublication: string;
  dateExpiration?: string;
  actif: boolean;
  createdAt: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  classe: string;
  niveau: string;
  matricule?: string;
}
