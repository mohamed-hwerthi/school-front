import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, UserPlus } from "lucide-react";
import { useCreateStudent } from "@/hooks/useStudents";
import { StudentForm } from "@/components/students/StudentForm";
import type { StudentFormValues } from "@/lib/student-schema";
import { notify } from "@/lib/toast";
import { useLanguage } from "@/hooks/useLanguage";

export default function AddStudent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createStudent = useCreateStudent();

  const handleSubmit = (data: StudentFormValues) => {
    createStudent.mutate(
      {
        ...data,
        nomAr: data.nomAr ?? "",
        prenomAr: data.prenomAr ?? "",
        lieuNaissance: data.lieuNaissance ?? "",
        adresse: data.adresse ?? "",
        matricule: data.matricule ?? "",
        estBloque: data.estBloque ?? false,
        nomParent: data.nomParent ?? "",
        prenomParent: data.prenomParent ?? "",
        telephoneParent: data.telephoneParent ?? "",
        emailParent: data.emailParent ?? "",
        notes: data.notes ?? "",
      },
      notify.mutation({
        success: t("students.studentAdded"),
        successDescription: `${data.prenom} ${data.nom} ${t("students.hasBeenAdded")}`,
        error: t("students.addError"),
        onSuccess: () => navigate("/dashboard/eleves"),
      })
    );
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
          onClick={() => navigate("/dashboard/eleves")}
          className="hover:text-foreground transition-colors"
        >
          {t("nav.students")}
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
              {t("students.newStudent")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("students.fillInfo")}
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
        <StudentForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/eleves")}
          submitLabel={createStudent.isPending ? t("students.enrolling") : t("students.enroll")}
        />
      </motion.div>
    </div>
  );
}
