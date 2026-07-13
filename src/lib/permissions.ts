import type { UserRole } from "@/types/auth";

/**
 * Mirror of backend's `Permission` enum — keep in sync with
 * `school-system-back/src/main/java/com/schoolSys/schooolSys/auth/Permission.java`.
 */
export type Permission =
  // Students
  | "READ_STUDENTS" | "WRITE_STUDENTS" | "DELETE_STUDENTS"
  // Teachers
  | "READ_TEACHERS" | "WRITE_TEACHERS" | "DELETE_TEACHERS" | "MANAGE_TEACHERS"
  // Notes / Examens
  | "READ_NOTES" | "WRITE_NOTES"
  // Absences
  | "READ_ABSENCES" | "WRITE_ABSENCES"
  // Finance
  | "READ_FINANCE" | "WRITE_FINANCE" | "MANAGE_FACTURES"
  // Emploi du temps
  | "READ_EMPLOI_DU_TEMPS" | "WRITE_EMPLOI_DU_TEMPS"
  // Discipline
  | "READ_DISCIPLINE" | "WRITE_DISCIPLINE"
  // Messaging
  | "READ_MESSAGES" | "WRITE_MESSAGES"
  // Bulletins
  | "READ_BULLETINS" | "GENERATE_BULLETINS"
  // User & role management
  | "MANAGE_USERS" | "MANAGE_ROLES"
  // School settings
  | "MANAGE_SETTINGS" | "MANAGE_SCHOOL"
  // Audit
  | "READ_AUDIT"
  // Academic year
  | "MANAGE_ANNEE_SCOLAIRE"
  // Reports & analytics
  | "READ_RAPPORTS" | "VIEW_REPORTS"
  // Communication
  | "MANAGE_COMMUNICATION"
  // Inscriptions
  | "MANAGE_INSCRIPTIONS"
  // Vie scolaire
  | "MANAGE_BIBLIOTHEQUE" | "MANAGE_TRANSPORT" | "MANAGE_CANTINE"
  // Pédagogie
  | "MANAGE_DEVOIRS" | "MANAGE_QUIZ"
  // RH
  | "MANAGE_RH"
  // Multi-tenant (SUPER_ADMIN only)
  | "MANAGE_TENANTS"
  // Parent portal
  | "PARENT_ACCESS";

/**
 * Mirror of backend's `RolePermissions.java` matrix.
 * IMPORTANT: keep in sync with the backend; the backend remains the source of truth
 * for security — the frontend only uses this for UX (hide buttons, filter nav).
 */
const ALL_PERMISSIONS: Permission[] = [
  "READ_STUDENTS", "WRITE_STUDENTS", "DELETE_STUDENTS",
  "READ_TEACHERS", "WRITE_TEACHERS", "DELETE_TEACHERS", "MANAGE_TEACHERS",
  "READ_NOTES", "WRITE_NOTES",
  "READ_ABSENCES", "WRITE_ABSENCES",
  "READ_FINANCE", "WRITE_FINANCE", "MANAGE_FACTURES",
  "READ_EMPLOI_DU_TEMPS", "WRITE_EMPLOI_DU_TEMPS",
  "READ_DISCIPLINE", "WRITE_DISCIPLINE",
  "READ_MESSAGES", "WRITE_MESSAGES",
  "READ_BULLETINS", "GENERATE_BULLETINS",
  "MANAGE_USERS", "MANAGE_ROLES",
  "MANAGE_SETTINGS", "MANAGE_SCHOOL",
  "READ_AUDIT",
  "MANAGE_ANNEE_SCOLAIRE",
  "READ_RAPPORTS", "VIEW_REPORTS",
  "MANAGE_COMMUNICATION",
  "MANAGE_INSCRIPTIONS",
  "MANAGE_BIBLIOTHEQUE", "MANAGE_TRANSPORT", "MANAGE_CANTINE",
  "MANAGE_DEVOIRS", "MANAGE_QUIZ",
  "MANAGE_RH",
  "MANAGE_TENANTS",
  "PARENT_ACCESS",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== "MANAGE_TENANTS"),
  DIRECTEUR: [
    "READ_STUDENTS", "WRITE_STUDENTS", "DELETE_STUDENTS",
    "READ_TEACHERS", "WRITE_TEACHERS", "DELETE_TEACHERS", "MANAGE_TEACHERS",
    "READ_NOTES", "WRITE_NOTES",
    "READ_ABSENCES", "WRITE_ABSENCES",
    "READ_FINANCE", "WRITE_FINANCE",
    "READ_EMPLOI_DU_TEMPS", "WRITE_EMPLOI_DU_TEMPS",
    "READ_DISCIPLINE", "WRITE_DISCIPLINE",
    "READ_MESSAGES", "WRITE_MESSAGES",
    "READ_BULLETINS", "GENERATE_BULLETINS",
    "MANAGE_ANNEE_SCOLAIRE",
    "READ_AUDIT",
    "READ_RAPPORTS", "VIEW_REPORTS",
    "MANAGE_SETTINGS", "MANAGE_COMMUNICATION", "MANAGE_INSCRIPTIONS",
    "MANAGE_BIBLIOTHEQUE", "MANAGE_TRANSPORT", "MANAGE_CANTINE",
    "MANAGE_DEVOIRS", "MANAGE_QUIZ", "MANAGE_RH",
  ],
  ENSEIGNANT: [
    "READ_STUDENTS",
    "READ_NOTES", "WRITE_NOTES",
    "READ_ABSENCES", "WRITE_ABSENCES",
    "READ_EMPLOI_DU_TEMPS",
    "READ_DISCIPLINE",
    "READ_MESSAGES", "WRITE_MESSAGES",
    "READ_BULLETINS",
    "MANAGE_DEVOIRS", "MANAGE_QUIZ",
  ],
  COMPTABLE: [
    "READ_STUDENTS",
    "READ_FINANCE", "WRITE_FINANCE", "MANAGE_FACTURES",
    "READ_RAPPORTS",
  ],
  PARENT: [
    "READ_STUDENTS",
    "READ_NOTES",
    "READ_ABSENCES",
    "READ_EMPLOI_DU_TEMPS",
    "READ_MESSAGES", "WRITE_MESSAGES",
    "READ_BULLETINS",
    "READ_FINANCE",
    "PARENT_ACCESS",
  ],
};

export function getPermissionsForRole(role: UserRole | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function roleHasAnyPermission(role: UserRole | null | undefined, perms: Permission[]): boolean {
  if (perms.length === 0) return true;
  const granted = getPermissionsForRole(role);
  return perms.some((p) => granted.includes(p));
}
