import api from "./axios";

/**
 * Compte de connexion rattaché à un enseignant.
 * Identifiant = matricule de l'enseignant (ENS-2026-00042).
 */
export interface TeacherAccount {
  exists: boolean;
  username: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  active: boolean | null;
  mustChangePassword: boolean | null;
  /** Mot de passe provisoire, lisible tant que l'enseignant ne l'a pas changé. */
  password: string | null;
  passwordVisible: boolean;
  locked: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  /** "NO_MATRICULE" quand l'enseignant n'a pas de matricule. */
  blockedReason: string | null;
}

export interface TeacherCredentials {
  username: string;
  password: string;
  teacherName: string;
  /** Email de la fiche enseignant, null s'il n'y en a pas. */
  email: string | null;
  /** false si pas d'email, envoi SMTP en échec, ou envoi désactivé (dev). */
  emailSent: boolean;
}

const base = (teacherId: string) => `/teachers/${teacherId}/account`;

export const teacherAccountApi = {
  get: async (teacherId: string): Promise<TeacherAccount> => {
    const res = await api.get<TeacherAccount>(base(teacherId));
    return res.data;
  },

  create: async (teacherId: string): Promise<TeacherCredentials> => {
    const res = await api.post<TeacherCredentials>(base(teacherId));
    return res.data;
  },

  resetPassword: async (teacherId: string): Promise<TeacherCredentials> => {
    const res = await api.post<TeacherCredentials>(`${base(teacherId)}/reset-password`);
    return res.data;
  },

  /** Renvoie les identifiants en cours par email, sans changer le mot de passe. */
  sendCredentials: async (teacherId: string): Promise<TeacherCredentials> => {
    const res = await api.post<TeacherCredentials>(`${base(teacherId)}/send-credentials`);
    return res.data;
  },

  setActive: async (teacherId: string, active: boolean): Promise<TeacherAccount> => {
    const res = await api.patch<TeacherAccount>(`${base(teacherId)}/active?active=${active}`);
    return res.data;
  },
};
