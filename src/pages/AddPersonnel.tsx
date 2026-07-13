import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, UserPlus } from "lucide-react";
import { useCreatePersonnel } from "@/hooks/usePersonnel";
import { PersonnelForm } from "@/components/personnel/PersonnelForm";
import type { PersonnelFormValues } from "@/lib/personnel-schema";
import { useLanguage } from "@/hooks/useLanguage";

export default function AddPersonnel() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createPersonnel = useCreatePersonnel();

  const handleSubmit = (data: PersonnelFormValues) => {
    createPersonnel.mutate(
      {
        ...data,
        telephone: data.telephone ?? "",
        email: data.email ?? "",
        dateNaissance: data.dateNaissance ?? "",
      },
      { onSuccess: () => navigate("/dashboard/personnel") }
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard")} className="hover:text-foreground transition-colors">
          {t("nav.dashboard")}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate("/dashboard/personnel")} className="hover:text-foreground transition-colors">
          {t("nav.personnel")}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{t("common.add")}</span>
      </nav>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-sm">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("personnel.addPersonnel")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("personnel.fillInfo")}</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <PersonnelForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/personnel")}
          submitLabel={t("personnel.addPersonnel")}
        />
      </motion.div>
    </div>
  );
}
