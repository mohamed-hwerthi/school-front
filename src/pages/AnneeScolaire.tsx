import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { validate, type FormErrors } from "@/lib/validate";
import { anneeScolaireSchema, trimestreSchema, vacanceSchema, jourFerieSchema } from "@/lib/annee-schema";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  CalendarDays,
  Sun,
  Star,
  ArrowRightLeft,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAllAnneesScolaires,
  useCreateAnneeScolaire,
  useUpdateAnneeScolaire,
  useCloturerAnneeScolaire,
  useActivateAnneeScolaire,
  useTrimestres,
  useCreateTrimestre,
  useUpdateTrimestre,
  useDeleteTrimestre,
  useVacances,
  useCreateVacance,
  useDeleteVacance,
  useJoursFeries,
  useCreateJourFerie,
  useDeleteJourFerie,
} from "@/hooks/useAnneeScolaire";
import { usePassages, useCreatePassage, useBulkCreatePassages } from "@/hooks/usePassages";
import { useAllStudents } from "@/hooks/useStudents";
import { useNiveaux } from "@/hooks/useNiveaux";
import { DataTable } from "@/components/DataTable";
import type { AnneeScolaire, Trimestre, Vacance, JourFerie } from "@/types/annee-scolaire";
import type { Passage, DECISIONS } from "@/types/passage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

/**
 * Extracts the leading number from a niveau name (e.g. "1ère année" → 1).
 * Used to enforce the "no skip level" rule on passages.
 */
function leadingDigit(nom: string | null | undefined): number | null {
  if (!nom) return null;
  const m = nom.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * Returns the niveau whose leading digit is exactly current+1, or null if none.
 * Mirrors the backend rule in PassageService.nextNiveauName.
 */
function nextNiveauName(current: string, niveaux: { nom: string }[]): string | null {
  const cur = leadingDigit(current);
  if (cur == null) return null;
  return niveaux.find((n) => leadingDigit(n.nom) === cur + 1)?.nom ?? null;
}

export default function AnneeScolairePage() {
  const [selectedAnneeId, setSelectedAnneeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trimestres");

  // Annee form
  const [anneeFormOpen, setAnneeFormOpen] = useState(false);
  const [editAnnee, setEditAnnee] = useState<AnneeScolaire | null>(null);
  const [anneeForm, setAnneeForm] = useState({ label: "", dateDebut: "", dateFin: "" });
  const [anneeErrors, setAnneeErrors] = useState<FormErrors>({});
  const [trimestreErrors, setTrimestreErrors] = useState<FormErrors>({});
  const [vacanceErrors, setVacanceErrors] = useState<FormErrors>({});
  const [jourFerieErrors, setJourFerieErrors] = useState<FormErrors>({});

  // Trimestre form
  const [trimestreFormOpen, setTrimestreFormOpen] = useState(false);
  const [editTrimestreId, setEditTrimestreId] = useState<string | null>(null);
  const [trimestreForm, setTrimestreForm] = useState({
    numero: 1,
    label: "",
    dateDebut: "",
    dateFin: "",
    saisieNotesOuverte: false,
  });

  // Vacance form
  const [vacanceFormOpen, setVacanceFormOpen] = useState(false);
  const [vacanceForm, setVacanceForm] = useState({ label: "", dateDebut: "", dateFin: "" });

  // Jour ferie form
  const [jourFerieFormOpen, setJourFerieFormOpen] = useState(false);
  const [jourFerieForm, setJourFerieForm] = useState({ label: "", date: "" });

  // Delete targets
  const [deleteTrimestreId, setDeleteTrimestreId] = useState<string | null>(null);
  const [deleteVacanceId, setDeleteVacanceId] = useState<string | null>(null);
  const [deleteJourFerieId, setDeleteJourFerieId] = useState<string | null>(null);

  // Passage form
  const [passageFormOpen, setPassageFormOpen] = useState(false);
  const [passageForm, setPassageForm] = useState({
    studentId: "",
    ancienNiveau: "",
    nouveauNiveau: "",
    ancienneClasse: "",
    nouvelleClasse: "",
    decision: "PASSAGE" as "PASSAGE" | "REDOUBLEMENT" | "EXCLUSION" | "TRANSFERT",
    motif: "",
  });
  const [passageNiveauFiltre, setPassageNiveauFiltre] = useState("");
  const [passageClasseFiltre, setPassageClasseFiltre] = useState("");

  // Bulk passage state
  const [bulkPassageOpen, setBulkPassageOpen] = useState(false);
  const [bulkClasse, setBulkClasse] = useState("");
  const [bulkDecision, setBulkDecision] = useState<"PASSAGE" | "REDOUBLEMENT" | "EXCLUSION" | "TRANSFERT">("PASSAGE");
  const [bulkNouveauNiveau, setBulkNouveauNiveau] = useState("");
  const [bulkNouvelleClasse, setBulkNouvelleClasse] = useState("");

  const { data: annees = [], isLoading } = useAllAnneesScolaires();

  // Auto-sélectionne l'année active au premier chargement pour que la
  // section "Trimestres / Vacances / Jours fériés / Passages" apparaisse
  // sans clic préalable.
  useEffect(() => {
    if (selectedAnneeId || annees.length === 0) return;
    const active = annees.find((a) => a.active) ?? annees[0];
    if (active) setSelectedAnneeId(active.id);
  }, [annees, selectedAnneeId]);
  const createAnneeMutation = useCreateAnneeScolaire();
  const updateAnneeMutation = useUpdateAnneeScolaire();
  const cloturerMutation = useCloturerAnneeScolaire();
  const activateMutation = useActivateAnneeScolaire();

  const { data: trimestres = [] } = useTrimestres(selectedAnneeId);
  const createTrimestreMutation = useCreateTrimestre();
  const updateTrimestreMutation = useUpdateTrimestre();
  const deleteTrimestreMutation = useDeleteTrimestre();

  const { data: vacances = [] } = useVacances(selectedAnneeId);
  const createVacanceMutation = useCreateVacance();
  const deleteVacanceMutation = useDeleteVacance();

  const { data: joursFeries = [] } = useJoursFeries(selectedAnneeId);
  const createJourFerieMutation = useCreateJourFerie();
  const deleteJourFerieMutation = useDeleteJourFerie();

  // Passages
  const selectedAnneeLabel = annees.find((a) => a.id === selectedAnneeId)?.label || "2025-2026";
  const { data: passages = [] } = usePassages(selectedAnneeLabel);
  const createPassageMutation = useCreatePassage();
  const bulkCreatePassagesMutation = useBulkCreatePassages();
  const { data: allStudents = [] } = useAllStudents();
  const studentsInClasse = bulkClasse ? allStudents.filter((s) => s.classe === bulkClasse) : [];
  const { niveaux, getClassesForNiveau } = useNiveaux();
  const passageClasses = passageNiveauFiltre ? getClassesForNiveau(passageNiveauFiltre) : [];
  const passageFilteredStudents = useMemo(() => {
    if (passageClasseFiltre) return allStudents.filter((s) => s.classe === passageClasseFiltre);
    if (passageNiveauFiltre) return allStudents.filter((s) => s.niveau === passageNiveauFiltre);
    return allStudents;
  }, [allStudents, passageNiveauFiltre, passageClasseFiltre]);

  // Passage table pagination & filters
  const [passagePage, setPassagePage] = useState(0);
  const [passageTableNiveau, setPassageTableNiveau] = useState("");
  const [passageTableClasse, setPassageTableClasse] = useState("");
  const PASSAGE_PAGE_SIZE = 10;

  const filteredPassages = useMemo(() => {
    let result = passages;
    if (passageTableNiveau) result = result.filter((p) => p.ancienNiveau === passageTableNiveau);
    if (passageTableClasse) result = result.filter((p) => p.ancienneClasse === passageTableClasse);
    return result;
  }, [passages, passageTableNiveau, passageTableClasse]);

  const totalPassagePages = Math.ceil(filteredPassages.length / PASSAGE_PAGE_SIZE);

  const paginatedPassages = useMemo(() => {
    const start = passagePage * PASSAGE_PAGE_SIZE;
    return filteredPassages.slice(start, start + PASSAGE_PAGE_SIZE);
  }, [filteredPassages, passagePage]);

  const passageFilterClasses = useMemo(() => {
    const niveauPassages = passageTableNiveau ? passages.filter((p) => p.ancienNiveau === passageTableNiveau) : passages;
    return [...new Set(niveauPassages.map((p) => p.ancienneClasse).filter(Boolean))];
  }, [passages, passageTableNiveau]);

  // Reset page when filters change
  useEffect(() => { setPassagePage(0); }, [passageTableNiveau, passageTableClasse]);

  const selectedAnnee = annees.find((a) => a.id === selectedAnneeId);

  // Reactive re-validation: once errors are shown, re-check on every form change
  useEffect(() => {
    if (Object.keys(anneeErrors).length === 0) return;
    const result = validate(anneeScolaireSchema, anneeForm);
    setAnneeErrors(result.ok ? {} : result.errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anneeForm]);

  useEffect(() => {
    if (Object.keys(trimestreErrors).length === 0) return;
    const result = validate(trimestreSchema, trimestreForm);
    setTrimestreErrors(result.ok ? {} : result.errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimestreForm]);

  useEffect(() => {
    if (Object.keys(vacanceErrors).length === 0) return;
    const result = validate(vacanceSchema, vacanceForm);
    setVacanceErrors(result.ok ? {} : result.errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacanceForm]);

  useEffect(() => {
    if (Object.keys(jourFerieErrors).length === 0) return;
    const result = validate(jourFerieSchema, jourFerieForm);
    setJourFerieErrors(result.ok ? {} : result.errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jourFerieForm]);

  const openCreateAnnee = () => {
    setEditAnnee(null);
    setAnneeForm({ label: "", dateDebut: "", dateFin: "" });
    setAnneeErrors({});
    setAnneeFormOpen(true);
  };

  const openEditAnnee = (a: AnneeScolaire) => {
    setEditAnnee(a);
    setAnneeForm({ label: a.label, dateDebut: a.dateDebut, dateFin: a.dateFin });
    setAnneeErrors({});
    setAnneeFormOpen(true);
  };

  const handleSaveAnnee = () => {
    const result = validate(anneeScolaireSchema, anneeForm);
    if (!result.ok) {
      setAnneeErrors(result.errors);
      return;
    }
    setAnneeErrors({});
    const onError = (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
      const status = err.response?.status;
      const msg = err.response?.data?.message ?? "Erreur lors de l'enregistrement";
      if (status === 409) setAnneeErrors({ label: msg });
      else setAnneeErrors({ _root: msg });
    };
    if (editAnnee) {
      updateAnneeMutation.mutate(
        { id: editAnnee.id, data: result.data },
        { onSuccess: () => setAnneeFormOpen(false), onError }
      );
    } else {
      createAnneeMutation.mutate(result.data, {
        onSuccess: () => setAnneeFormOpen(false),
        onError,
      });
    }
  };

  const apiError = (setter: (e: FormErrors) => void) => (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message ?? "Erreur lors de l'enregistrement";
    if (status === 409) setter({ label: msg });
    else setter({ _root: msg });
  };

  const handleSaveTrimestre = () => {
    if (!selectedAnneeId) return;
    const result = validate(trimestreSchema, trimestreForm);
    if (!result.ok) { setTrimestreErrors(result.errors); return; }
    setTrimestreErrors({});
    const onSuccess = () => {
      setTrimestreFormOpen(false);
      setEditTrimestreId(null);
    };
    if (editTrimestreId) {
      updateTrimestreMutation.mutate(
        { id: editTrimestreId, data: result.data },
        { onSuccess, onError: apiError(setTrimestreErrors) }
      );
    } else {
      createTrimestreMutation.mutate(
        { anneeScolaireId: selectedAnneeId, data: result.data },
        { onSuccess, onError: apiError(setTrimestreErrors) }
      );
    }
  };

  const openEditTrimestre = (t: Trimestre) => {
    setEditTrimestreId(t.id);
    setTrimestreForm({
      numero: t.numero,
      label: t.label,
      dateDebut: t.dateDebut,
      dateFin: t.dateFin,
      saisieNotesOuverte: t.saisieNotesOuverte,
    });
    setTrimestreErrors({});
    setTrimestreFormOpen(true);
  };

  const handleCreateVacance = () => {
    if (!selectedAnneeId) return;
    const result = validate(vacanceSchema, vacanceForm);
    if (!result.ok) { setVacanceErrors(result.errors); return; }
    setVacanceErrors({});
    createVacanceMutation.mutate(
      { anneeScolaireId: selectedAnneeId, data: result.data },
      { onSuccess: () => setVacanceFormOpen(false), onError: apiError(setVacanceErrors) }
    );
  };

  const handleCreateJourFerie = () => {
    if (!selectedAnneeId) return;
    const result = validate(jourFerieSchema, jourFerieForm);
    if (!result.ok) { setJourFerieErrors(result.errors); return; }
    setJourFerieErrors({});
    createJourFerieMutation.mutate(
      { anneeScolaireId: selectedAnneeId, data: result.data },
      { onSuccess: () => setJourFerieFormOpen(false), onError: apiError(setJourFerieErrors) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Annee Scolaire</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerez les annees scolaires, trimestres et vacances</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={openCreateAnnee}>
          <Plus className="h-4 w-4" />
          Nouvelle annee
        </Button>
      </motion.div>

      {/* Annees list */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {annees.map((annee) => (
          <div
            key={annee.id}
            className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              selectedAnneeId === annee.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border/50 bg-card"
            }`}
            onClick={() => setSelectedAnneeId(annee.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-heading font-bold text-foreground">{annee.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {annee.active && (
                  <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                )}
                {annee.cloturee && (
                  <Badge className="bg-red-100 text-red-700">Cloturee</Badge>
                )}
                {!annee.active && !annee.cloturee && (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(annee.dateDebut).toLocaleDateString("fr-FR")} -{" "}
              {new Date(annee.dateFin).toLocaleDateString("fr-FR")}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditAnnee(annee); }}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              {!annee.active && !annee.cloturee && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={(e) => { e.stopPropagation(); activateMutation.mutate(annee.id); }}>
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              )}
              {annee.active && !annee.cloturee && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={(e) => { e.stopPropagation(); cloturerMutation.mutate(annee.id); }}>
                  <Lock className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {annees.length === 0 && (
          <div className="col-span-full rounded-xl border border-border/50 bg-card p-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Aucune annee scolaire</p>
            <p className="text-xs text-muted-foreground mt-1">Creez une nouvelle annee scolaire pour commencer</p>
          </div>
        )}
      </motion.div>

      {/* Selected year details */}
      {selectedAnneeId && selectedAnnee && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold text-foreground">
                {selectedAnnee.label} - Details
              </h2>
              <TabsList>
                <TabsTrigger value="trimestres">Trimestres</TabsTrigger>
                <TabsTrigger value="vacances">Vacances</TabsTrigger>
                <TabsTrigger value="jours-feries">Jours feries</TabsTrigger>
                <TabsTrigger value="passages" className="gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Passages
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Trimestres */}
            <TabsContent value="trimestres" className="space-y-3">
              <div className="flex items-center justify-end gap-3">
                {trimestres.length >= 3 && (
                  <p className="text-xs text-muted-foreground">Maximum de 3 trimestres atteint</p>
                )}
                <Button size="sm" variant="outline" className="gap-1.5" disabled={trimestres.length >= 3} onClick={() => {
                  setEditTrimestreId(null);
                  setTrimestreForm({ numero: trimestres.length + 1, label: `Trimestre ${trimestres.length + 1}`, dateDebut: "", dateFin: "", saisieNotesOuverte: false });
                  setTrimestreErrors({});
                  setTrimestreFormOpen(true);
                }}>
                  <Plus className="h-4 w-4" />
                  Ajouter un trimestre
                </Button>
              </div>
              {trimestres.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun trimestre defini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trimestres.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 p-3">
                      <div>
                        <p className="font-medium text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.dateDebut).toLocaleDateString("fr-FR")} - {new Date(t.dateFin).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={t.saisieNotesOuverte ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                          {t.saisieNotesOuverte ? "Notes ouvertes" : "Notes fermees"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditTrimestre(t)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTrimestreId(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Vacances */}
            <TabsContent value="vacances" className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                  setVacanceForm({ label: "", dateDebut: "", dateFin: "" });
                  setVacanceErrors({});
                  setVacanceFormOpen(true);
                }}>
                  <Plus className="h-4 w-4" />
                  Ajouter des vacances
                </Button>
              </div>
              {vacances.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Sun className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune periode de vacances definie</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vacances.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 p-3">
                      <div>
                        <p className="font-medium text-foreground">{v.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.dateDebut).toLocaleDateString("fr-FR")} - {new Date(v.dateFin).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDeleteVacanceId(v.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Jours Feries */}
            <TabsContent value="jours-feries" className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                  setJourFerieForm({ label: "", date: "" });
                  setJourFerieErrors({});
                  setJourFerieFormOpen(true);
                }}>
                  <Plus className="h-4 w-4" />
                  Ajouter un jour ferie
                </Button>
              </div>
              {joursFeries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun jour ferie defini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {joursFeries.map((jf) => (
                    <div key={jf.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 p-3">
                      <div>
                        <p className="font-medium text-foreground">{jf.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(jf.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => setDeleteJourFerieId(jf.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Passages */}
            <TabsContent value="passages" className="space-y-3">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                  setBulkClasse("");
                  setBulkDecision("PASSAGE");
                  setBulkNouveauNiveau("");
                  setBulkNouvelleClasse("");
                  setBulkPassageOpen(true);
                }}>
                  <Users className="h-4 w-4" />
                  Passage en masse
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                  setPassageForm({ studentId: "", ancienNiveau: "", nouveauNiveau: "", ancienneClasse: "", nouvelleClasse: "", decision: "PASSAGE", motif: "" });
                  setPassageNiveauFiltre("");
                  setPassageClasseFiltre("");
                  setPassageFormOpen(true);
                }}>
                  <Plus className="h-4 w-4" />
                  Ajouter un passage
                </Button>
              </div>
              {/* Filtres */}
              <div className="flex gap-3">
                <Select value={passageTableNiveau} onValueChange={(v) => { setPassageTableNiveau(v); setPassageTableClasse(""); }}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Niveau" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les niveaux</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.nom}>{n.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={passageTableClasse} onValueChange={setPassageTableClasse} disabled={!passageTableNiveau}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Classe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les classes</SelectItem>
                    {passageFilterClasses.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DataTable
                columns={[
                  { key: "studentName", header: "Eleve" },
                  {
                    key: "decision",
                    header: "Decision",
                    render: (p) => (
                      <Badge variant="outline" className={
                        p.decision === "PASSAGE" ? "bg-emerald-100 text-emerald-700" :
                        p.decision === "REDOUBLEMENT" ? "bg-amber-100 text-amber-700" :
                        p.decision === "EXCLUSION" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }>
                        {p.decision}
                      </Badge>
                    ),
                  },
                  {
                    key: "parcours",
                    header: "Parcours",
                    render: (p) => (
                      <span className="text-sm">
                        {p.ancienneClasse || p.ancienNiveau} &rarr; {p.nouvelleClasse || p.nouveauNiveau}
                      </span>
                    ),
                  },
                  {
                    key: "motif",
                    header: "Motif",
                    render: (p) => p.motif ? <span className="text-sm italic">{p.motif}</span> : <span className="text-sm text-muted-foreground">-</span>,
                  },
                  {
                    key: "createdAt",
                    header: "Date",
                    render: (p) => p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "-",
                  },
                ]}
                data={paginatedPassages}
                emptyMessage="Aucun passage enregistre pour cette annee"
                emptyDescription="Ajoutez un passage via le bouton ci-dessus."
                pagination={{
                  page: passagePage,
                  totalPages: totalPassagePages,
                  onPageChange: setPassagePage,
                }}
              />
            </TabsContent>
          </motion.div>
        </Tabs>
      )}

      {/* Single Passage Dialog */}
      <Dialog open={passageFormOpen} onOpenChange={setPassageFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un passage</DialogTitle>
            <DialogDescription>
              Enregistrez la decision de fin d'annee pour un eleve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Niveau</Label>
                <Select value={passageNiveauFiltre || "all"} onValueChange={(v) => {
                  setPassageNiveauFiltre(v === "all" ? "" : v);
                  setPassageClasseFiltre("");
                  setPassageForm({ ...passageForm, studentId: "", ancienNiveau: v === "all" ? "" : v, ancienneClasse: "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Filtrer par niveau..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.nom}>{n.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Classe</Label>
                <Select value={passageClasseFiltre || "all"} onValueChange={(v) => {
                  setPassageClasseFiltre(v === "all" ? "" : v);
                  setPassageForm({ ...passageForm, studentId: "" });
                }} disabled={!passageNiveauFiltre}>
                  <SelectTrigger><SelectValue placeholder="Filtrer par classe..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {passageClasses.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Eleve</Label>
              <Select value={passageForm.studentId || ""} onValueChange={(v) => {
                const student = passageFilteredStudents.find((s) => s.id === v);
                const ancien = student?.niveau || "";
                const auto = passageForm.decision === "PASSAGE"
                  ? (nextNiveauName(ancien, niveaux) ?? "")
                  : passageForm.decision === "REDOUBLEMENT"
                    ? ancien
                    : passageForm.nouveauNiveau;
                setPassageForm({
                  ...passageForm,
                  studentId: v,
                  ancienNiveau: ancien,
                  ancienneClasse: student?.classe || "",
                  nouveauNiveau: auto,
                  nouvelleClasse: "",
                });
              }}>
                <SelectTrigger><SelectValue placeholder="Selectionner un eleve..." /></SelectTrigger>
                <SelectContent>
                  {passageFilteredStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.classe})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Decision</Label>
              <Select value={passageForm.decision} onValueChange={(v) => {
                const decision = v as typeof passageForm.decision;
                const auto = decision === "PASSAGE"
                  ? (nextNiveauName(passageForm.ancienNiveau, niveaux) ?? "")
                  : decision === "REDOUBLEMENT"
                    ? passageForm.ancienNiveau
                    : passageForm.nouveauNiveau;
                setPassageForm({ ...passageForm, decision, nouveauNiveau: auto, nouvelleClasse: "" });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSAGE">Passage</SelectItem>
                  <SelectItem value="REDOUBLEMENT">Redoublement</SelectItem>
                  <SelectItem value="EXCLUSION">Exclusion</SelectItem>
                  <SelectItem value="TRANSFERT">Transfert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {passageForm.decision === "PASSAGE" && passageForm.ancienNiveau && !nextNiveauName(passageForm.ancienNiveau, niveaux) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Aucun niveau supérieur n'est configuré après « {passageForm.ancienNiveau} ». Choisissez une autre décision.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nouveau niveau</Label>
                <Select
                  value={passageForm.nouveauNiveau}
                  onValueChange={(v) => setPassageForm({ ...passageForm, nouveauNiveau: v, nouvelleClasse: "" })}
                  disabled={passageForm.decision === "PASSAGE" || passageForm.decision === "REDOUBLEMENT"}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner un niveau..." /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      if (passageForm.decision === "PASSAGE") {
                        const next = nextNiveauName(passageForm.ancienNiveau, niveaux);
                        return next ? [next] : [];
                      }
                      if (passageForm.decision === "REDOUBLEMENT") {
                        return passageForm.ancienNiveau ? [passageForm.ancienNiveau] : [];
                      }
                      return niveaux.map((n) => n.nom);
                    })().map((nom) => (
                      <SelectItem key={nom} value={nom}>{nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nouvelle classe</Label>
                <Select
                  value={passageForm.nouvelleClasse}
                  onValueChange={(v) => setPassageForm({ ...passageForm, nouvelleClasse: v })}
                  disabled={!passageForm.nouveauNiveau}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner une classe..." /></SelectTrigger>
                  <SelectContent>
                    {getClassesForNiveau(passageForm.nouveauNiveau).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motif</Label>
              <Input value={passageForm.motif} onChange={(e) => setPassageForm({ ...passageForm, motif: e.target.value })} placeholder="Motif (optionnel)" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={() => {
              createPassageMutation.mutate({
                studentId: passageForm.studentId,
                ancienNiveau: passageForm.ancienNiveau,
                nouveauNiveau: passageForm.nouveauNiveau,
                ancienneClasse: passageForm.ancienneClasse,
                nouvelleClasse: passageForm.nouvelleClasse,
                decision: passageForm.decision,
                anneeScolaire: selectedAnneeLabel,
                motif: passageForm.motif,
              }, {
                onSuccess: () => { toast.success("Passage enregistré"); setPassageFormOpen(false); },
                onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Erreur lors de l'enregistrement"),
              });
            }} disabled={
              createPassageMutation.isPending
              || !passageForm.studentId
              || (passageForm.decision === "PASSAGE" && !nextNiveauName(passageForm.ancienNiveau, niveaux))
              || ((passageForm.decision === "PASSAGE" || passageForm.decision === "REDOUBLEMENT") && !passageForm.nouveauNiveau)
            }>
              {createPassageMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Passage Dialog */}
      <Dialog open={bulkPassageOpen} onOpenChange={setBulkPassageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Passage en masse</DialogTitle>
            <DialogDescription>
              Selectionnez une classe pour appliquer une decision a tous les eleves.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Classe</Label>
              <Select value={bulkClasse} onValueChange={(c) => {
                setBulkClasse(c);
                const classNiveau = allStudents.find((s) => s.classe === c)?.niveau || "";
                const auto = bulkDecision === "PASSAGE"
                  ? (nextNiveauName(classNiveau, niveaux) ?? "")
                  : bulkDecision === "REDOUBLEMENT"
                    ? classNiveau
                    : bulkNouveauNiveau;
                setBulkNouveauNiveau(auto);
                setBulkNouvelleClasse("");
              }}>
                <SelectTrigger><SelectValue placeholder="Selectionner une classe..." /></SelectTrigger>
                <SelectContent>
                  {[...new Set(allStudents.map((s) => s.classe).filter(Boolean))].sort().map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bulkClasse && (
              <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <p className="text-sm font-medium text-foreground">{studentsInClasse.length} eleve(s) dans la classe {bulkClasse}</p>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {studentsInClasse.map((s) => (
                    <p key={s.id} className="text-xs text-muted-foreground">{s.prenom} {s.nom}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Decision</Label>
              <Select value={bulkDecision} onValueChange={(v) => {
                const decision = v as typeof bulkDecision;
                const classNiveau = studentsInClasse[0]?.niveau || "";
                const auto = decision === "PASSAGE"
                  ? (nextNiveauName(classNiveau, niveaux) ?? "")
                  : decision === "REDOUBLEMENT"
                    ? classNiveau
                    : bulkNouveauNiveau;
                setBulkDecision(decision);
                setBulkNouveauNiveau(auto);
                setBulkNouvelleClasse("");
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSAGE">Passage</SelectItem>
                  <SelectItem value="REDOUBLEMENT">Redoublement</SelectItem>
                  <SelectItem value="EXCLUSION">Exclusion</SelectItem>
                  <SelectItem value="TRANSFERT">Transfert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const classNiveau = studentsInClasse[0]?.niveau || "";
              if (bulkDecision !== "PASSAGE" || !classNiveau) return null;
              if (nextNiveauName(classNiveau, niveaux)) return null;
              return (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Aucun niveau supérieur n'est configuré après « {classNiveau} ». Choisissez une autre décision.
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nouveau niveau</Label>
                <Select
                  value={bulkNouveauNiveau}
                  onValueChange={(v) => { setBulkNouveauNiveau(v); setBulkNouvelleClasse(""); }}
                  disabled={bulkDecision === "PASSAGE" || bulkDecision === "REDOUBLEMENT"}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner un niveau..." /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const classNiveau = studentsInClasse[0]?.niveau || "";
                      if (bulkDecision === "PASSAGE") {
                        const next = nextNiveauName(classNiveau, niveaux);
                        return next ? [next] : [];
                      }
                      if (bulkDecision === "REDOUBLEMENT") {
                        return classNiveau ? [classNiveau] : [];
                      }
                      return niveaux.map((n) => n.nom);
                    })().map((nom) => (
                      <SelectItem key={nom} value={nom}>{nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nouvelle classe</Label>
                <Select
                  value={bulkNouvelleClasse}
                  onValueChange={setBulkNouvelleClasse}
                  disabled={!bulkNouveauNiveau}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner une classe..." /></SelectTrigger>
                  <SelectContent>
                    {getClassesForNiveau(bulkNouveauNiveau).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={() => {
              const passagesList = studentsInClasse.map((s) => ({
                studentId: s.id,
                ancienNiveau: s.niveau || "",
                nouveauNiveau: bulkNouveauNiveau,
                ancienneClasse: s.classe || "",
                nouvelleClasse: bulkNouvelleClasse,
                decision: bulkDecision,
                anneeScolaire: selectedAnneeLabel,
                motif: "",
              }));
              bulkCreatePassagesMutation.mutate({ passages: passagesList }, {
                onSuccess: () => { toast.success(`Passage en masse appliqué à ${passagesList.length} élève(s)`); setBulkPassageOpen(false); },
                onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Erreur lors du traitement en masse"),
              });
            }} disabled={
              bulkCreatePassagesMutation.isPending
              || !bulkClasse
              || studentsInClasse.length === 0
              || (bulkDecision === "PASSAGE" && !nextNiveauName(studentsInClasse[0]?.niveau || "", niveaux))
              || ((bulkDecision === "PASSAGE" || bulkDecision === "REDOUBLEMENT") && !bulkNouveauNiveau)
            }>
              {bulkCreatePassagesMutation.isPending ? "Traitement..." : `Appliquer a ${studentsInClasse.length} eleve(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Annee Dialog */}
      <Dialog open={anneeFormOpen} onOpenChange={setAnneeFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editAnnee ? "Modifier l'annee scolaire" : "Nouvelle annee scolaire"}</DialogTitle>
            <DialogDescription>
              {editAnnee ? "Modifiez les informations de l'annee scolaire." : "Definissez les dates de la nouvelle annee scolaire."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {anneeErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {anneeErrors._root}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="anneeLabel">Libellé *</Label>
              <Input
                id="anneeLabel"
                value={anneeForm.label}
                onChange={(e) => setAnneeForm({ ...anneeForm, label: e.target.value })}
                placeholder="Ex: 2025-2026"
                aria-invalid={!!anneeErrors.label}
                className={anneeErrors.label ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {anneeErrors.label && <p className="text-xs text-red-600">{anneeErrors.label}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anneeDebut">Date début *</Label>
                <Input
                  id="anneeDebut"
                  type="date"
                  value={anneeForm.dateDebut}
                  onChange={(e) => setAnneeForm({ ...anneeForm, dateDebut: e.target.value })}
                  aria-invalid={!!anneeErrors.dateDebut}
                  className={anneeErrors.dateDebut ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {anneeErrors.dateDebut && <p className="text-xs text-red-600">{anneeErrors.dateDebut}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anneeFin">Date fin *</Label>
                <Input
                  id="anneeFin"
                  type="date"
                  value={anneeForm.dateFin}
                  onChange={(e) => setAnneeForm({ ...anneeForm, dateFin: e.target.value })}
                  aria-invalid={!!anneeErrors.dateFin}
                  className={anneeErrors.dateFin ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {anneeErrors.dateFin && <p className="text-xs text-red-600">{anneeErrors.dateFin}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveAnnee} disabled={createAnneeMutation.isPending || updateAnneeMutation.isPending}>
              {(createAnneeMutation.isPending || updateAnneeMutation.isPending) ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Trimestre Dialog */}
      <Dialog open={trimestreFormOpen} onOpenChange={(open) => { setTrimestreFormOpen(open); if (!open) setEditTrimestreId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTrimestreId ? "Modifier le trimestre" : "Ajouter un trimestre"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {trimestreErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{trimestreErrors._root}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trimestreNum">Numéro *</Label>
                <Input id="trimestreNum" type="number" min={1} max={4} value={trimestreForm.numero} onChange={(e) => setTrimestreForm({ ...trimestreForm, numero: Number(e.target.value) })} aria-invalid={!!trimestreErrors.numero} className={trimestreErrors.numero ? "border-red-500" : ""} />
                {trimestreErrors.numero && <p className="text-xs text-red-600">{trimestreErrors.numero}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trimestreLabel">Libellé *</Label>
                <Input id="trimestreLabel" value={trimestreForm.label} onChange={(e) => setTrimestreForm({ ...trimestreForm, label: e.target.value })} aria-invalid={!!trimestreErrors.label} className={trimestreErrors.label ? "border-red-500" : ""} />
                {trimestreErrors.label && <p className="text-xs text-red-600">{trimestreErrors.label}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trimestreDebut">Date début *</Label>
                <Input id="trimestreDebut" type="date" value={trimestreForm.dateDebut} onChange={(e) => setTrimestreForm({ ...trimestreForm, dateDebut: e.target.value })} aria-invalid={!!trimestreErrors.dateDebut} className={trimestreErrors.dateDebut ? "border-red-500" : ""} />
                {trimestreErrors.dateDebut && <p className="text-xs text-red-600">{trimestreErrors.dateDebut}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trimestreFin">Date fin *</Label>
                <Input id="trimestreFin" type="date" value={trimestreForm.dateFin} onChange={(e) => setTrimestreForm({ ...trimestreForm, dateFin: e.target.value })} aria-invalid={!!trimestreErrors.dateFin} className={trimestreErrors.dateFin ? "border-red-500" : ""} />
                {trimestreErrors.dateFin && <p className="text-xs text-red-600">{trimestreErrors.dateFin}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="saisieNotes" checked={trimestreForm.saisieNotesOuverte} onChange={(e) => setTrimestreForm({ ...trimestreForm, saisieNotesOuverte: e.target.checked })} className="h-4 w-4 rounded border-border" />
              <Label htmlFor="saisieNotes">Saisie des notes ouverte</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveTrimestre} disabled={createTrimestreMutation.isPending || updateTrimestreMutation.isPending}>
              {(createTrimestreMutation.isPending || updateTrimestreMutation.isPending)
                ? (editTrimestreId ? "Enregistrement..." : "Creation...")
                : (editTrimestreId ? "Enregistrer" : "Ajouter")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Vacance Dialog */}
      <Dialog open={vacanceFormOpen} onOpenChange={setVacanceFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des vacances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {vacanceErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{vacanceErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="vacanceLabel">Libellé *</Label>
              <Input id="vacanceLabel" value={vacanceForm.label} onChange={(e) => setVacanceForm({ ...vacanceForm, label: e.target.value })} placeholder="Ex: Vacances d'hiver" aria-invalid={!!vacanceErrors.label} className={vacanceErrors.label ? "border-red-500" : ""} />
              {vacanceErrors.label && <p className="text-xs text-red-600">{vacanceErrors.label}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vacanceDebut">Date début *</Label>
                <Input id="vacanceDebut" type="date" value={vacanceForm.dateDebut} onChange={(e) => setVacanceForm({ ...vacanceForm, dateDebut: e.target.value })} aria-invalid={!!vacanceErrors.dateDebut} className={vacanceErrors.dateDebut ? "border-red-500" : ""} />
                {vacanceErrors.dateDebut && <p className="text-xs text-red-600">{vacanceErrors.dateDebut}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vacanceFin">Date fin *</Label>
                <Input id="vacanceFin" type="date" value={vacanceForm.dateFin} onChange={(e) => setVacanceForm({ ...vacanceForm, dateFin: e.target.value })} aria-invalid={!!vacanceErrors.dateFin} className={vacanceErrors.dateFin ? "border-red-500" : ""} />
                {vacanceErrors.dateFin && <p className="text-xs text-red-600">{vacanceErrors.dateFin}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleCreateVacance} disabled={createVacanceMutation.isPending}>
              {createVacanceMutation.isPending ? "Creation..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Jour Ferie Dialog */}
      <Dialog open={jourFerieFormOpen} onOpenChange={setJourFerieFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un jour ferie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {jourFerieErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{jourFerieErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="jfLabel">Libellé *</Label>
              <Input id="jfLabel" value={jourFerieForm.label} onChange={(e) => setJourFerieForm({ ...jourFerieForm, label: e.target.value })} placeholder="Ex: Fête de l'indépendance" aria-invalid={!!jourFerieErrors.label} className={jourFerieErrors.label ? "border-red-500" : ""} />
              {jourFerieErrors.label && <p className="text-xs text-red-600">{jourFerieErrors.label}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jfDate">Date *</Label>
              <Input id="jfDate" type="date" value={jourFerieForm.date} onChange={(e) => setJourFerieForm({ ...jourFerieForm, date: e.target.value })} aria-invalid={!!jourFerieErrors.date} className={jourFerieErrors.date ? "border-red-500" : ""} />
              {jourFerieErrors.date && <p className="text-xs text-red-600">{jourFerieErrors.date}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleCreateJourFerie} disabled={createJourFerieMutation.isPending}>
              {createJourFerieMutation.isPending ? "Creation..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trimestre Confirmation */}
      <Dialog open={deleteTrimestreId !== null} onOpenChange={(open) => !open && setDeleteTrimestreId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le trimestre</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer ce trimestre ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteTrimestreId !== null) deleteTrimestreMutation.mutate(deleteTrimestreId, { onSuccess: () => setDeleteTrimestreId(null) }); }} disabled={deleteTrimestreMutation.isPending}>
              {deleteTrimestreMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vacance Confirmation */}
      <Dialog open={deleteVacanceId !== null} onOpenChange={(open) => !open && setDeleteVacanceId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer les vacances</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer cette periode de vacances ?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteVacanceId !== null) deleteVacanceMutation.mutate(deleteVacanceId, { onSuccess: () => setDeleteVacanceId(null) }); }} disabled={deleteVacanceMutation.isPending}>
              {deleteVacanceMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Jour Ferie Confirmation */}
      <Dialog open={deleteJourFerieId !== null} onOpenChange={(open) => !open && setDeleteJourFerieId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le jour ferie</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer ce jour ferie ?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteJourFerieId !== null) deleteJourFerieMutation.mutate(deleteJourFerieId, { onSuccess: () => setDeleteJourFerieId(null) }); }} disabled={deleteJourFerieMutation.isPending}>
              {deleteJourFerieMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
