export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTEUR' | 'ENSEIGNANT' | 'COMPTABLE' | 'PARENT';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantSlug?: string;
  isActive: boolean;
  /** Granted permissions (populated by /auth/me; empty for cached login response). */
  permissions?: string[];
  /** Class IDs the user can see — for ENSEIGNANT row-level scoping. */
  scopedClasseIds?: string[];
  /** Student IDs the user can see — for PARENT row-level scoping. */
  scopedStudentIds?: string[];
}

/** Raw shape returned by GET /api/auth/me (data field of ApiResponse). */
export interface MeResponse {
  user: Omit<AuthUser, "permissions" | "scopedClasseIds" | "scopedStudentIds">;
  permissions: string[];
  scopedClasseIds: string[];
  scopedStudentIds: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
  // 2FA fields
  twoFactorRequired: boolean;
  twoFactorUserId: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// 2FA types
export interface Enable2FAResponse {
  secret: string;
  qrCodeUri: string;
}

export interface Verify2FARequest {
  code: string;
}

export interface Verify2FALoginRequest {
  userId: string;
  code: string;
}

// Session management types
export interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}
