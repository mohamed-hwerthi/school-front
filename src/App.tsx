import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RoleGuard } from "@/components/RoleGuard";
import type { UserRole } from "@/types/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSubdomainSlug } from "./lib/vitrine-routing";
import { AuthProvider } from "./hooks/useAuth";
import PrivateRoute from "./components/PrivateRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import DashboardLayout from "./components/layout/DashboardLayout";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";
import { TeachersProvider } from "./hooks/useTeachers";
import { MessagesProvider } from "./hooks/useMessages";
import { SchoolProvider } from "./hooks/useSchool";
import { AnneeProvider } from "./hooks/useAnneeContext";
import { Loader2 } from "lucide-react";

// Lazy loaded pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardByRole = lazy(() => import("./pages/DashboardByRole"));
const Students = lazy(() => import("./pages/Students"));
const AddStudent = lazy(() => import("./pages/AddStudent"));
const EditStudent = lazy(() => import("./pages/EditStudent"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentMessages = lazy(() => import("./pages/StudentMessages"));
const Teachers = lazy(() => import("./pages/Teachers"));
const Affectations = lazy(() => import("./pages/Affectations"));
const AddTeacher = lazy(() => import("./pages/AddTeacher"));
const EditTeacher = lazy(() => import("./pages/EditTeacher"));
const PersonnelPage = lazy(() => import("./pages/Personnel"));
const AddPersonnel = lazy(() => import("./pages/AddPersonnel"));
const EditPersonnel = lazy(() => import("./pages/EditPersonnel"));
const EmploiSalles = lazy(() => import("./pages/EmploiSalles"));
const AddRoom = lazy(() => import("./pages/AddRoom"));
const EditRoom = lazy(() => import("./pages/EditRoom"));
const Niveaux = lazy(() => import("./pages/Niveaux"));
const SchoolInfo = lazy(() => import("./pages/SchoolInfo"));
const FinancePaiement = lazy(() => import("./pages/FinancePaiement"));
const CarnetNotes = lazy(() => import("./pages/CarnetNotes"));
// const Rapports = lazy(() => import("./pages/Rapports"));
const Circulaires = lazy(() => import("./pages/Circulaires"));
const Configuration = lazy(() => import("./pages/Configuration"));
const Tracabilite = lazy(() => import("./pages/Tracabilite"));
const Statistiques = lazy(() => import("./pages/Statistiques"));
const Depenses = lazy(() => import("./pages/Depenses"));
const Tresorerie = lazy(() => import("./pages/Tresorerie"));
const RemisesPenalites = lazy(() => import("./pages/RemisesPenalites"));
const Relances = lazy(() => import("./pages/Relances"));
const RapportsFinanciers = lazy(() => import("./pages/RapportsFinanciers"));
const GestionCaisse = lazy(() => import("./pages/GestionCaisse"));

// Auth pages
const UsersPage = lazy(() => import("./pages/Users"));
const AbsencesPage = lazy(() => import("./pages/Absences"));
const AppelAbsencePage = lazy(() => import("./pages/AppelAbsence"));
const FeuillesJourPage = lazy(() => import("./pages/FeuillesJour"));
const FeuilleDetailsPage = lazy(() => import("./pages/FeuilleDetails"));
const EmploiDuTempsPage = lazy(() => import("./pages/EmploiDuTemps"));
const VolumeHorairePage = lazy(() => import("./pages/VolumeHoraire"));
const DisciplinePage = lazy(() => import("./pages/Discipline"));
const AnneeScolairePage = lazy(() => import("./pages/AnneeScolaire"));
const ConseilClassePage = lazy(() => import("./pages/ConseilClasse"));
const BilanAnnuelPage = lazy(() => import("./pages/BilanAnnuel"));
const ClotureAnneePage = lazy(() => import("./pages/ClotureAnnee"));
const ReinscriptionsPage = lazy(() => import("./pages/Reinscriptions"));
const ContratsPage = lazy(() => import("./pages/Contrats"));
const FacturesPage = lazy(() => import("./pages/Factures"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VitrineSite = lazy(() => import("./pages/VitrineSite"));
const VitrineAdminPage = lazy(() => import("./pages/VitrineAdmin"));

// Bulletin pages
const BulletinsMassePage = lazy(() => import("./pages/BulletinsMasse"));
const BulletinsAnnuelsPage = lazy(() => import("./pages/BulletinsAnnuels"));
const StatsReussitePage = lazy(() => import("./pages/StatsReussite"));
const ComparatifPerformancesPage = lazy(() => import("./pages/ComparatifPerformances"));

// Communication & Parent Portal
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const AnnoncesPage = lazy(() => import("./pages/Annonces"));
const ParentPortalPage = lazy(() => import("./pages/ParentPortal"));

// Board 13: Inscriptions
const InscriptionsPage = lazy(() => import("./pages/Inscriptions"));
const InscriptionPubliquePage = lazy(() => import("./pages/InscriptionPublique"));

// Board 14: Bibliothèque
const BibliothequePage = lazy(() => import("./pages/Bibliotheque"));

// Board 15: Transport
const TransportPage = lazy(() => import("./pages/Transport"));

// Board 16: Cantine
const CantinePage = lazy(() => import("./pages/Cantine"));

// Board 17: Devoirs & Ressources
const DevoirsPage = lazy(() => import("./pages/Devoirs"));

// Board 18: Examens en ligne
const QuizManagementPage = lazy(() => import("./pages/QuizManagement"));
const QuizPassationPage = lazy(() => import("./pages/QuizPassation"));

// Board 19: RH
const PaiePage = lazy(() => import("./pages/Paie"));
const FormationsPage = lazy(() => import("./pages/Formations"));
const TeacherEvaluationsPage = lazy(() => import("./pages/TeacherEvaluations"));

// Board 20: Documents
const GenerationDocumentsPage = lazy(() => import("./pages/GenerationDocuments"));

// Board 21: Intégrations
const IntegrationsPage = lazy(() => import("./pages/Integrations"));

// Meetings
const ReunionsPage = lazy(() => import("./pages/Reunions"));

// Board 22: Analytics
const AnalyticsDashboardPage = lazy(() => import("./pages/AnalyticsDashboard"));
const SuiviElevePage = lazy(() => import("./pages/SuiviEleve"));

// Calendar
const CalendrierPage = lazy(() => import("./pages/Calendrier"));

// Board 24: SaaS
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const SuperAdminDashboardPage = lazy(() => import("./pages/SuperAdminDashboard"));

const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ErrorBoundary>
);

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
const MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "DIRECTEUR"];
const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT"];
const FINANCE_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "COMPTABLE"];

/** Route with role guard */
const G = ({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) => (
  <RoleGuard roles={roles}><S>{children}</S></RoleGuard>
);

const subdomainVitrineSlug = getSubdomainSlug();

// Main application component with routing and providers
const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          {subdomainVitrineSlug ? (
            <Routes>
              <Route path="/" element={<Suspense fallback={<PageLoader />}><VitrineSite /></Suspense>} />
              <Route path="/inscription" element={<Suspense fallback={<PageLoader />}><InscriptionPubliquePage /></Suspense>} />
              <Route path="/:pageSlug" element={<Suspense fallback={<PageLoader />}><VitrineSite /></Suspense>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          ) : (
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
            <Route path="/forbidden" element={<Forbidden />} />
            {/* Public pages */}
            <Route path="/vitrine/:slug" element={<Suspense fallback={<PageLoader />}><VitrineSite /></Suspense>} />
            <Route path="/vitrine/:slug/:pageSlug" element={<Suspense fallback={<PageLoader />}><VitrineSite /></Suspense>} />
            <Route path="/inscription" element={<Suspense fallback={<PageLoader />}><InscriptionPubliquePage /></Suspense>} />
            {/* Quiz passation (student exam taking) */}
            <Route path="/quiz/:quizId" element={<Suspense fallback={<PageLoader />}><QuizPassationPage /></Suspense>} />
            {/* Super Admin — independent platform space, separate from /dashboard */}
            <Route
              path="/super-admin"
              element={
                <PrivateRoute>
                  <RoleGuard roles={["SUPER_ADMIN"]}>
                    <SuperAdminLayout />
                  </RoleGuard>
                </PrivateRoute>
              }
            >
              <Route index element={<S><SuperAdminDashboardPage /></S>} />
              <Route path="nouvelle-ecole" element={<S><OnboardingPage /></S>} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <SchoolProvider>
                    <AnneeProvider>
                    <MessagesProvider>
                      <TeachersProvider>
                          <DashboardLayout />
                      </TeachersProvider>
                    </MessagesProvider>
                    </AnneeProvider>
                  </SchoolProvider>
                </PrivateRoute>
              }
            >
              <Route index element={<S><DashboardByRole /></S>} />

              {/* Élèves — all staff + comptable can view */}
              <Route path="eleves" element={<G roles={[...STAFF_ROLES, "COMPTABLE"]}><Students /></G>} />
              <Route path="eleves/ajouter" element={<G roles={MANAGEMENT_ROLES}><AddStudent /></G>} />
              <Route path="eleves/modifier/:id" element={<G roles={MANAGEMENT_ROLES}><EditStudent /></G>} />
              <Route path="eleves/:id" element={<G roles={[...STAFF_ROLES, "COMPTABLE"]}><StudentProfile /></G>} />
              <Route path="eleves/:id/messages" element={<S><StudentMessages /></S>} />

              {/* Enseignants */}
              <Route path="enseignants" element={<G roles={MANAGEMENT_ROLES}><Teachers /></G>} />
              <Route path="enseignants/ajouter" element={<G roles={MANAGEMENT_ROLES}><AddTeacher /></G>} />
              <Route path="enseignants/modifier/:id" element={<G roles={MANAGEMENT_ROLES}><EditTeacher /></G>} />
              <Route path="affectations" element={<G roles={MANAGEMENT_ROLES}><Affectations /></G>} />
              <Route path="personnel" element={<G roles={MANAGEMENT_ROLES}><PersonnelPage /></G>} />
              <Route path="personnel/ajouter" element={<G roles={MANAGEMENT_ROLES}><AddPersonnel /></G>} />
              <Route path="personnel/modifier/:id" element={<G roles={MANAGEMENT_ROLES}><EditPersonnel /></G>} />

              {/* Absences */}
              <Route path="absences" element={<G roles={STAFF_ROLES}><AbsencesPage /></G>} />
              <Route path="absences/appel" element={<G roles={STAFF_ROLES}><AppelAbsencePage /></G>} />
              <Route path="absences/feuilles" element={<G roles={STAFF_ROLES}><FeuillesJourPage /></G>} />
              <Route path="absences/feuille" element={<G roles={STAFF_ROLES}><FeuilleDetailsPage /></G>} />

              {/* Inscriptions */}
              <Route path="inscriptions" element={<G roles={MANAGEMENT_ROLES}><InscriptionsPage /></G>} />

              {/* Emploi du temps — all authenticated can view */}
              <Route path="emploi-du-temps" element={<S><EmploiDuTempsPage /></S>} />
              <Route path="volume-horaire" element={<G roles={MANAGEMENT_ROLES}><VolumeHorairePage /></G>} />
              <Route path="emploi-salles" element={<G roles={MANAGEMENT_ROLES}><EmploiSalles /></G>} />
              <Route path="emploi-salles/ajouter" element={<G roles={MANAGEMENT_ROLES}><AddRoom /></G>} />
              <Route path="emploi-salles/modifier/:id" element={<G roles={MANAGEMENT_ROLES}><EditRoom /></G>} />

              {/* Configuration */}
              <Route path="config/niveaux" element={<G roles={MANAGEMENT_ROLES}><Niveaux /></G>} />
              <Route path="ecole" element={<G roles={MANAGEMENT_ROLES}><SchoolInfo /></G>} />

              {/* Finance */}
              <Route path="finance" element={<G roles={[...FINANCE_ROLES, "DIRECTEUR"]}><FinancePaiement /></G>} />
              <Route path="finance/paiement" element={<G roles={FINANCE_ROLES}><FinancePaiement /></G>} />
              <Route path="finance/depenses" element={<G roles={FINANCE_ROLES}><Depenses /></G>} />
              <Route path="finance/tresorerie" element={<G roles={FINANCE_ROLES}><Tresorerie /></G>} />
              <Route path="finance/remises-penalites" element={<G roles={FINANCE_ROLES}><RemisesPenalites /></G>} />
              <Route path="finance/relances" element={<G roles={FINANCE_ROLES}><Relances /></G>} />
              <Route path="finance/rapports" element={<G roles={[...FINANCE_ROLES, "DIRECTEUR"]}><RapportsFinanciers /></G>} />
              <Route path="finance/caisse" element={<G roles={FINANCE_ROLES}><GestionCaisse /></G>} />
              <Route path="factures" element={<G roles={FINANCE_ROLES}><FacturesPage /></G>} />

              {/* Pédagogie */}
              <Route path="evaluations" element={<Navigate to="/dashboard/carnets?tab=examens" replace />} />
              <Route path="carnets" element={<G roles={[...STAFF_ROLES, "PARENT"]}><CarnetNotes /></G>} />
              <Route path="annee-scolaire" element={<G roles={MANAGEMENT_ROLES}><AnneeScolairePage /></G>} />
              <Route path="conseil-classe" element={<G roles={MANAGEMENT_ROLES}><ConseilClassePage /></G>} />
              <Route path="bilan-annuel" element={<G roles={MANAGEMENT_ROLES}><BilanAnnuelPage /></G>} />
              <Route path="cloture" element={<G roles={MANAGEMENT_ROLES}><ClotureAnneePage /></G>} />
              <Route path="reinscriptions" element={<G roles={MANAGEMENT_ROLES}><ReinscriptionsPage /></G>} />
              <Route path="devoirs" element={<G roles={STAFF_ROLES}><DevoirsPage /></G>} />
              <Route path="quiz" element={<G roles={STAFF_ROLES}><QuizManagementPage /></G>} />
              <Route path="calendrier" element={<S><CalendrierPage /></S>} />

              {/* Bulletins */}
              <Route path="bulletins-masse" element={<G roles={MANAGEMENT_ROLES}><BulletinsMassePage /></G>} />
              <Route path="bulletins-annuels" element={<G roles={MANAGEMENT_ROLES}><BulletinsAnnuelsPage /></G>} />
              <Route path="stats-reussite" element={<G roles={MANAGEMENT_ROLES}><StatsReussitePage /></G>} />
              <Route path="comparatif" element={<G roles={MANAGEMENT_ROLES}><ComparatifPerformancesPage /></G>} />

              {/* Vie scolaire */}
              <Route path="discipline" element={<G roles={STAFF_ROLES}><DisciplinePage /></G>} />
              <Route path="bibliotheque" element={<G roles={MANAGEMENT_ROLES}><BibliothequePage /></G>} />
              <Route path="transport" element={<G roles={MANAGEMENT_ROLES}><TransportPage /></G>} />
              <Route path="cantine" element={<G roles={MANAGEMENT_ROLES}><CantinePage /></G>} />

              {/* Documents */}
              {/* <Route path="rapports" element={<G roles={MANAGEMENT_ROLES}><Rapports /></G>} /> */}
              <Route path="circulaires" element={<G roles={MANAGEMENT_ROLES}><Circulaires /></G>} />
              <Route path="documents" element={<G roles={MANAGEMENT_ROLES}><GenerationDocumentsPage /></G>} />

              {/* Communication */}
              <Route path="notifications" element={<G roles={STAFF_ROLES}><NotificationsPage /></G>} />
              <Route path="annonces" element={<G roles={STAFF_ROLES}><AnnoncesPage /></G>} />
              <Route path="reunions" element={<G roles={STAFF_ROLES}><ReunionsPage /></G>} />

              {/* Portail Parent */}
              <Route path="portail-parent" element={<G roles={["PARENT"]}><ParentPortalPage /></G>} />

              {/* RH & Personnel */}
              <Route path="contrats" element={<G roles={MANAGEMENT_ROLES}><ContratsPage /></G>} />
              <Route path="rh/paie" element={<G roles={MANAGEMENT_ROLES}><PaiePage /></G>} />
              <Route path="rh/formations" element={<G roles={MANAGEMENT_ROLES}><FormationsPage /></G>} />
              <Route path="teacher-evaluations" element={<G roles={MANAGEMENT_ROLES}><TeacherEvaluationsPage /></G>} />

              {/* Analytics */}
              <Route path="analytics" element={<G roles={MANAGEMENT_ROLES}><AnalyticsDashboardPage /></G>} />
              <Route path="suivi-eleve" element={<G roles={STAFF_ROLES}><SuiviElevePage /></G>} />

              {/* Intégrations */}
              <Route path="integrations" element={<G roles={ADMIN_ROLES}><IntegrationsPage /></G>} />

              {/* Vitrine */}
              <Route path="vitrine" element={<G roles={MANAGEMENT_ROLES}><VitrineAdminPage /></G>} />

              {/* Administration */}
              <Route path="utilisateurs" element={<G roles={MANAGEMENT_ROLES}><UsersPage /></G>} />
              <Route path="configuration" element={<G roles={ADMIN_ROLES}><Configuration /></G>} />
              <Route path="tracabilite" element={<G roles={ADMIN_ROLES}><Tracabilite /></G>} />
              <Route path="statistique" element={<G roles={MANAGEMENT_ROLES}><Statistiques /></G>} />

              <Route path="*" element={<S><Dashboard /></S>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          )}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
