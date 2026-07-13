import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  School,
  GraduationCap,
  Clock,
  Palette,
  Save,
  RotateCcw,
  ChevronRight,
  Globe,
  Calendar,
  Users,
  BookOpen,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { CURRENCY } from "@/config/currency";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useAllStudents } from "@/hooks/useStudents";
import { useSchoolSettings, useUpdateSchoolSettings } from "@/hooks/useSchoolSettings";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

type ConfigSection = "general" | "horaires" | "niveaux" | "apparence";

export default function Configuration() {
  const { t } = useLanguage();

  const sections: { key: ConfigSection; label: string; icon: React.ElementType; description: string }[] = useMemo(() => [
    { key: "general", label: t("nav.home"), icon: School, description: t("configuration.title") },
    { key: "horaires", label: t("configuration.schedule"), icon: Clock, description: t("configuration.schedule") },
    { key: "niveaux", label: t("nav.levelsClasses"), icon: GraduationCap, description: t("configuration.levelManagement") },
    { key: "apparence", label: t("configuration.theme"), icon: Palette, description: t("configuration.theme") },
  ], [t]);
  const loading = useSimulatedLoading(800);
  const { niveaux } = useNiveaux();
  const { data: students = [] } = useAllStudents();
  const { data: settings } = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const [activeSection, setActiveSection] = useState<ConfigSection>("general");

  // General settings (synced from DB)
  const [schoolName, setSchoolName] = useState("");
  const [schoolNameAr, setSchoolNameAr] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("2025 / 2026");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [directeurName, setDirecteurName] = useState("");
  const [directeurNameAr, setDirecteurNameAr] = useState("");
  const [delegationRegionale, setDelegationRegionale] = useState("");
  const [delegationRegionaleAr, setDelegationRegionaleAr] = useState("");
  const [langue, setLangue] = useState("fr");
  const [fuseau, setFuseau] = useState("Africa/Tunis");
  const [devise, setDevise] = useState(CURRENCY);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings from DB into local state
  if (settings && !settingsLoaded) {
    setSchoolName(settings.schoolName || "");
    setSchoolNameAr(settings.schoolNameAr || "");
    setAnneeScolaire(settings.anneeScolaire || "2025 / 2026");
    setAdresse(settings.adresse || "");
    setTelephone(settings.telephone || "");
    setDirecteurName(settings.directeurName || "");
    setDirecteurNameAr(settings.directeurNameAr || "");
    setDelegationRegionale(settings.delegationRegionale || "");
    setDelegationRegionaleAr(settings.delegationRegionaleAr || "");
    setSettingsLoaded(true);
  }

  // Horaires
  const [heureDebut, setHeureDebut] = useState("08:00");
  const [heureFin, setHeureFin] = useState("17:00");
  const [dureeSeance, setDureeSeance] = useState("60");
  const [dureeRecreation, setDureeRecreation] = useState("15");

  // Appearance
  const [theme, setTheme] = useState("light");
  const [couleurPrimaire, setCouleurPrimaire] = useState("#7c3aed");

  const handleSave = () => {
    updateSettings.mutate(
      {
        schoolName,
        schoolNameAr: schoolNameAr || null,
        anneeScolaire,
        adresse: adresse || null,
        telephone: telephone || null,
        directeurName: directeurName || null,
        directeurNameAr: directeurNameAr || null,
        delegationRegionale: delegationRegionale || null,
        delegationRegionaleAr: delegationRegionaleAr || null,
      },
      {
        onSuccess: () => notify.success(t("common.success")),
        onError: () => notify.error(t("common.error")),
      }
    );
  };

  const handleReset = () => {
    notify.info(t("common.reset"));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("configuration.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("configuration.title")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            {t("common.reset")}
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={handleSave}>
            <Save className="h-4 w-4" />
            {t("common.save")}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-1 space-y-1">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-start ${
                activeSection === section.key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <section.icon className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{section.label}</p>
              </div>
              {activeSection === section.key && <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-3">
          {/* GÉNÉRAL */}
          {activeSection === "general" && (
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><School className="h-5 w-5 text-primary" />{t("configuration.title")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t("configuration.title")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("documents.schoolName")}</label>
                  <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="École Primaire..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("bulletins.schoolNameAr")}</label>
                  <Input value={schoolNameAr} onChange={(e) => setSchoolNameAr(e.target.value)} placeholder="المدرسة الابتدائية..." dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("common.schoolYear")}</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)} placeholder="2025 / 2026" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("common.phone")}</label>
                  <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+216 XX XXX XXX" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">{t("common.address")}</label>
                  <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, Ville, Code Postal" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("schoolInfo.directorName")}</label>
                  <Input value={directeurName} onChange={(e) => setDirecteurName(e.target.value)} placeholder="Nom du directeur" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("schoolInfo.directorName")} (AR)</label>
                  <Input value={directeurNameAr} onChange={(e) => setDirecteurNameAr(e.target.value)} placeholder="اسم المدير" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Délégation régionale</label>
                  <Input value={delegationRegionale} onChange={(e) => setDelegationRegionale(e.target.value)} placeholder="Ex : Béja" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Délégation régionale (AR)</label>
                  <Input value={delegationRegionaleAr} onChange={(e) => setDelegationRegionaleAr(e.target.value)} placeholder="مثال : باجة" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("configuration.language")}</label>
                  <Select value={langue} onValueChange={setLangue}>
                    <SelectTrigger><Globe className="h-4 w-4 me-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">{t("language.french")}</SelectItem>
                      <SelectItem value="ar">{t("language.arabic")}</SelectItem>
                      <SelectItem value="en">{t("language.english")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("configuration.currency")}</label>
                  <Select value={devise} onValueChange={setDevise}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TND">TND (Dinar Tunisien)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /><span className="font-medium">{students.length}</span> <span className="text-muted-foreground">{t("nav.students")}</span></div>
                  <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-500" /><span className="font-medium">{niveaux.length}</span> <span className="text-muted-foreground">{t("nav.levels")}</span></div>
                  <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-500" /><span className="font-medium">{niveaux.reduce((sum, n) => sum + n.sections.length, 0)}</span> <span className="text-muted-foreground">{t("nav.classes")}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* HORAIRES */}
          {activeSection === "horaires" && (
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />{t("configuration.schedule")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t("configuration.schedule")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Heure de début</label>
                  <Input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Heure de fin</label>
                  <Input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durée d'une séance (min)</label>
                  <Input type="number" value={dureeSeance} onChange={(e) => setDureeSeance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durée récréation (min)</label>
                  <Input type="number" value={dureeRecreation} onChange={(e) => setDureeRecreation(e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Aperçu des créneaux</p>
                <p className="text-xs">Avec les paramètres actuels : {Math.floor((parseInt(heureFin.split(":")[0]) * 60 + parseInt(heureFin.split(":")[1]) - parseInt(heureDebut.split(":")[0]) * 60 - parseInt(heureDebut.split(":")[1])) / (parseInt(dureeSeance) + parseInt(dureeRecreation)))} séances par jour</p>
              </div>
            </div>
          )}

          {/* NIVEAUX */}
          {activeSection === "niveaux" && (
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />{t("nav.levelsClasses")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t("configuration.levelOverview")}</p>
              </div>
              <div className="space-y-3">
                {niveaux.map((niveau) => {
                  const count = students.filter((s) => s.niveau === niveau.nom).length;
                  return (
                    <div key={niveau.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{niveau.nom}</p>
                          <div className="flex gap-1 mt-0.5">
                            {niveau.sections.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs px-1.5 py-0">{niveau.nom.match(/^(\d+)/)?.[1]}{s}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">{count} élèves</Badge>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.href = "/dashboard/config/niveaux"}>
                <Settings className="h-4 w-4" />
                {t("configuration.levelManagement")}
              </Button>
            </div>
          )}

          {/* APPARENCE */}
          {activeSection === "apparence" && (
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />{t("configuration.theme")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t("configuration.theme")}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thème</label>
                  <div className="flex gap-3">
                    {[
                      { value: "light", label: t("configuration.themes.light"), bg: "bg-white border-2" },
                      { value: "dark", label: t("configuration.themes.dark"), bg: "bg-gray-900 border-2" },
                      { value: "auto", label: t("configuration.themes.auto"), bg: "bg-gradient-to-r from-white to-gray-900 border-2" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-all ${theme === t.value ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                      >
                        <div className={`h-12 w-16 rounded-md ${t.bg} ${theme === t.value ? "border-primary" : "border-border"}`} />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("configuration.primaryColor")}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer" />
                    <Input value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="w-32" />
                    <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: couleurPrimaire }} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
