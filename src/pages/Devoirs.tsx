import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { devoirSchema, ressourceSchema } from "@/lib/devoir-schema";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  File,
  Video,
  Link2,
  Image,
  Music,
  Download,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/Gates";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useDevoirs,
  useCreateDevoir,
  useUpdateDevoir,
  useCloseDevoir,
  useDeleteDevoir,
  useSoumissionsByDevoir,
  useCorrectSoumission,
  useRessources,
  useCreateRessource,
  useDeleteRessource,
} from "@/hooks/useDevoirs";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import { useNiveaux } from "@/hooks/useNiveaux";
import { FileUpload } from "@/components/FileUpload";
import { resolveFileUrl, extractOriginalName, type FileInfo } from "@/api/storage.api";
import type {
  Devoir,
  CreateDevoirRequest,
  Soumission,
  TypeDevoir,
  StatutDevoir,
  RessourcePedagogique,
  TypeRessource,
  CreateRessourceRequest,
} from "@/types/devoir";

const TYPE_LABELS: Record<TypeDevoir, string> = {
  DEVOIR: "Devoir",
  EXERCICE: "Exercice",
  PROJET: "Projet",
  EXPOSE: "Expose",
};

const STATUT_COLORS: Record<StatutDevoir, string> = {
  BROUILLON: "bg-gray-100 text-gray-700",
  PUBLIE: "bg-emerald-100 text-emerald-700",
  FERME: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<StatutDevoir, string> = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publie",
  FERME: "Ferme",
};

const TYPE_RESSOURCE_ICONS: Record<TypeRessource, typeof File> = {
  DOCUMENT: File,
  VIDEO: Video,
  LIEN: Link2,
  IMAGE: Image,
  AUDIO: Music,
};

const TYPE_RESSOURCE_LABELS: Record<TypeRessource, string> = {
  DOCUMENT: "Document",
  VIDEO: "Video",
  LIEN: "Lien",
  IMAGE: "Image",
  AUDIO: "Audio",
};

const ITEMS_PER_PAGE = 15;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function DevoirsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("devoirs");
  const [search, setSearch] = useState("");
  const [filterNiveauId, setFilterNiveauId] = useState<string>("all");
  const [filterClasseId, setFilterClasseId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Devoir form
  const [devoirFormOpen, setDevoirFormOpen] = useState(false);
  const [editingDevoir, setEditingDevoir] = useState<Devoir | null>(null);
  const [devoirForm, setDevoirForm] = useState<CreateDevoirRequest>({
    titre: "",
    dateLimite: "",
    type: "DEVOIR",
    pointsMax: 20,
    statut: "PUBLIE",
  });

  // Soumission
  const [selectedDevoirId, setSelectedDevoirId] = useState<number | undefined>();
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<Soumission | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionCommentaire, setCorrectionCommentaire] = useState("");

  // Ressource form
  const [ressourceFormOpen, setRessourceFormOpen] = useState(false);
  const [ressourceForm, setRessourceForm] = useState<CreateRessourceRequest>({
    titre: "",
    type: "DOCUMENT",
  });
  const [devoirErrors, setDevoirErrors] = useState<FormErrors>({});
  const [ressourceErrors, setRessourceErrors] = useState<FormErrors>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Devoir | null>(null);
  const [deleteRessourceTarget, setDeleteRessourceTarget] = useState<RessourcePedagogique | null>(null);

  // Data
  const { data: devoirs = [], isLoading: devoirsLoading } = useDevoirs();
  const { data: soumissions = [], isLoading: soumissionsLoading } = useSoumissionsByDevoir(selectedDevoirId);
  const { data: ressources = [], isLoading: ressourcesLoading } = useRessources();
  const { niveaux } = useNiveaux();
  const [devoirNiveauId, setDevoirNiveauId] = useState<string | undefined>();
  const [ressourceNiveauId, setRessourceNiveauId] = useState<string | undefined>();
  const { data: allClasses = [] } = useClasses();
  const { data: allModules = [] } = useModules();
  const devoirClasses = useMemo(
    () => (devoirNiveauId ? allClasses.filter((c) => c.niveauId === devoirNiveauId) : []),
    [allClasses, devoirNiveauId]
  );
  const devoirModules = useMemo(
    () => (devoirNiveauId ? allModules.filter((m) => m.niveauId === devoirNiveauId) : []),
    [allModules, devoirNiveauId]
  );
  const ressourceModules = useMemo(
    () => (ressourceNiveauId ? allModules.filter((m) => m.niveauId === ressourceNiveauId) : []),
    [allModules, ressourceNiveauId]
  );

  // Re-validate on change once errors are showing, so corrected fields clear
  useEffect(() => {
    if (Object.keys(devoirErrors).length === 0) return;
    const result = validate(devoirSchema, devoirForm);
    setDevoirErrors(result.ok ? {} : result.errors);
  }, [devoirForm]);

  useEffect(() => {
    if (Object.keys(ressourceErrors).length === 0) return;
    const result = validate(ressourceSchema, ressourceForm);
    setRessourceErrors(result.ok ? {} : result.errors);
  }, [ressourceForm]);

  // Mutations
  const createDevoir = useCreateDevoir();
  const updateDevoir = useUpdateDevoir();
  const closeDevoir = useCloseDevoir();
  const deleteDevoir = useDeleteDevoir();
  const correctSoumission = useCorrectSoumission();
  const createRessource = useCreateRessource();
  const deleteRessource = useDeleteRessource();

  // Build a quick lookup classeId -> fullName for the table column
  const classeNameById = useMemo(() => {
    const map = new Map<string, string>();
    allClasses.forEach((c) => map.set(c.id, c.fullName));
    return map;
  }, [allClasses]);

  // Classes available in the filter dropdown (depends on selected niveau)
  const filterClasses = useMemo(
    () => (filterNiveauId === "all" ? allClasses : allClasses.filter((c) => String(c.niveauId) === filterNiveauId)),
    [allClasses, filterNiveauId]
  );

  // Filtered devoirs
  const filteredDevoirs = useMemo(() => {
    const q = search.toLowerCase();
    return devoirs.filter((d) => {
      if (filterClasseId !== "all" && String(d.classeId ?? "") !== filterClasseId) return false;
      if (filterNiveauId !== "all" && filterClasseId === "all") {
        const niveauOfClasse = d.classeId ? allClasses.find((c) => c.id === d.classeId)?.niveauId : undefined;
        if (String(niveauOfClasse ?? "") !== filterNiveauId) return false;
      }
      if (!q) return true;
      return (
        d.titre.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    });
  }, [devoirs, search, filterClasseId, filterNiveauId, allClasses]);

  // Filtered soumissions
  const filteredSoumissions = useMemo(() => {
    if (!search) return soumissions;
    const q = search.toLowerCase();
    return soumissions.filter(
      (s) =>
        s.devoirTitre?.toLowerCase().includes(q) ||
        String(s.eleveId).includes(q)
    );
  }, [soumissions, search]);

  // Filtered ressources
  const filteredRessources = useMemo(() => {
    if (!search) return ressources;
    const q = search.toLowerCase();
    return ressources.filter(
      (r) =>
        r.titre.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    );
  }, [ressources, search]);

  const activeList =
    activeTab === "devoirs" ? filteredDevoirs :
    activeTab === "soumissions" ? filteredSoumissions :
    filteredRessources;
  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE));
  const paginatedDevoirs = filteredDevoirs.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const paginatedSoumissions = filteredSoumissions.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const paginatedRessources = filteredRessources.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const stats = [
    { label: t("homework.totalHomework"), value: devoirs.length, icon: BookOpen, color: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("common.published"), value: devoirs.filter((d) => d.statut === "PUBLIE").length, icon: CheckCircle, color: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("homework.resources"), value: ressources.length, icon: FileText, color: "bg-purple-50", textColor: "text-purple-700" },
  ];

  const openCreateDevoir = () => {
    setEditingDevoir(null);
    setDevoirForm({ titre: "", dateLimite: "", type: "DEVOIR", pointsMax: 20, statut: "PUBLIE" });
    setDevoirNiveauId(undefined);
    setDevoirFormOpen(true);
  };

  const openEditDevoir = (d: Devoir) => {
    setEditingDevoir(d);
    setDevoirForm({
      titre: d.titre,
      description: d.description ?? undefined,
      moduleId: d.moduleId ?? undefined,
      classeId: d.classeId ?? undefined,
      enseignantId: d.enseignantId ?? undefined,
      dateLimite: d.dateLimite,
      type: d.type,
      pointsMax: d.pointsMax,
      fichierUrl: d.fichierUrl ?? undefined,
      statut: d.statut,
    });
    const niveauFromClasse = d.classeId ? allClasses.find((c) => c.id === d.classeId)?.niveauId : undefined;
    const niveauFromModule = d.moduleId ? allModules.find((m) => m.id === d.moduleId)?.niveauId : undefined;
    setDevoirNiveauId(niveauFromClasse ?? niveauFromModule);
    setDevoirFormOpen(true);
  };

  const onApiError = (setter: (e: FormErrors) => void) => (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
    setter({ _root: err.response?.data?.message ?? "Erreur lors de l'enregistrement" });
  };

  const handleSaveDevoir = () => {
    const result = validate(devoirSchema, devoirForm);
    if (!result.ok) { setDevoirErrors(result.errors); return; }
    setDevoirErrors({});
    if (editingDevoir) {
      updateDevoir.mutate({ id: editingDevoir.id, data: devoirForm }, {
        onSuccess: () => setDevoirFormOpen(false),
        onError: onApiError(setDevoirErrors),
      });
    } else {
      createDevoir.mutate(devoirForm, {
        onSuccess: () => setDevoirFormOpen(false),
        onError: onApiError(setDevoirErrors),
      });
    }
  };

  const handleDeleteDevoir = () => {
    if (!deleteTarget) return;
    deleteDevoir.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleCorrection = () => {
    if (!correctionTarget) return;
    correctSoumission.mutate(
      { id: correctionTarget.id, data: { note: Number(correctionNote), commentaire: correctionCommentaire } },
      { onSuccess: () => { setCorrectionOpen(false); setCorrectionTarget(null); } }
    );
  };

  const handleSaveRessource = () => {
    const result = validate(ressourceSchema, ressourceForm);
    if (!result.ok) { setRessourceErrors(result.errors); return; }
    setRessourceErrors({});
    createRessource.mutate(ressourceForm, {
      onSuccess: () => setRessourceFormOpen(false),
      onError: onApiError(setRessourceErrors),
    });
  };

  const handleDeleteRessource = () => {
    if (!deleteRessourceTarget) return;
    deleteRessource.mutate(deleteRessourceTarget.id, {
      onSuccess: () => setDeleteRessourceTarget(null),
    });
  };

  const isLoading = devoirsLoading || ressourcesLoading;
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("homework.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("homework.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setRessourceForm({ titre: "", type: "DOCUMENT" }); setRessourceNiveauId(undefined); setRessourceFormOpen(true); }}>
            <Upload className="h-4 w-4" />
            {t("homework.resources")}
          </Button>
          <PermissionGate perms={["MANAGE_DEVOIRS"]}>
            <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={openCreateDevoir}>
              <Plus className="h-4 w-4" />
              {t("homework.newHomework")}
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(0); }}>
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
          <TabsList>
            <TabsTrigger value="devoirs">{t("homework.title")}</TabsTrigger>
            <TabsTrigger value="soumissions">{t("homework.submissions")}</TabsTrigger>
            <TabsTrigger value="ressources">{t("homework.resources")}</TabsTrigger>
          </TabsList>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher..." className="ps-9" />
            </div>
            {activeTab === "devoirs" && (
              <>
                <Select value={filterNiveauId} onValueChange={(v) => { setFilterNiveauId(v); setFilterClasseId("all"); setCurrentPage(0); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterClasseId} onValueChange={(v) => { setFilterClasseId(v); setCurrentPage(0); }} disabled={filterNiveauId === "all"}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={filterNiveauId === "all" ? "Choisissez un niveau" : "Classe"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allClasses")}</SelectItem>
                    {filterClasses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {activeTab === "soumissions" && (
              <Select value={selectedDevoirId ? String(selectedDevoirId) : "all"} onValueChange={(v) => setSelectedDevoirId(v === "all" ? undefined : Number(v))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("homework.selectHomework")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("homework.allHomework")}</SelectItem>
                  {devoirs.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.titre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(search || (activeTab === "devoirs" && (filterClasseId !== "all" || filterNiveauId !== "all"))) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterNiveauId("all"); setFilterClasseId("all"); setCurrentPage(0); }} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                {t("common.reset")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Devoirs Table */}
        <TabsContent value="devoirs">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Titre</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Classe</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Date limite</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Points</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Fichier</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Soumissions</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevoirs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("homework.noHomework")}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDevoirs.map((devoir) => (
                      <tr key={devoir.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{devoir.titre}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <Badge variant="outline">{TYPE_LABELS[devoir.type]}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                          {devoir.classeId ? (classeNameById.get(devoir.classeId) ?? `#${devoir.classeId}`) : "-"}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                          {new Date(devoir.dateLimite).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{devoir.pointsMax}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[devoir.statut]}`}>
                            {STATUT_LABELS[devoir.statut]}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {devoir.fichierUrl ? (
                            <a
                              href={resolveFileUrl(devoir.fichierUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Fichier
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{devoir.totalSoumissions}</td>
                        <td className="py-3 px-4 text-end">
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            <PermissionGate perms={["MANAGE_DEVOIRS"]}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditDevoir(devoir)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {devoir.statut === "PUBLIE" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-600" onClick={() => closeDevoir.mutate(devoir.id)}>
                                  <Lock className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(devoir)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDevoir(devoir)}>
                                <Edit className="h-4 w-4 me-2" /> Modifier
                              </DropdownMenuItem>
                              {devoir.statut === "PUBLIE" && (
                                <DropdownMenuItem onClick={() => closeDevoir.mutate(devoir.id)}>
                                  <Lock className="h-4 w-4 me-2" /> Fermer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteTarget(devoir)} className="text-red-600">
                                <Trash2 className="h-4 w-4 me-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && activeTab === "devoirs" && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Page {currentPage + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Soumissions Table */}
        <TabsContent value="soumissions">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {soumissionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Devoir</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Eleve ID</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Corrige</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Note</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Fichier</th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">En retard</th>
                      <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSoumissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">{selectedDevoirId ? t("homework.noSubmission") : t("homework.selectHomework")}</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedSoumissions.map((soumission) => (
                        <tr key={soumission.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{soumission.devoirTitre}</td>
                          <td className="py-3 px-4 text-muted-foreground">#{soumission.eleveId}</td>
                          <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                            {new Date(soumission.dateSoumission).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={soumission.corrige ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}>
                              {soumission.corrige ? "Corrige" : "En attente"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                            {soumission.note != null ? soumission.note : "-"}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {soumission.fichierUrl ? (
                              <a
                                href={resolveFileUrl(soumission.fichierUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Fichier
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {soumission.enRetard ? (
                              <Badge variant="outline" className="bg-red-100 text-red-700">Oui</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600">Non</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-end">
                            {!soumission.corrige && (
                              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground" onClick={() => {
                                setCorrectionTarget(soumission);
                                setCorrectionNote("");
                                setCorrectionCommentaire("");
                                setCorrectionOpen(true);
                              }}>
                                <CheckCircle className="h-4 w-4" />
                                {t("homework.correctSubmission")}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && activeTab === "soumissions" && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Page {currentPage + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Ressources Grid */}
        <TabsContent value="ressources">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            {paginatedRessources.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm py-16 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("homework.noResource")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedRessources.map((res) => {
                  const Icon = TYPE_RESSOURCE_ICONS[res.type];
                  return (
                    <div key={res.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <Icon className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{res.titre}</p>
                            <p className="text-xs text-muted-foreground">{TYPE_RESSOURCE_LABELS[res.type]}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(res.fichierUrl || res.lienExterne) && (
                              <DropdownMenuItem onClick={() => window.open(res.fichierUrl ? resolveFileUrl(res.fichierUrl) : res.lienExterne || "", "_blank")}>
                                <Download className="h-4 w-4 me-2" /> Ouvrir
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteRessourceTarget(res)} className="text-red-600">
                              <Trash2 className="h-4 w-4 me-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {res.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{res.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(res.createdAt).toLocaleDateString("fr-FR")}
                        {res.tailleFichier && (
                          <span className="ms-auto">{(res.tailleFichier / 1024 / 1024).toFixed(1)} Mo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && activeTab === "ressources" && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Page {currentPage + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Devoir Dialog */}
      <Dialog open={devoirFormOpen} onOpenChange={setDevoirFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDevoir ? t("homework.editHomework") : t("homework.newHomework")}</DialogTitle>
            <DialogDescription>
              {editingDevoir ? t("homework.editInfo") : t("homework.newHomeworkDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {devoirErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{devoirErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="devoirTitre">Titre *</Label>
              <Input id="devoirTitre" value={devoirForm.titre} onChange={(e) => setDevoirForm({ ...devoirForm, titre: e.target.value })} placeholder="Titre du devoir" aria-invalid={!!devoirErrors.titre} className={devoirErrors.titre ? "border-red-500" : ""} />
              {devoirErrors.titre && <p className="text-xs text-red-600">{devoirErrors.titre}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="devoirDesc">Description</Label>
              <Textarea id="devoirDesc" value={devoirForm.description ?? ""} onChange={(e) => setDevoirForm({ ...devoirForm, description: e.target.value })} placeholder="Description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={devoirForm.type} onValueChange={(v) => setDevoirForm({ ...devoirForm, type: v as TypeDevoir })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as TypeDevoir[]).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={devoirForm.statut} onValueChange={(v) => setDevoirForm({ ...devoirForm, statut: v as StatutDevoir })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUT_LABELS) as StatutDevoir[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUT_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateLimite">Date limite *</Label>
                <Input id="dateLimite" type="date" value={devoirForm.dateLimite} onChange={(e) => setDevoirForm({ ...devoirForm, dateLimite: e.target.value })} aria-invalid={!!devoirErrors.dateLimite} className={devoirErrors.dateLimite ? "border-red-500" : ""} />
                {devoirErrors.dateLimite && <p className="text-xs text-red-600">{devoirErrors.dateLimite}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pointsMax">Points max *</Label>
                <Input id="pointsMax" type="number" value={devoirForm.pointsMax ?? 20} onChange={(e) => setDevoirForm({ ...devoirForm, pointsMax: Number(e.target.value) })} aria-invalid={!!devoirErrors.pointsMax} className={devoirErrors.pointsMax ? "border-red-500" : ""} />
                {devoirErrors.pointsMax && <p className="text-xs text-red-600">{devoirErrors.pointsMax}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="niveauId">Niveau</Label>
              <Select
                value={devoirNiveauId ? String(devoirNiveauId) : "none"}
                onValueChange={(v) => {
                  const nid = v === "none" ? undefined : v;
                  setDevoirNiveauId(nid);
                  setDevoirForm({ ...devoirForm, classeId: undefined, moduleId: undefined });
                }}
              >
                <SelectTrigger id="niveauId"><SelectValue placeholder="Selectionner un niveau" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="classeId">Classe</Label>
                <Select
                  value={devoirForm.classeId ? String(devoirForm.classeId) : "none"}
                  onValueChange={(v) => setDevoirForm({ ...devoirForm, classeId: v === "none" ? undefined : v })}
                  disabled={!devoirNiveauId}
                >
                  <SelectTrigger id="classeId"><SelectValue placeholder={devoirNiveauId ? "Selectionner une classe" : "Choisissez un niveau"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {devoirClasses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="moduleId">Matière</Label>
                <Select
                  value={devoirForm.moduleId ? String(devoirForm.moduleId) : "none"}
                  onValueChange={(v) => setDevoirForm({ ...devoirForm, moduleId: v === "none" ? undefined : v })}
                  disabled={!devoirNiveauId}
                >
                  <SelectTrigger id="moduleId"><SelectValue placeholder={devoirNiveauId ? "Selectionner un module" : "Choisissez un niveau"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {devoirModules.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fichier joint</Label>
              {devoirForm.fichierUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={resolveFileUrl(devoirForm.fichierUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex-1 truncate"
                  >
                    {extractOriginalName(devoirForm.fichierUrl) || "Fichier"}
                  </a>
                  <button
                    type="button"
                    onClick={() => setDevoirForm({ ...devoirForm, fichierUrl: undefined })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <FileUpload
                  folder="devoirs"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                  onUpload={(info: FileInfo) =>
                    setDevoirForm({ ...devoirForm, fichierUrl: info.fileUrl })
                  }
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveDevoir} disabled={createDevoir.isPending || updateDevoir.isPending}>
              {(createDevoir.isPending || updateDevoir.isPending) ? t("common.saving") : (editingDevoir ? t("common.edit") : t("common.create"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("homework.correctSubmission")}</DialogTitle>
            <DialogDescription>{t("homework.correctInfo")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="corrNote">Note</Label>
              <Input id="corrNote" type="number" step="0.5" value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} placeholder="Note sur 20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="corrComm">Commentaire</Label>
              <Textarea id="corrComm" value={correctionCommentaire} onChange={(e) => setCorrectionCommentaire(e.target.value)} placeholder="Commentaire de correction..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleCorrection} disabled={correctSoumission.isPending || !correctionNote}>
              {correctSoumission.isPending ? t("homework.correcting") : t("homework.validate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ressource Dialog */}
      <Dialog open={ressourceFormOpen} onOpenChange={setRessourceFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("homework.addResource")}</DialogTitle>
            <DialogDescription>{t("homework.shareResource")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {ressourceErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{ressourceErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="resTitre">Titre *</Label>
              <Input id="resTitre" value={ressourceForm.titre} onChange={(e) => setRessourceForm({ ...ressourceForm, titre: e.target.value })} placeholder="Titre de la ressource" aria-invalid={!!ressourceErrors.titre} className={ressourceErrors.titre ? "border-red-500" : ""} />
              {ressourceErrors.titre && <p className="text-xs text-red-600">{ressourceErrors.titre}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resDesc">Description</Label>
              <Textarea id="resDesc" value={ressourceForm.description ?? ""} onChange={(e) => setRessourceForm({ ...ressourceForm, description: e.target.value })} placeholder="Description..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={ressourceForm.type} onValueChange={(v) => setRessourceForm({ ...ressourceForm, type: v as TypeRessource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_RESSOURCE_LABELS) as TypeRessource[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_RESSOURCE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fichier joint</Label>
              {ressourceForm.fichierUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={resolveFileUrl(ressourceForm.fichierUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex-1 truncate"
                  >
                    {extractOriginalName(ressourceForm.fichierUrl) || "Fichier"}
                  </a>
                  <button
                    type="button"
                    onClick={() => setRessourceForm({ ...ressourceForm, fichierUrl: undefined })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <FileUpload
                  folder="ressources"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3,.zip"
                  onUpload={(info: FileInfo) =>
                    setRessourceForm({ ...ressourceForm, fichierUrl: info.fileUrl })
                  }
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resLien">Lien externe</Label>
              <Input id="resLien" value={ressourceForm.lienExterne ?? ""} onChange={(e) => setRessourceForm({ ...ressourceForm, lienExterne: e.target.value || undefined })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resNiveauId">Niveau</Label>
              <Select
                value={ressourceNiveauId ? String(ressourceNiveauId) : "none"}
                onValueChange={(v) => {
                  const nid = v === "none" ? undefined : v;
                  setRessourceNiveauId(nid);
                  setRessourceForm({ ...ressourceForm, moduleId: undefined });
                }}
              >
                <SelectTrigger id="resNiveauId"><SelectValue placeholder="Selectionner un niveau" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resModuleId">Matière</Label>
              <Select
                value={ressourceForm.moduleId ? String(ressourceForm.moduleId) : "none"}
                onValueChange={(v) => setRessourceForm({ ...ressourceForm, moduleId: v === "none" ? undefined : v })}
                disabled={!ressourceNiveauId}
              >
                <SelectTrigger id="resModuleId"><SelectValue placeholder={ressourceNiveauId ? "Selectionner un module" : "Choisissez un niveau"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {ressourceModules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveRessource} disabled={createRessource.isPending}>
              {createRessource.isPending ? "Creation..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Devoir Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("homework.deleteHomework")}</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer "{deleteTarget?.titre}" ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteDevoir} disabled={deleteDevoir.isPending}>
              {deleteDevoir.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ressource Confirmation */}
      <Dialog open={!!deleteRessourceTarget} onOpenChange={(open) => !open && setDeleteRessourceTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("homework.deleteResource")}</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer "{deleteRessourceTarget?.titre}" ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteRessource} disabled={deleteRessource.isPending}>
              {deleteRessource.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
