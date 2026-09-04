import api from "./axios";

/**
 * Compte du portail rattaché à un élève.
 * Identifiant = matricule de l'élève : un parent de 2 enfants a 2 comptes.
 */
export interface PortalAccount {
  exists: boolean;
  username: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  parentEmail: string | null;
  active: boolean | null;
  mustChangePassword: boolean | null;
  /** Mot de passe provisoire, lisible tant que le parent ne l'a pas changé. */
  password: string | null;
  passwordVisible: boolean;
  locked: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  /** "NO_MATRICULE" quand l'élève n'a pas de matricule. */
  blockedReason: string | null;
}

export interface PortalCredentials {
  username: string;
  password: string;
  studentName: string;
  /** Email parent de la fiche élève, null s'il n'y en a pas. */
  parentEmail: string | null;
  /** false si pas d'email parent, envoi SMTP en échec, ou envoi désactivé (dev). */
  emailSent: boolean;
}

const base = (studentId: string) => `/students/${studentId}/portal-account`;

export const portalAccountApi = {
  get: async (studentId: string): Promise<PortalAccount> => {
    const res = await api.get<PortalAccount>(base(studentId));
    return res.data;
  },

  create: async (studentId: string): Promise<PortalCredentials> => {
    const res = await api.post<PortalCredentials>(base(studentId));
    return res.data;
  },

  resetPassword: async (studentId: string): Promise<PortalCredentials> => {
    const res = await api.post<PortalCredentials>(`${base(studentId)}/reset-password`);
    return res.data;
  },

  /** Renvoie les identifiants en cours par email, sans changer le mot de passe. */
  sendCredentials: async (studentId: string): Promise<PortalCredentials> => {
    const res = await api.post<PortalCredentials>(`${base(studentId)}/send-credentials`);
    return res.data;
  },

  setActive: async (studentId: string, active: boolean): Promise<PortalAccount> => {
    const res = await api.patch<PortalAccount>(`${base(studentId)}/active?active=${active}`);
    return res.data;
  },
};
