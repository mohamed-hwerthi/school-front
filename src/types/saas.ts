export interface TenantOnboardingRequest {
  schoolName: string;
  schoolNameAr: string;
  delegationRegionale: string;
  delegationRegionaleAr: string;
  slug: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  plan: string;
  contactPhone?: string;
}

export interface TenantPlan {
  plan: string;
  maxStudents: number;
  maxTeachers: number;
  maxStorageMb: number;
  monthlyRate: number;
  features: string[];
}

export interface TenantBilling {
  billingEmail: string;
  billingCycle: string;
  nextBillingDate: string;
  monthlyRate: number;
}

export interface TenantUsage {
  currentStudents: number;
  maxStudents: number;
  currentTeachers: number;
  maxTeachers: number;
  storageUsedMb: number;
  maxStorageMb: number;
}

export interface SuperAdminDashboard {
  totalTenants: number;
  activeTenants: number;
  totalStudentsAllTenants: number;
  revenueMonthly: number;
  tenantsByPlan: Record<string, number>;
}

export interface TenantResponse {
  id: string;
  name: string;
  schemaName: string;
  slug: string;
  contactEmail: string;
  active: boolean;
  createdAt: string;
  plan: string;
  maxStudents: number;
  maxTeachers: number;
  maxStorageMb: number;
  billingEmail: string;
  billingCycle: string;
  nextBillingDate: string;
  monthlyRate: number;
  trialEndsAt: string;
  onboardingCompleted: boolean;
}
