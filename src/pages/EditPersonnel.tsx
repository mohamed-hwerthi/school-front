import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Edit } from "lucide-react";
import { usePersonnel, useUpdatePersonnel } from "@/hooks/usePersonnel";
import { PersonnelForm } from "@/components/personnel/PersonnelForm";
import { StudentFormSkeleton } from "@/components/skeletons/StudentFormSkeleton";
import type { PersonnelFormValues } from "@/lib/personnel-schema";
import { useLanguage } from "@/hooks/useLanguage";

export default function EditPersonnel() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: personnel, isLoading } = usePersonnel(id ?? "");
  const updatePersonnel = useUpdatePersonnel();

  if (isLoading) return <StudentFormSkeleton />;

  if (!personnel) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium text-foreground">{t("personnel.personnelNotFound")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("personnel.personnelNotFoundDesc")}</p>
        <button
          onClick={() => navigate("/dashboard/personnel")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  const handleSubmit = (data: PersonnelFormValues) => {
    updatePersonnel.mutate(
      {
        id: personnel.id,
        data: {
          ...data,
          telephone: data.telephone ?? "",
          email: data.email ?? "",
          dateNaissance: data.dateNaissance ?? "",
        },
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
        <span className="text-foreground font-medium">{t("common.edit")}</span>
      </nav>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
            <Edit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {t("personnel.editPersonnel")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {personnel.prenom} {personnel.nom} — {personnel.fonction}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <PersonnelForm
          defaultValues={{
            prenom: personnel.prenom,
            nom: personnel.nom,
            fonction: personnel.fonction,
            sexe: personnel.sexe,
            dateNaissance: personnel.dateNaissance,
            telephone: personnel.telephone,
            email: personnel.email,
            statut: personnel.statut,
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/personnel")}
          submitLabel={t("common.save")}
        />
      </motion.div>
    </div>
  );
}
