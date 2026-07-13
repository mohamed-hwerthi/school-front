import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  GraduationCap,
  BookOpen,
  UserCog,
  CalendarRange,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { teachersApi } from "@/api/teachers.api";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import { useActiveAnneeScolaire, useAllAnneesScolaires } from "@/hooks/useAnneeScolaire";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import {
  useAffectations,
  useCreateAffectation,
  useBulkCreateAffectation,
  useDeleteAffectation,
  useUpdateAffectation,
} from "@/hooks/useAffectations";
import type { AffectationDTO, AffectationRequest } from "@/api/affectations.api";

const NONE = "none";

interface FormState {
  id: string | null;
  teacherId: string | "";
  niveauId: string | "";
  classeId: string | "";
  moduleId: string | null;
  anneeScolaire: string;
  dateDebut: string;
  dateFin: string;
  notes: string;
}

interface BulkState {
  teacherId: string | "";
  niveauIds: string[];
  classeIds: string[];
  /** NONE | `dom:<domaineName>` | `mod:<matiereName>` */
  target: string;
  anneeScolaire: string;
  dateDebut: string;
  dateFin: string;
  notes: string;
}

const emptyForm = (anneeScolaire: string): FormState => ({
  id: null,
  teacherId: "",
  niveauId: "",
  classeId: "",
  moduleId: null,
  anneeScolaire,
  dateDebut: "",
  dateFin: "",
  notes: "",
});

export default function AffectationsPage() {
  // ── data sources ─────────────────────────────────────────
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: teachersApi.getAll,
  });
  const { niveaux } = useNiveaux();
  const { data: allAnnees = [] } = useAllAnneesScolaires();
  const { data: activeAnnee } = useActiveAnneeScolaire();

  const defaultAnnee = activeAnnee?.label
    ?? allAnnees[0]?.label
    ?? getSelectedAnneeScolaire();

  // ── filters ──────────────────────────────────────────────
  const [filterAnnee, setFilterAnnee] = useState<string>(defaultAnnee);
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterNiveau, setFilterNiveau] = useState<string>("");
  const [filterClasse, setFilterClasse] = useState<string>("");
  const [filterModule, setFilterModule] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  // Cascading lookups for filter selects
  const filterNiveauId = filterNiveau ? filterNiveau : undefined;
  const { data: filterClasses = [] } = useClasses(filterNiveauId);
  const { data: filterModulesList = [] } = useModules(filterNiveauId);

  const { data: affectations = [], isLoading } = useAffectations({
    anneeScolaire: filterAnnee || undefined,
    teacherId: filterTeacher ? filterTeacher : undefined,
    classeId: filterClasse ? filterClasse : undefined,
    moduleId: filterModule ? filterModule : undefined,
  });

  // ── client-side text search across teacher/classe/matière names ───
  const visibleRows = useMemo<AffectationDTO[]>(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return affectations;
    return affectations.filter((a) =>
      a.teacherName.toLowerCase().includes(q)
      || a.classeName.toLowerCase().includes(q)
      || (a.moduleName ?? "").toLowerCase().includes(q)
    );
  }, [affectations, searchText]);

  // ── form state ───────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(defaultAnnee));

  // cascading selects in the form
  const { data: formClasses = [] } = useClasses(form.niveauId === "" ? undefined : form.niveauId);
  const { data: formModules = [] } = useModules(form.niveauId === "" ? undefined : form.niveauId);

  const createMutation = useCreateAffectation();
  const updateMutation = useUpdateAffectation();
  const deleteMutation = useDeleteAffectation();
  const bulkMutation = useBulkCreateAffectation();

  // ── bulk create state (multi niveau / multi classe / domaine) ──────
  const { data: allClasses = [] } = useClasses();
  const { data: allModules = [] } = useModules();

  const emptyBulk = (annee: string): BulkState => ({
    teacherId: "",
    niveauIds: [],
    classeIds: [],
    target: NONE,
    anneeScolaire: annee,
    dateDebut: "",
    dateFin: "",
    notes: "",
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState<BulkState>(emptyBulk(defaultAnnee));

  const openBulk = () => {
    setBulk(emptyBulk(filterAnnee || defaultAnnee));
    setBulkOpen(true);
  };

  // Modules/domaines available across the selected niveaux.
  const bulkModules = useMemo(
    () => allModules.filter((m) => bulk.niveauIds.includes(m.niveauId)),
    [allModules, bulk.niveauIds]
  );
  const bulkDomaines = useMemo(
    () => Array.from(new Set(bulkModules.map((m) => m.domaineName).filter(Boolean) as string[])).sort(),
    [bulkModules]
  );
  const bulkMatieres = useMemo(
    () => Array.from(new Set(bulkModules.map((m) => m.name).filter(Boolean))).sort(),
    [bulkModules]
  );

  const toggleBulkNiveau = (id: string) =>
    setBulk((b) => {
      const niveauIds = b.niveauIds.includes(id)
        ? b.niveauIds.filter((x) => x !== id)
        : [...b.niveauIds, id];
      // Drop selected classes whose niveau is no longer selected.
      const classeIds = b.classeIds.filter((cid) => {
        const c = allClasses.find((x) => x.id === cid);
        return c && niveauIds.includes(c.niveauId);
      });
      return { ...b, niveauIds, classeIds };
    });

  const toggleBulkClasse = (id: string) =>
    setBulk((b) => ({
      ...b,
      classeIds: b.classeIds.includes(id)
        ? b.classeIds.filter((x) => x !== id)
        : [...b.classeIds, id],
    }));

  const toggleAllClassesOfNiveau = (niveauId: string) =>
    setBulk((b) => {
      const ids = allClasses.filter((c) => c.niveauId === niveauId).map((c) => c.id);
      const allSelected = ids.length > 0 && ids.every((id) => b.classeIds.includes(id));
      return {
        ...b,
        classeIds: allSelected
          ? b.classeIds.filter((id) => !ids.includes(id))
          : Array.from(new Set([...b.classeIds, ...ids])),
      };
    });

  // Expand the (classes × target) selection into explicit affectation items.
  const expandBulkItems = (): { classeId: string; moduleId: string | null }[] => {
    const items: { classeId: string; moduleId: string | null }[] = [];
    for (const classeId of bulk.classeIds) {
      const classe = allClasses.find((c) => c.id === classeId);
      if (!classe) continue;
      if (bulk.target === NONE) {
        items.push({ classeId, moduleId: null });
      } else if (bulk.target.startsWith("dom:")) {
        const dom = bulk.target.slice(4);
        allModules
          .filter((m) => m.niveauId === classe.niveauId && m.domaineName === dom)
          .forEach((m) => items.push({ classeId, moduleId: m.id }));
      } else if (bulk.target.startsWith("mod:")) {
        const name = bulk.target.slice(4);
        const m = allModules.find((mm) => mm.niveauId === classe.niveauId && mm.name === name);
        if (m) items.push({ classeId, moduleId: m.id });
      }
    }
    return items;
  };

  const bulkPreviewCount = useMemo(
    () => expandBulkItems().length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulk, allClasses, allModules]
  );

  const bulkValid =
    bulk.teacherId !== "" && bulk.classeIds.length > 0 && bulk.anneeScolaire.trim() !== "";

  const submitBulk = () => {
    if (!bulkValid) return;
    const items = expandBulkItems();
    if (items.length === 0) {
      toast.error("Aucune matière correspondante pour la sélection.");
      return;
    }
    bulkMutation.mutate(
      {
        teacherId: bulk.teacherId,
        anneeScolaire: bulk.anneeScolaire,
        dateDebut: bulk.dateDebut || null,
        dateFin: bulk.dateFin || null,
        notes: bulk.notes || null,
        items,
      },
      {
        onSuccess: (res) => {
          toast.success(
            `${res.created} affectation(s) créée(s)` +
              (res.skipped ? `, ${res.skipped} ignorée(s) (déjà existante(s))` : "")
          );
          setBulkOpen(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || err?.message || "Erreur"),
      }
    );
  };

  const openEdit = (a: AffectationDTO) => {
    // Resolve niveauId from classeId so the niveau selector pre-fills correctly.
    // We don't have classes loaded for "any niveau", so walk niveaux.
    let niveauId: string | "" = "";
    for (const n of niveaux) {
      // best-effort: match the leading digit of fullName == leading digit of niveau name
      const lead = n.nom.match(/^(\d+)/)?.[1] ?? "";
      if (lead && a.classeName.startsWith(lead)) {
        niveauId = n.id;
        break;
      }
    }
    setForm({
      id: a.id,
      teacherId: a.teacherId,
      niveauId,
      classeId: a.classeId,
      moduleId: a.moduleId,
      anneeScolaire: a.anneeScolaire,
      dateDebut: a.dateDebut ?? "",
      dateFin: a.dateFin ?? "",
      notes: a.notes ?? "",
    });
    setOpen(true);
  };

  const isFormValid = form.teacherId !== "" && form.classeId !== "" && form.anneeScolaire.trim() !== "";

  const submit = () => {
    if (!isFormValid) return;
    const req: AffectationRequest = {
      teacherId: form.teacherId,
      classeId: form.classeId,
      moduleId: form.moduleId,
      anneeScolaire: form.anneeScolaire,
      dateDebut: form.dateDebut || null,
      dateFin: form.dateFin || null,
      notes: form.notes || null,
    };
    const onSuccess = () => {
      toast.success(form.id ? "Affectation modifiée" : "Affectation créée");
      setOpen(false);
    };
    const onError = (err: any) => toast.error(err?.response?.data?.message || err?.message || "Erreur");
    if (form.id) {
      updateMutation.mutate({ id: form.id, req }, { onSuccess, onError });
    } else {
      createMutation.mutate(req, { onSuccess, onError });
    }
  };

  const handleDelete = (a: AffectationDTO) => {
    if (!confirm(`Supprimer l'affectation de ${a.teacherName} à ${a.classeName}${a.moduleName ? ` (${a.moduleName})` : ""} ?`)) return;
    deleteMutation.mutate(a.id, {
      onSuccess: () => toast.success("Affectation supprimée"),
      onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Erreur"),
    });
  };

  const resetFilters = () => {
    setFilterTeacher("");
    setFilterNiveau("");
    setFilterClasse("");
    setFilterModule("");
    setSearchText("");
  };

  const onNiveauChange = (v: string) => {
    setFilterNiveau(v === "all" ? "" : v);
    setFilterClasse(""); // niveau changes invalidate classe
    setFilterModule(""); // and module too
  };

  // KPI counts for the header chips
  const kpis = useMemo(() => {
    const teacherIds = new Set(visibleRows.map((r) => r.teacherId));
    const classeIds = new Set(visibleRows.map((r) => r.classeId));
    return { rows: visibleRows.length, teachers: teacherIds.size, classes: classeIds.size };
  }, [visibleRows]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-cyan-600" />
            Affectations des enseignants
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Liez chaque enseignant aux classes et matières qu'il enseigne. Modifiable à tout moment.
          </p>
        </div>
        <Button onClick={openBulk} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nouvelle affectation
        </Button>
      </motion.div>

      {/* ── KPI chips ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <ClipboardList className="h-3 w-3" /> {kpis.rows} affectation{kpis.rows > 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <UserCog className="h-3 w-3" /> {kpis.teachers} enseignant{kpis.teachers > 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <GraduationCap className="h-3 w-3" /> {kpis.classes} classe{kpis.classes > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card p-3 shadow-sm space-y-2"
      >
        {/* Row 1: free-text search + année */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher : enseignant, classe, matière…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={filterAnnee} onValueChange={setFilterAnnee}>
            <SelectTrigger>
              <CalendarRange className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {allAnnees.length === 0 ? (
                <SelectItem value={defaultAnnee}>{defaultAnnee}</SelectItem>
              ) : (
                allAnnees.map((a) => (
                  <SelectItem key={a.id} value={a.label}>{a.label}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: cascading filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <Select value={filterTeacher || "all"} onValueChange={(v) => setFilterTeacher(v === "all" ? "" : v)}>
            <SelectTrigger>
              <UserCog className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Enseignant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les enseignants</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterNiveau || "all"} onValueChange={onNiveauChange}>
            <SelectTrigger>
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterClasse || "all"}
            onValueChange={(v) => setFilterClasse(v === "all" ? "" : v)}
            disabled={!filterNiveau}
          >
            <SelectTrigger>
              <ClipboardList className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={filterNiveau ? "Classe" : "Choisir un niveau"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {filterClasses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterModule || "all"}
            onValueChange={(v) => setFilterModule(v === "all" ? "" : v)}
            disabled={!filterNiveau}
          >
            <SelectTrigger>
              <BookOpen className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder={filterNiveau ? "Matière" : "Choisir un niveau"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {filterModulesList.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 justify-self-start">
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
      </motion.div>

      {/* ── Table ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-4 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Enseignant</th>
                <th className="py-3 px-4 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                <th className="py-3 px-4 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Matière</th>
                <th className="py-3 px-4 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Année</th>
                <th className="py-3 px-4 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Période</th>
                <th className="py-3 px-4 text-end text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Chargement…</td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucune affectation
                </td></tr>
              ) : (
                visibleRows.map((a) => (
                  <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="py-3 px-4 font-medium text-foreground">{a.teacherName}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        {a.classeName}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {a.moduleName ? (
                        <span className="inline-flex items-center gap-1 text-xs text-foreground">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          {a.moduleName}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Prof principal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{a.anneeScolaire}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {a.dateDebut || a.dateFin
                        ? `${a.dateDebut ?? "…"} → ${a.dateFin ?? "…"}`
                        : <span className="italic">Toute l'année</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)} aria-label="Modifier">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(a)} aria-label="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Bulk create dialog ─────────────────────────────── */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle affectation</DialogTitle>
            <DialogDescription>
              Affectez un enseignant à plusieurs niveaux et classes en une seule fois.
              Choisissez une matière précise, un domaine entier, ou « professeur principal ».
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Enseignant */}
            <div className="space-y-1.5">
              <Label>Enseignant *</Label>
              <Select value={bulk.teacherId || ""} onValueChange={(v) => setBulk({ ...bulk, teacherId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un enseignant…" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.prenom} {t.nom}{t.specialite ? ` — ${t.specialite}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Niveaux (multi) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Niveaux * (plusieurs possibles)</Label>
              <div className="rounded-lg border border-border/60 p-2 flex flex-wrap gap-2">
                {niveaux.length === 0 && <span className="text-xs text-muted-foreground p-1">Aucun niveau</span>}
                {niveaux.map((n) => {
                  const checked = bulk.niveauIds.includes(String(n.id));
                  return (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => toggleBulkNiveau(String(n.id))}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        checked
                          ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox checked={checked} className="h-3.5 w-3.5 pointer-events-none" />
                      {n.nom}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classes (multi, grouped by niveau) */}
            {bulk.niveauIds.length > 0 && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Classes *</Label>
                <ScrollArea className="max-h-56 rounded-lg border border-border/60">
                  <div className="p-2 space-y-3">
                    {bulk.niveauIds.map((nid) => {
                      const niveau = niveaux.find((n) => String(n.id) === nid);
                      const classes = allClasses.filter((c) => c.niveauId === nid);
                      const allSel = classes.length > 0 && classes.every((c) => bulk.classeIds.includes(c.id));
                      return (
                        <div key={nid}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{niveau?.nom ?? "Niveau"}</span>
                            {classes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleAllClassesOfNiveau(nid)}
                                className="text-[11px] text-cyan-600 hover:underline"
                              >
                                {allSel ? "Tout désélectionner" : "Tout sélectionner"}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {classes.length === 0 && <span className="text-[11px] text-muted-foreground">Aucune classe</span>}
                            {classes.map((c) => {
                              const checked = bulk.classeIds.includes(c.id);
                              return (
                                <button
                                  type="button"
                                  key={c.id}
                                  onClick={() => toggleBulkClasse(c.id)}
                                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                    checked
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  <Checkbox checked={checked} className="h-3.5 w-3.5 pointer-events-none" />
                                  {c.fullName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Matière / Domaine target */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Matière / Domaine</Label>
              <Select value={bulk.target} onValueChange={(v) => setBulk({ ...bulk, target: v })} disabled={bulk.niveauIds.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={bulk.niveauIds.length === 0 ? "Choisir un niveau d'abord" : "Aucune (prof principal)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucune (prof principal)</SelectItem>
                  {bulkDomaines.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">Domaines entiers</div>
                      {bulkDomaines.map((d) => (
                        <SelectItem key={`dom:${d}`} value={`dom:${d}`}>📚 {d} (toutes les matières)</SelectItem>
                      ))}
                    </>
                  )}
                  {bulkMatieres.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">Matières</div>
                      {bulkMatieres.map((m) => (
                        <SelectItem key={`mod:${m}`} value={`mod:${m}`}>{m}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Un domaine crée une affectation pour chacune de ses matières, dans chaque classe choisie.
              </p>
            </div>

            {/* Année + période */}
            <div className="space-y-1.5">
              <Label>Année scolaire *</Label>
              <Select value={bulk.anneeScolaire} onValueChange={(v) => setBulk({ ...bulk, anneeScolaire: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(allAnnees.length ? allAnnees.map((a) => a.label) : [defaultAnnee]).map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date début</Label>
                <Input type="date" value={bulk.dateDebut} onChange={(e) => setBulk({ ...bulk, dateDebut: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date fin</Label>
                <Input type="date" value={bulk.dateFin} onChange={(e) => setBulk({ ...bulk, dateFin: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={bulk.notes} onChange={(e) => setBulk({ ...bulk, notes: e.target.value })} placeholder="Optionnel" />
            </div>
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {bulkPreviewCount > 0
                ? `${bulkPreviewCount} affectation(s) seront créées`
                : "Sélectionnez classe(s) et matière"}
            </span>
            <div className="flex gap-2">
              <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
              <Button onClick={submitBulk} disabled={!bulkValid || bulkPreviewCount === 0 || bulkMutation.isPending}>
                {bulkMutation.isPending ? "Création…" : "Créer les affectations"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Form dialog (edit) ─────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier l'affectation" : "Nouvelle affectation"}</DialogTitle>
            <DialogDescription>
              Liez un enseignant à une classe et, optionnellement, à une matière.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Enseignant *</Label>
              <Select value={form.teacherId === "" ? "" : String(form.teacherId)} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un enseignant…" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}{t.specialite ? ` — ${t.specialite}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Niveau *</Label>
              <Select value={form.niveauId === "" ? "" : String(form.niveauId)} onValueChange={(v) => setForm({ ...form, niveauId: v, classeId: "", moduleId: null })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un niveau…" /></SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select
                  value={form.classeId === "" ? "" : String(form.classeId)}
                  onValueChange={(v) => setForm({ ...form, classeId: v })}
                  disabled={form.niveauId === ""}
                >
                  <SelectTrigger><SelectValue placeholder={form.niveauId === "" ? "Choisir un niveau" : "Sélectionner une classe…"} /></SelectTrigger>
                  <SelectContent>
                    {formClasses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Matière (optionnel)</Label>
                <Select
                  value={form.moduleId == null ? NONE : String(form.moduleId)}
                  onValueChange={(v) => setForm({ ...form, moduleId: v === NONE ? null : v })}
                  disabled={form.niveauId === ""}
                >
                  <SelectTrigger><SelectValue placeholder={form.niveauId === "" ? "Choisir un niveau" : "Aucune (prof principal)"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune (prof principal)</SelectItem>
                    {formModules.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Année scolaire *</Label>
              <Select value={form.anneeScolaire} onValueChange={(v) => setForm({ ...form, anneeScolaire: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(allAnnees.length ? allAnnees.map((a) => a.label) : [defaultAnnee]).map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date début</Label>
                <Input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date fin</Label>
                <Input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button
              onClick={submit}
              disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Enregistrement…" : (form.id ? "Mettre à jour" : "Créer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
