import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  GraduationCap,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  FileText,
  Copy,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInscription, useCheckInscription } from "@/hooks/useInscriptions";
import { useNiveaux } from "@/hooks/useNiveaux";
import type { Inscription } from "@/types/inscription";
import { useLanguage } from "@/hooks/useLanguage";

// ── Zod Schemas ─────────────────────────────────────────────

const step1Schema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  dateNaissance: z.string().min(1, "La date de naissance est requise"),
  lieuNaissance: z.string().optional(),
  sexe: z.string().optional(),
});

const step2Schema = z.object({
  nomParent: z.string().optional(),
  prenomParent: z.string().optional(),
  telephoneParent: z.string().optional(),
  emailParent: z
    .string()
    .email("L'email est invalide")
    .optional()
    .or(z.literal("")),
});

const step3Schema = z.object({
  niveauId: z.string({ invalid_type_error: "Veuillez selectionner un niveau" }).min(1, "Veuillez selectionner un niveau"),
  anneeScolaire: z.string().min(1, "L'annee scolaire est requise"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ── Steps Configuration ─────────────────────────────────────

const STEPS = [
  { label: "Eleve", icon: User },
  { label: "Parent", icon: Users },
  { label: "Scolarite", icon: GraduationCap },
  { label: "Confirmation", icon: CheckCircle },
];

// ── Helper to compute default academic year ─────────────────

function getDefaultAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export default function InscriptionPubliquePage() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<
    Partial<Step1Data & Step2Data & Step3Data>
  >({});
  const [submittedInscription, setSubmittedInscription] =
    useState<Inscription | null>(null);

  // Track status check
  const [checkMode, setCheckMode] = useState(false);
  const [checkDossier, setCheckDossier] = useState("");
  const [checkEnabled, setCheckEnabled] = useState(false);

  const createMutation = useCreateInscription();
  const { niveaux } = useNiveaux();
  const { data: checkedInscription, isLoading: isChecking } =
    useCheckInscription(checkEnabled ? checkDossier : "");

  // ── Step 1 Form ─────────────────────────────────────────

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nom: formData.nom ?? "",
      prenom: formData.prenom ?? "",
      dateNaissance: formData.dateNaissance ?? "",
      lieuNaissance: formData.lieuNaissance ?? "",
      sexe: formData.sexe ?? "",
    },
  });

  // ── Step 2 Form ─────────────────────────────────────────

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      nomParent: formData.nomParent ?? "",
      prenomParent: formData.prenomParent ?? "",
      telephoneParent: formData.telephoneParent ?? "",
      emailParent: formData.emailParent ?? "",
    },
  });

  // ── Step 3 Form ─────────────────────────────────────────

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      niveauId: formData.niveauId ?? "",
      anneeScolaire: formData.anneeScolaire ?? getDefaultAnneeScolaire(),
    },
  });

  // ── Navigation ──────────────────────────────────────────

  const handleNextStep1 = step1Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  });

  const handleNextStep2 = step2Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  });

  const handleNextStep3 = step3Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  });

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = () => {
    const finalData = {
      nom: formData.nom!,
      prenom: formData.prenom!,
      dateNaissance: formData.dateNaissance!,
      lieuNaissance: formData.lieuNaissance,
      sexe: formData.sexe,
      nomParent: formData.nomParent,
      prenomParent: formData.prenomParent,
      telephoneParent: formData.telephoneParent,
      emailParent: formData.emailParent || undefined,
      niveauId: formData.niveauId,
      anneeScolaire: formData.anneeScolaire!,
    };

    createMutation.mutate(finalData, {
      onSuccess: (inscription) => {
        setSubmittedInscription(inscription);
        notify.success("Inscription soumise avec succes !");
      },
      onError: (error) => {
        notify.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission"
        );
      },
    });
  };

  const handleCopyDossier = () => {
    if (submittedInscription?.numeroDossier) {
      navigator.clipboard.writeText(submittedInscription.numeroDossier);
      notify.success("Numero de dossier copie !");
    }
  };

  const handleCheckStatus = () => {
    if (checkDossier.trim()) {
      setCheckEnabled(true);
    }
  };

  const niveauName =
    niveaux.find((n) => n.id === formData.niveauId)?.nom ?? "-";

  // ── Success State ───────────────────────────────────────

  if (submittedInscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-border/50 p-8 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Inscription soumise !
          </h2>
          <p className="text-muted-foreground mb-6">
            Votre demande d'inscription a ete enregistree avec succes. Conservez
            votre numero de dossier pour suivre l'etat de votre inscription.
          </p>

          <div className="bg-muted/30 rounded-xl p-4 mb-6">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Numero de dossier
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-xl font-bold text-foreground">
                {submittedInscription.numeroDossier}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyDossier}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-start space-y-2 bg-muted/20 rounded-lg p-4 mb-6">
            <p className="text-sm">
              <span className="text-muted-foreground">Eleve :</span>{" "}
              <span className="font-medium">
                {submittedInscription.prenom} {submittedInscription.nom}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Annee scolaire :</span>{" "}
              <span className="font-medium">
                {submittedInscription.anneeScolaire}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Statut :</span>{" "}
              <span className="font-medium text-blue-600">Soumise</span>
            </p>
          </div>

          <Button
            onClick={() => {
              setSubmittedInscription(null);
              setFormData({});
              setCurrentStep(0);
              step1Form.reset();
              step2Form.reset();
              step3Form.reset({ anneeScolaire: getDefaultAnneeScolaire() });
            }}
            className="w-full"
          >
            Nouvelle inscription
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">
            {t("inscriptions.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            Remplissez le formulaire pour inscrire votre enfant
          </p>

          {/* Check status link */}
          <div className="mt-4">
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setCheckMode(!checkMode)}
            >
              <Search className="h-3.5 w-3.5 me-1" />
              {checkMode
                ? "Revenir au formulaire"
                : "Verifier l'etat de mon inscription"}
            </Button>
          </div>
        </motion.div>

        {/* Check Status Mode */}
        {checkMode ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-border/50 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Suivi de votre inscription
                </h2>
                <p className="text-sm text-muted-foreground">
                  Entrez votre numero de dossier pour verifier l'etat
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Ex: INS-2026-A1B2C3D4"
                value={checkDossier}
                onChange={(e) => {
                  setCheckDossier(e.target.value);
                  setCheckEnabled(false);
                }}
                className="flex-1"
              />
              <Button
                onClick={handleCheckStatus}
                disabled={!checkDossier.trim() || isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>

            {checkEnabled && checkedInscription && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/20 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">
                    {checkedInscription.numeroDossier}
                  </span>
                  <span
                    className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                      checkedInscription.statut === "ACCEPTEE"
                        ? "bg-emerald-100 text-emerald-700"
                        : checkedInscription.statut === "REFUSEE"
                          ? "bg-red-100 text-red-700"
                          : checkedInscription.statut === "SOUMISE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {checkedInscription.statut === "SOUMISE" && "Soumise"}
                    {checkedInscription.statut === "EN_REVISION" &&
                      "En revision"}
                    {checkedInscription.statut === "ACCEPTEE" && "Acceptee"}
                    {checkedInscription.statut === "REFUSEE" && "Refusee"}
                    {checkedInscription.statut === "EN_ATTENTE" && "En attente"}
                    {checkedInscription.statut === "LISTE_ATTENTE" &&
                      "Liste d'attente"}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Eleve :</span>{" "}
                  <span className="font-medium">
                    {checkedInscription.prenom} {checkedInscription.nom}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    Annee scolaire :
                  </span>{" "}
                  <span className="font-medium">
                    {checkedInscription.anneeScolaire}
                  </span>
                </p>
                {checkedInscription.commentaire && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      Commentaire :
                    </span>{" "}
                    <span className="font-medium">
                      {checkedInscription.commentaire}
                    </span>
                  </p>
                )}
              </motion.div>
            )}

            {checkEnabled && !isChecking && !checkedInscription && (
              <p className="text-sm text-center text-muted-foreground">
                Aucune inscription trouvee avec ce numero de dossier.
              </p>
            )}
          </motion.div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-4">
              {STEPS.map((step, index) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        index < currentStep
                          ? "bg-primary border-primary text-primary-foreground"
                          : index === currentStep
                            ? "border-primary text-primary bg-primary/10"
                            : "border-muted-foreground/30 text-muted-foreground/50"
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 ${
                        index <= currentStep
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-12 sm:w-20 mx-2 ${
                        index < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Informations eleve */}
                {currentStep === 0 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Informations de l'eleve
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Renseignez les informations personnelles de l'eleve
                    </p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="nom">
                            Nom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nom"
                            {...step1Form.register("nom")}
                            placeholder="Nom de famille"
                          />
                          {step1Form.formState.errors.nom && (
                            <p className="text-xs text-red-500">
                              {step1Form.formState.errors.nom.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="prenom">
                            Prenom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="prenom"
                            {...step1Form.register("prenom")}
                            placeholder="Prenom"
                          />
                          {step1Form.formState.errors.prenom && (
                            <p className="text-xs text-red-500">
                              {step1Form.formState.errors.prenom.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="dateNaissance">
                            Date de naissance{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dateNaissance"
                            type="date"
                            {...step1Form.register("dateNaissance")}
                          />
                          {step1Form.formState.errors.dateNaissance && (
                            <p className="text-xs text-red-500">
                              {step1Form.formState.errors.dateNaissance.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                          <Input
                            id="lieuNaissance"
                            {...step1Form.register("lieuNaissance")}
                            placeholder="Ville de naissance"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="sexe">Sexe</Label>
                        <Select
                          value={step1Form.watch("sexe") || ""}
                          onValueChange={(v) => step1Form.setValue("sexe", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculin</SelectItem>
                            <SelectItem value="F">Feminin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button onClick={handleNextStep1}>
                        Suivant
                        <ChevronRight className="h-4 w-4 ms-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Informations parent */}
                {currentStep === 1 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Informations du parent / tuteur
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Renseignez les coordonnees du parent ou tuteur
                    </p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="nomParent">Nom du parent</Label>
                          <Input
                            id="nomParent"
                            {...step2Form.register("nomParent")}
                            placeholder="Nom"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="prenomParent">
                            Prenom du parent
                          </Label>
                          <Input
                            id="prenomParent"
                            {...step2Form.register("prenomParent")}
                            placeholder="Prenom"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="telephoneParent">Telephone</Label>
                        <Input
                          id="telephoneParent"
                          {...step2Form.register("telephoneParent")}
                          placeholder="Ex: 06 12 34 56 78"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="emailParent">Email</Label>
                        <Input
                          id="emailParent"
                          type="email"
                          {...step2Form.register("emailParent")}
                          placeholder="parent@email.com"
                        />
                        {step2Form.formState.errors.emailParent && (
                          <p className="text-xs text-red-500">
                            {step2Form.formState.errors.emailParent.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4 me-1" />
                        Precedent
                      </Button>
                      <Button onClick={handleNextStep2}>
                        Suivant
                        <ChevronRight className="h-4 w-4 ms-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Choix niveau et annee scolaire */}
                {currentStep === 2 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Choix du niveau
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Selectionnez le niveau souhaite et l'annee scolaire
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="niveauId">
                          Niveau <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={
                            step3Form.watch("niveauId")
                              ? String(step3Form.watch("niveauId"))
                              : ""
                          }
                          onValueChange={(v) =>
                            step3Form.setValue("niveauId", v, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionner un niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            {niveaux.map((n) => (
                              <SelectItem key={n.id} value={String(n.id)}>
                                {n.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {step3Form.formState.errors.niveauId && (
                          <p className="text-xs text-red-500">
                            {step3Form.formState.errors.niveauId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="anneeScolaire">
                          Annee scolaire{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="anneeScolaire"
                          {...step3Form.register("anneeScolaire")}
                          placeholder="Ex: 2025-2026"
                        />
                        {step3Form.formState.errors.anneeScolaire && (
                          <p className="text-xs text-red-500">
                            {step3Form.formState.errors.anneeScolaire.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4 me-1" />
                        Precedent
                      </Button>
                      <Button onClick={handleNextStep3}>
                        Suivant
                        <ChevronRight className="h-4 w-4 ms-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 3 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Confirmation
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Verifiez les informations avant de soumettre
                    </p>

                    <div className="space-y-4">
                      {/* Eleve summary */}
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Eleve
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Nom :
                            </span>{" "}
                            <span className="font-medium">{formData.nom}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Prenom :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.prenom}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Date de naissance :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.dateNaissance
                                ? new Date(
                                    formData.dateNaissance
                                  ).toLocaleDateString("fr-FR")
                                : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Lieu :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.lieuNaissance || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Sexe :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.sexe === "M"
                                ? "Masculin"
                                : formData.sexe === "F"
                                  ? "Feminin"
                                  : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Parent summary */}
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Parent / Tuteur
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Nom :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.prenomParent || ""}{" "}
                              {formData.nomParent || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Telephone :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.telephoneParent || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Email :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.emailParent || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scolarite summary */}
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Scolarite
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Niveau :
                            </span>{" "}
                            <span className="font-medium">{niveauName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Annee :
                            </span>{" "}
                            <span className="font-medium">
                              {formData.anneeScolaire}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4 me-1" />
                        Precedent
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin me-1" />
                            Soumission en cours...
                          </>
                        ) : (
                          <>
                            Soumettre l'inscription
                            <CheckCircle className="h-4 w-4 ms-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
