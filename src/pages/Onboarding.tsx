import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  User,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOnboard } from "@/hooks/useSaas";
import type { TenantOnboardingRequest } from "@/types/saas";
import { useLanguage } from "@/hooks/useLanguage";
import { CURRENCY } from "@/config/currency";

const STEPS = [
  { label: "Ecole", icon: School },
  { label: "Administrateur", icon: User },
  { label: "Forfait", icon: CreditCard },
  { label: "Confirmation", icon: CheckCircle2 },
];

const PLANS = [
  {
    id: "FREE",
    name: "Gratuit",
    price: "0",
    description: "Ideal pour demarrer",
    features: ["50 eleves max", "10 enseignants max", "Matières de base", "Support communautaire"],
    color: "border-gray-200",
    popular: false,
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: "49.99",
    description: "Pour les ecoles en croissance",
    features: ["200 eleves max", "30 enseignants max", "Tous les modules", "Support email", "Rapports avances"],
    color: "border-blue-300",
    popular: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "149.99",
    description: "Pour les grandes ecoles",
    features: ["500 eleves max", "100 enseignants max", "Tous les modules", "Support prioritaire", "Analytics avances", "API access"],
    color: "border-violet-300",
    popular: false,
  },
];

export default function Onboarding() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TenantOnboardingRequest>({
    schoolName: "",
    schoolNameAr: "",
    delegationRegionale: "",
    delegationRegionaleAr: "",
    slug: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    plan: "FREE",
    contactPhone: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const onboard = useOnboard();

  const updateForm = (field: keyof TenantOnboardingRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "schoolName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setForm((prev) => ({ ...prev, slug, [field]: value }));
    }
  };

  const canNext = () => {
    if (step === 0)
      return (
        form.schoolName.length >= 3 &&
        form.schoolNameAr.trim().length >= 2 &&
        form.delegationRegionale.trim().length >= 2 &&
        form.delegationRegionaleAr.trim().length >= 2
      );
    if (step === 1) return form.adminEmail.includes("@") && form.adminPassword.length >= 6 && form.adminPassword === confirmPassword;
    if (step === 2) return !!form.plan;
    return true;
  };

  const handleSubmit = () => {
    onboard.mutate(form, {
      onSuccess: () => {
        notify.success("Ecole creee avec succes !");
        setStep(3);
      },
      onError: (err: Error) => {
        notify.error(err.message || "Erreur lors de la creation");
      },
    });
  };

  return (
    <div className="flex items-start justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white">
              <School className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold">EcoleNet</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-violet-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {/* Step 0: School Info */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">{t("onboarding.schoolInfo")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("onboarding.startWithName")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Nom de l'ecole *</label>
                  <Input value={form.schoolName} onChange={(e) => updateForm("schoolName", e.target.value)}
                    placeholder="Ex: Ecole Manarat Al Malika" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Nom de l'école (AR) *</label>
                  <Input value={form.schoolNameAr} onChange={(e) => updateForm("schoolNameAr", e.target.value)}
                    placeholder="مثال : المدرسة الابتدائية الخاصة منارة المليكة" dir="rtl" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Affiché en haut du bulletin officiel.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Délégation régionale *</label>
                    <Input value={form.delegationRegionale} onChange={(e) => updateForm("delegationRegionale", e.target.value)}
                      placeholder="Ex : Béja" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Délégation régionale (AR) *</label>
                    <Input value={form.delegationRegionaleAr} onChange={(e) => updateForm("delegationRegionaleAr", e.target.value)}
                      placeholder="مثال : باجة" dir="rtl" className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <Input value={form.slug} onChange={(e) => updateForm("slug", e.target.value)}
                    placeholder="ecole-manarat" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">app.ecolenet.com/{form.slug || "..."}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telephone de contact</label>
                  <Input value={form.contactPhone} onChange={(e) => updateForm("contactPhone", e.target.value)}
                    placeholder="+212 6XX XXX XXX" className="mt-1" />
                </div>
              </motion.div>
            )}

            {/* Step 1: Admin Account */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">{t("onboarding.adminAccount")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("onboarding.adminAccountDesc")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Prenom *</label>
                    <Input value={form.adminFirstName} onChange={(e) => updateForm("adminFirstName", e.target.value)}
                      placeholder="Prenom" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom *</label>
                    <Input value={form.adminLastName} onChange={(e) => updateForm("adminLastName", e.target.value)}
                      placeholder="Nom" className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => updateForm("adminEmail", e.target.value)}
                    placeholder="admin@ecole.ma" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Mot de passe *</label>
                  <Input type="password" value={form.adminPassword} onChange={(e) => updateForm("adminPassword", e.target.value)}
                    placeholder="Minimum 6 caracteres" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirmer le mot de passe *</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe" className="mt-1" />
                  {confirmPassword && confirmPassword !== form.adminPassword && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Choose Plan */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">{t("onboarding.choosePlan")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("onboarding.canChangeLater")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => updateForm("plan", plan.id)}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        form.plan === plan.id
                          ? "border-violet-500 bg-violet-50/50 shadow-md"
                          : `${plan.color} hover:border-violet-200`
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 start-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white">
                            <Sparkles className="h-3 w-3" />
                            Populaire
                          </span>
                        </div>
                      )}
                      <h3 className="font-heading text-sm font-bold mt-1">{plan.name}</h3>
                      <div className="mt-1">
                        <span className="font-heading text-2xl font-bold">{plan.price}</span>
                        <span className="text-xs text-muted-foreground"> {CURRENCY}/mois</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="font-heading text-xl font-bold">Ecole creee avec succes !</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  L'espace <strong>{form.schoolName}</strong> est prêt.
                  Son administrateur peut se connecter avec les identifiants saisis.
                </p>
                <Button
                  onClick={() => navigate("/super-admin")}
                  className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  Retour au tableau de bord
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              {step < 2 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="gap-1.5"
                >
                  {t("common.next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canNext() || onboard.isPending}
                  className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600"
                >
                  {onboard.isPending ? t("common.creating") : t("onboarding.createMySchool")}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
