import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, FileText, Award } from "lucide-react";
import { CarnetSelectionProvider } from "@/components/carnet/CarnetSelectionContext";
import AppreciationsTab from "@/components/carnet/AppreciationsTab";
import CarnetsTab from "@/components/carnet/CarnetsTab";
import CertificatsTab from "@/components/carnet/CertificatsTab";

type Tab = "appreciations" | "carnets" | "certificats";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "appreciations", label: "Appréciations", icon: MessageSquareText },
  { key: "carnets", label: "Carnets", icon: FileText },
  { key: "certificats", label: "Certificats", icon: Award },
];

export default function BulletinsIndividuelsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("appreciations");

  return (
    <CarnetSelectionProvider goToTab={(t) => setActiveTab(t as Tab)}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                Bulletins individuels
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Appréciations, carnets de notes et certificats par classe
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
        </div>

        {activeTab === "appreciations" && <AppreciationsTab />}
        {activeTab === "carnets" && <CarnetsTab />}
        {activeTab === "certificats" && <CertificatsTab />}
      </div>
    </CarnetSelectionProvider>
  );
}
