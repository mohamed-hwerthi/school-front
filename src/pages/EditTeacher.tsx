import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Edit } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import { StudentFormSkeleton } from "@/components/skeletons/StudentFormSkeleton";
import type { TeacherFormValues } from "@/lib/teacher-schema";
import { useLanguage } from "@/hooks/useLanguage";

export default function EditTeacher() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTeacher, updateTeacher, isLoading } = useTeachers();

  const teacher = getTeacher(id ?? "");

  if (isLoading) return <StudentFormSkeleton />;

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium text-foreground">{t("teachers.teacherNotFound")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          L'enseignant avec l'identifiant #{id} n'existe pas.
        </p>
        <button
          onClick={() => navigate("/dashboard/enseignants")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  const handleSubmit = (data: TeacherFormValues) => {
    updateTeacher(teacher.id, {
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
        <span className="text-foreground font-medium">{t("common.edit")}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
            <Edit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("teachers.editTeacher")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {teacher.prenom} {teacher.nom} — {teacher.specialite}
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
          defaultValues={{
            prenom: teacher.prenom,
            nom: teacher.nom,
            specialite: teacher.specialite,
            sexe: teacher.sexe,
            dateNaissance: teacher.dateNaissance,
            telephone: teacher.telephone,
            email: teacher.email,
            statut: teacher.statut,
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/enseignants")}
          submitLabel={t("teachers.saveChanges")}
        />
      </motion.div>
    </div>
  );
}
