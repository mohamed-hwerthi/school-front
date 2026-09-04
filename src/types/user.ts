import type { UserRole } from './auth';

export interface UserItem {
  id: string;
  /** null pour les comptes portail rattachés à un élève. */
  email: string | null;
  /** Identifiant de connexion des comptes portail : le matricule de l'élève. */
  username?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
}
