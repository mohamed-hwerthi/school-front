import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  FileText,
  MessageSquare,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  StickyNote,
  Users,
  Hash,
  ShieldAlert,
  ShieldCheck,
  Globe,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStudent } from "@/hooks/useStudents";
import { useSchool } from "@/hooks/useSchool";
import { StudentProfileSkeleton } from "@/components/skeletons/StudentProfileSkeleton";
import { generateAttestation } from "@/lib/generate-attestation";
import { PhotoUpload, getStudentPhotoUrl } from "@/components/students/PhotoUpload";
import { useLanguage } from "@/hooks/useLanguage";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CommunicationDialog } from "@/components/finance/CommunicationDialog";
import { AppelDialog } from "@/components/finance/AppelDialog";

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const statusConfig: Record<string, { bg: string; text: string }> = {
  Actif: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Inactif: { bg: "bg-red-100", text: "text-red-700" },
  "En attente": { bg: "bg-amber-100", text: "text-amber-700" },
};

export default function StudentProfile() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id);
  const { school } = useSchool();

  // Contact dialogs state
  const [smsOpen, setSmsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [appelOpen, setAppelOpen] = useState(false);

  if (isLoading) return <StudentProfileSkeleton />;

  if (!student) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 mb-6"
          onClick={() => navigate("/dashboard/eleves")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-heading text-lg font-bold text-foreground">{t("students.studentNotFound")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            L'élève demandé n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  const getInitials = () => `${student.prenom[0]}${student.nom[0]}`.toUpperCase();
  const getAvatarColor = () => avatarColors[student.id % avatarColors.length];
  const studentPhotoUrl = getStudentPhotoUrl(student.id);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/dashboard/eleves")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {studentPhotoUrl && (
              <AvatarImage src={studentPhotoUrl} alt={`${student.prenom} ${student.nom}`} />
            )}
            <AvatarFallback className={`text-xl font-bold ${getAvatarColor()}`}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              {student.prenom} {student.nom}
            </h1>
            {(student.prenomAr || student.nomAr) && (
              <p className="text-sm text-muted-foreground" dir="rtl">
                {student.prenomAr} {student.nomAr}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {student.matricule && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {student.matricule}
                </Badge>
              )}
              <Badge variant="outline" className="font-medium">{student.classe}</Badge>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[student.statut]?.bg} ${statusConfig[student.statut]?.text}`}>
                {student.statut}
              </span>
              {student.estBloque && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                  <ShieldAlert className="h-3 w-3" />
                  Bloqué
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="sm:ms-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`/dashboard/eleves/modifier/${student.id}`)}
          >
            <Edit className="h-4 w-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => generateAttestation(student, school)}
          >
            <FileText className="h-4 w-4" />
            Attestation
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={() => navigate(`/dashboard/eleves/${student.id}/messages`)}
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </Button>
        </div>
      </motion.div>

      {/* Photo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
      >
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-indigo-600" />
          Photo de l'eleve
        </h3>
        <PhotoUpload
          studentId={student.id}
          studentName={`${student.prenom} ${student.nom}`}
          size="lg"
        />
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-blue-600" />
            Informations personnelles
          </h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Nom complet" value={`${student.prenom} ${student.nom}`} />
            {(student.prenomAr || student.nomAr) && (
              <InfoRow
                label="الاسم بالعربية"
                value={`${student.prenomAr} ${student.nomAr}`}
                icon={<Globe className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
            <InfoRow label="Sexe" value={student.sexe === "M" ? "Masculin" : "Féminin"} />
            <InfoRow
              label="Date de naissance"
              value={formatDate(student.dateNaissance)}
              icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            {student.lieuNaissance && (
              <InfoRow
                label="Lieu de naissance"
                value={student.lieuNaissance}
                icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
            {student.adresse && (
              <InfoRow
                label="Adresse"
                value={student.adresse}
                icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
          </div>
        </motion.div>

        {/* School Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            Informations scolaires
          </h3>
          <div className="space-y-3 text-sm">
            {student.matricule && (
              <InfoRow
                label="Matricule"
                value={student.matricule}
                icon={<Hash className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
            <InfoRow
              label="Classe"
              value={student.classe}
              icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            <InfoRow label="Niveau" value={student.niveau} />
            <InfoRow label="Statut" value={student.statut} />
            <InfoRow
              label="État"
              value={student.estBloque ? "Bloqué" : "Non bloqué"}
              icon={
                student.estBloque ? (
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                )
              }
            />
            <InfoRow
              label="Date d'inscription"
              value={formatDate(student.dateInscription)}
              icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
            />
          </div>
        </motion.div>

        {/* Parent / Tuteur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-emerald-600" />
            Parent / Tuteur
          </h3>
          <div className="space-y-3 text-sm">
            {(student.nomParent || student.prenomParent) && (
              <InfoRow
                label="Nom du parent"
                value={`${student.prenomParent} ${student.nomParent}`.trim()}
                icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
              />
            )}
            {student.telephoneParent && (
              <div className="flex items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Téléphone</span>
                  <a
                    href={`tel:${student.telephoneParent}`}
                    className="text-sm font-medium text-foreground hover:text-primary truncate"
                  >
                    {student.telephoneParent}
                  </a>
                </div>
                <WhatsAppButton phone={student.telephoneParent} className="h-7 w-7 shrink-0" size={16} />
              </div>
            )}
            {student.emailParent && (
              <div className="flex items-center gap-2 py-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Email</span>
                <a
                  href={`mailto:${student.emailParent}`}
                  className="text-sm font-medium text-foreground hover:text-primary truncate"
                >
                  {student.emailParent}
                </a>
              </div>
            )}
            {!student.nomParent && !student.prenomParent && !student.telephoneParent && !student.emailParent && (
              <p className="text-xs text-muted-foreground italic">Aucune information parent renseignée</p>
            )}

            {(student.telephoneParent || student.emailParent) && (
              <div className="pt-3 border-t border-border/40 flex flex-wrap gap-2">
                {student.telephoneParent && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      onClick={() => setSmsOpen(true)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      onClick={() => setAppelOpen(true)}
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Enregistrer un appel
                    </Button>
                  </>
                )}
                {student.emailParent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => setEmailOpen(true)}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Notes */}
      {student.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-amber-600" />
            Notes / Observations
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{student.notes}</p>
        </motion.div>
      )}

      {/* ── Contact dialogs ─────────────────────────────── */}
      <CommunicationDialog
        open={smsOpen}
        onOpenChange={setSmsOpen}
        student={student}
        type="SMS"
        solde={0}
      />
      <CommunicationDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        student={student}
        type="Email"
        solde={0}
      />
      <AppelDialog open={appelOpen} onOpenChange={setAppelOpen} student={student} />
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-foreground flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
