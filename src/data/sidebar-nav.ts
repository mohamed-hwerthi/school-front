import {
  Home,
  Users,
  UserCog,
  Calendar,
  FileText,
  Newspaper,
  BookOpen,
  Settings,
  DollarSign,
  TrendingDown,
  Wallet,
  Eye,
  PieChart,
  School,
  BadgePercent,
  Bell,
  BarChart3,
  Vault,
  UserCheck,
  Clock,
  AlertTriangle,
  GraduationCap,
  Receipt,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ShieldCheck,
  Palette,
  Printer,
  TrendingUp,
  Activity,
  Megaphone,
  BellRing,
  ClipboardList,
  Library,
  Bus,
  UtensilsCrossed,
  PenTool,
  FileQuestion,
  UserPlus,
  Banknote,
  Award,
  FileDown,
  Target,
  Lock,
} from "lucide-react";

/**
 * RBAC convention for this file:
 * - `roles` on a section is the gate for the WHOLE section (header + items).
 * - `roles` on an item further restricts that item within an already-allowed section.
 * - Omitting `roles` means the entry is visible to EVERY authenticated role.
 *   Use this only for entries that genuinely make sense for all 6 roles
 *   (SUPER_ADMIN, ADMIN, DIRECTEUR, ENSEIGNANT, COMPTABLE, PARENT).
 * - The values must match the backend `UserRole` enum exactly
 *   (school-system-back/.../auth/UserRole.java).
 */
export type NavItem = {
  title: string;
  titleKey: string;
  icon: React.ElementType;
  url: string;
  roles?: string[];
};

export type NavSection = {
  label: string;
  labelKey: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
  roles?: string[];
};

export const sidebarSections: NavSection[] = [
  {
    label: "Accueil",
    labelKey: "nav.home",
    icon: Home,
    color: "text-blue-500",
    items: [
      { title: "Tableau de bord", titleKey: "nav.dashboard", icon: Home, url: "/dashboard" },
      { title: "Mon école", titleKey: "nav.mySchool", icon: School, url: "/dashboard/ecole", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
      { title: "Portail Parent", titleKey: "nav.parentPortal", icon: GraduationCap, url: "/dashboard/portail-parent", roles: ["PARENT"] },
    ],
  },
  {
    label: "Scolarité",
    labelKey: "nav.schooling",
    icon: Users,
    color: "text-emerald-500",
    items: [
      { title: "Élèves", titleKey: "nav.students", icon: Users, url: "/dashboard/eleves", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"] },
      { title: "Inscriptions", titleKey: "nav.inscriptions", icon: ClipboardList, url: "/dashboard/inscriptions", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
      { title: "Appel", titleKey: "nav.absences", icon: UserCheck, url: "/dashboard/absences/feuilles", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"] },
      { title: "Discipline", titleKey: "nav.discipline", icon: AlertTriangle, url: "/dashboard/discipline", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"] },
      { title: "Calendrier", titleKey: "nav.calendar", icon: CalendarClock, url: "/dashboard/calendrier", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT", "COMPTABLE"] },
      { title: "Niveaux & Classes", titleKey: "nav.levelsClasses", icon: GraduationCap, url: "/dashboard/config/niveaux", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
    ],
  },
  {
    label: "Enseignants & RH",
    labelKey: "nav.teachersHR",
    icon: Briefcase,
    color: "text-cyan-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Enseignants", titleKey: "nav.teachers", icon: UserCog, url: "/dashboard/enseignants" },
      { title: "Personnel", titleKey: "nav.personnel", icon: Users, url: "/dashboard/personnel" },
      { title: "Affectations", titleKey: "nav.assignments", icon: ClipboardList, url: "/dashboard/affectations" },
      { title: "Contrats & Congés", titleKey: "nav.contractsLeaves", icon: Briefcase, url: "/dashboard/contrats" },
      { title: "Paie", titleKey: "nav.payroll", icon: Banknote, url: "/dashboard/rh/paie" },
      { title: "Formations", titleKey: "nav.training", icon: Award, url: "/dashboard/rh/formations" },
      { title: "Évaluations", titleKey: "nav.teacherEvaluations", icon: UserCog, url: "/dashboard/teacher-evaluations" },
    ],
  },
  {
    label: "Pédagogie",
    labelKey: "nav.pedagogy",
    icon: BookOpen,
    color: "text-purple-500",
    items: [
      { title: "Devoirs", titleKey: "nav.homework", icon: PenTool, url: "/dashboard/devoirs", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"] },
      { title: "Carnets de notes", titleKey: "nav.gradeBooks", icon: BookOpen, url: "/dashboard/carnets", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT", "PARENT"] },
    ],
  },
  {
    label: "Bulletins",
    labelKey: "nav.bulletins",
    icon: Printer,
    color: "text-indigo-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Impression masse", titleKey: "nav.bulkPrint", icon: Printer, url: "/dashboard/bulletins-masse" },
      { title: "Stats réussite", titleKey: "nav.successStats", icon: TrendingUp, url: "/dashboard/stats-reussite" },
      { title: "Comparatif", titleKey: "nav.comparative", icon: Activity, url: "/dashboard/comparatif" },
    ],
  },
  {
    label: "Année scolaire",
    labelKey: "nav.schoolYear",
    icon: CalendarClock,
    color: "text-orange-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Année scolaire", titleKey: "nav.schoolYear", icon: CalendarClock, url: "/dashboard/annee-scolaire" },
      { title: "Réinscriptions", titleKey: "nav.reEnrollment", icon: UserPlus, url: "/dashboard/reinscriptions" },
      { title: "Conseil de classe", titleKey: "nav.classCouncil", icon: GraduationCap, url: "/dashboard/conseil-classe" },
      { title: "Bulletins annuels", titleKey: "nav.annualBulletins", icon: FileText, url: "/dashboard/bulletins-annuels" },
      { title: "Clôture d'année", titleKey: "nav.yearClosure", icon: Lock, url: "/dashboard/cloture" },
      { title: "Bilan annuel", titleKey: "nav.annualReview", icon: BarChart3, url: "/dashboard/bilan-annuel" },
    ],
  },
  {
    label: "Emploi du temps",
    labelKey: "nav.schedule",
    icon: CalendarDays,
    color: "text-sky-500",
    items: [
      { title: "Emploi du temps", titleKey: "nav.schedule", icon: Clock, url: "/dashboard/emploi-du-temps", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT", "PARENT"] },
      { title: "Volume horaire", titleKey: "nav.weeklyVolume", icon: Clock, url: "/dashboard/volume-horaire", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
      { title: "Salles", titleKey: "nav.rooms", icon: Calendar, url: "/dashboard/emploi-salles", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
    ],
  },
  {
    label: "Quiz",
    labelKey: "nav.quiz",
    icon: FileQuestion,
    color: "text-fuchsia-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"],
    items: [
      { title: "Tous les Quiz", titleKey: "nav.allQuizzes", icon: ClipboardList, url: "/dashboard/quiz?tab=quizzes" },
      { title: "Constructeur", titleKey: "nav.quizBuilder", icon: PenTool, url: "/dashboard/quiz?tab=builder" },
      { title: "Résultats", titleKey: "nav.quizResults", icon: BarChart3, url: "/dashboard/quiz?tab=results" },
    ],
  },
  {
    label: "Vie scolaire",
    labelKey: "nav.schoolLife",
    icon: Library,
    color: "text-amber-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Transport", titleKey: "nav.transport", icon: Bus, url: "/dashboard/transport" },
      { title: "Cantine", titleKey: "nav.canteen", icon: UtensilsCrossed, url: "/dashboard/cantine" },
    ],
  },
  {
    label: "Finance",
    labelKey: "nav.finance",
    icon: DollarSign,
    color: "text-teal-500",
    roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "DIRECTEUR"],
    items: [
      { title: "Paiements", titleKey: "nav.payments", icon: DollarSign, url: "/dashboard/finance", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Dépenses", titleKey: "nav.expenses", icon: TrendingDown, url: "/dashboard/finance/depenses", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Trésorerie", titleKey: "nav.treasury", icon: Wallet, url: "/dashboard/finance/tresorerie", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Caisse", titleKey: "nav.cashRegister", icon: Vault, url: "/dashboard/finance/caisse", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Factures", titleKey: "nav.invoices", icon: Receipt, url: "/dashboard/factures", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Remises", titleKey: "nav.discounts", icon: BadgePercent, url: "/dashboard/finance/remises-penalites", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Relances", titleKey: "nav.reminders", icon: Bell, url: "/dashboard/finance/relances", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      { title: "Rapports", titleKey: "nav.reports", icon: BarChart3, url: "/dashboard/finance/rapports", roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "DIRECTEUR"] },
    ],
  },
  {
    label: "Communication",
    labelKey: "nav.communication",
    icon: Megaphone,
    color: "text-rose-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT", "PARENT"],
    items: [
      { title: "Annonces", titleKey: "nav.announcements", icon: Megaphone, url: "/dashboard/annonces" },
      { title: "Reunions", titleKey: "nav.meetings", icon: CalendarDays, url: "/dashboard/reunions" },
      { title: "Circulaires", titleKey: "nav.circulars", icon: Newspaper, url: "/dashboard/circulaires", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
    ],
  },
  {
    label: "Analytics",
    labelKey: "nav.analytics",
    icon: Target,
    color: "text-violet-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"],
    items: [
      { title: "Dashboard", titleKey: "nav.analyticsDashboard", icon: Target, url: "/dashboard/analytics", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
      { title: "Suivi élève", titleKey: "nav.studentTracking", icon: Users, url: "/dashboard/suivi-eleve" },
      { title: "Statistiques", titleKey: "nav.statistics", icon: PieChart, url: "/dashboard/statistique", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"] },
    ],
  },
  {
    label: "Documents",
    labelKey: "nav.documents",
    icon: FileText,
    color: "text-slate-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Génération", titleKey: "nav.generation", icon: FileDown, url: "/dashboard/documents" },
      { title: "Vitrine web", titleKey: "nav.webShowcase", icon: Eye, url: "/dashboard/vitrine" },
    ],
  },
  {
    label: "Administration",
    labelKey: "nav.administration",
    icon: Settings,
    color: "text-gray-500",
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"],
    items: [
      { title: "Utilisateurs", titleKey: "nav.users", icon: ShieldCheck, url: "/dashboard/utilisateurs" },
      { title: "Configuration", titleKey: "nav.configuration", icon: Settings, url: "/dashboard/configuration", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];
