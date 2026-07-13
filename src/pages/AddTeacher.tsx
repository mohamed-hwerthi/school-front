import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, UserPlus } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import type { TeacherFormValues } from "@/lib/teacher-schema";
import { useLanguage } from "@/hooks/useLanguage";

export default function AddTeacher() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addTeacher } = useTeachers();

  const handleSubmit = (data: TeacherFormValues) => {
    addTeacher({
      ...data,
      telephone: data.telephone ?? "",
      email: data.email ?? "",
    });
    navigate("/dashboard/enseignants");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/dashboard")}
          className="hover:text-foreground transition-colors"
        >
          {t("nav.dashboard")}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => navigate("/dashboard/enseignants")}
          className="hover:text-foreground transition-colors"
        >
          {t("nav.teachers")}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{t("common.add")}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-sm">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("teachers.addTeacher")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("teachers.fillInfo")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <TeacherForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/enseignants")}
          submitLabel="Ajouter l'enseignant"
        />
      </motion.div>
    </div>
  );
}
