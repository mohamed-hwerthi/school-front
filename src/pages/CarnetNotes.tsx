import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import {
  Layers,
  BookOpen,
  ClipboardCheck,
  PenLine,
  BarChart3,
  Award,
  FileText,
  MessageSquareText,
  LayoutGrid,
} from "lucide-react";
import DomainesTab from "@/components/carnet/DomainesTab";
import ModulesTab from "@/components/carnet/ModulesTab";
import ExamensTab from "@/components/carnet/ExamensTab";
import NotesTab from "@/components/carnet/NotesTab";
import MoyennesTab from "@/components/carnet/MoyennesTab";
import AppreciationsTab from "@/components/carnet/AppreciationsTab";
import CarnetsTab from "@/components/carnet/CarnetsTab";
import CertificatsTab from "@/components/carnet/CertificatsTab";
import ApercuTab from "@/components/carnet/ApercuTab";
import { CarnetSelectionProvider } from "@/components/carnet/CarnetSelectionContext";

const TAB_KEYS = ["domaines", "modules", "examens", "apercu", "notes", "moyennes", "appreciations", "carnets", "certificats"] as const;
type TabKey = typeof TAB_KEYS[number];

export default function CarnetNotes() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab is derived from the URL — single source of truth.
  // Keeps the tab in sync when navigating via links (e.g. the "Évaluations"
  // sidebar entry redirects to ?tab=examens) or browser back/forward, even
  // when CarnetNotes is already mounted and does not remount.
  const tabParam = searchParams.get("tab");
  const activeTab: TabKey = (TAB_KEYS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "domaines";

  const selectTab = (key: TabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = useMemo(() => [
    { key: "domaines", label: t("grades.domains"), icon: Layers },
    { key: "modules", label: t("grades.modules"), icon: BookOpen },
    { key: "examens", label: t("grades.exams"), icon: ClipboardCheck },
    { key: "apercu", label: "Aperçu", icon: LayoutGrid },
    { key: "notes", label: t("grades.gradeEntry"), icon: PenLine },
    { key: "moyennes", label: t("grades.averages"), icon: BarChart3 },
    { key: "appreciations", label: t("grades.appreciations"), icon: MessageSquareText },
    { key: "carnets", label: t("grades.gradeBooks"), icon: FileText },
    { key: "certificats", label: t("grades.certificates"), icon: Award },
  ], [t]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          {t("grades.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("grades.subtitle")}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit flex-wrap"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => selectTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <CarnetSelectionProvider goToTab={(t) => selectTab(t as TabKey)}>
        {activeTab === "apercu" && <ApercuTab />}
        {activeTab === "domaines" && <DomainesTab />}
        {activeTab === "modules" && <ModulesTab />}
        {activeTab === "examens" && <ExamensTab />}
        {activeTab === "notes" && <NotesTab />}
        {activeTab === "moyennes" && <MoyennesTab />}
        {activeTab === "appreciations" && <AppreciationsTab />}
        {activeTab === "carnets" && <CarnetsTab />}
        {activeTab === "certificats" && <CertificatsTab />}
      </CarnetSelectionProvider>
    </div>
  );
}
