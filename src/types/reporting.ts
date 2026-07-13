export interface DayAttendance {
  jour: string;
  presents: number;
  absents: number;
}

export interface UpcomingEvent {
  id: string;
  titre: string;
  dateDebut: string;
  couleur: string | null;
  type: string | null;
  lieu: string | null;
}

export interface RecentStudent {
  id: string;
  fullName: string;
  classe: string | null;
  enrollmentDate: string | null;
  statut: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalRevenue: number;
  totalPending: number;
  tauxRecouvrement: number;
  tauxAbsence: number;
  moyenneGenerale: number;
  studentsByNiveau: Record<string, number>;
  absencesToday: number;
  newEnrollmentsThisMonth: number;
  eventsThisMonth: number;
  weeklyAttendance: DayAttendance[];
  upcomingEvents: UpcomingEvent[];
  recentStudents: RecentStudent[];
}

export interface MonthlyTrend {
  month: string;
  inscriptions: number;
  paiements: number;
  absences: number;
}
