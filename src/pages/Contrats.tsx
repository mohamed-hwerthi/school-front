import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { contratSchema, congeSchema } from "@/lib/communication-schemas";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  useContrats,
  useCreateContrat,
  useUpdateContrat,
  useDeleteContrat,
  useConges,
  useCreateConge,
  useApprouverConge,
  useRefuserConge,
  useDeleteConge,
} from "@/hooks/useContrats";
import { useTeachers } from "@/hooks/useTeachers";
import { CURRENCY } from "@/config/currency";
import type { ContratEnseignant, Conge, TypeContrat, TypeConge, StatutConge } from "@/types/contrat";

const STATUT_CONGE_COLORS: Record<StatutConge, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  APPROUVE: "bg-emerald-100 text-emerald-700",
  REFUSE: "bg-red-100 text-red-700",
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

export default function ContratsPage() {
  const { t } = useLanguage();

  const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = useMemo(() => ({
    CDI: "CDI",
    CDD: "CDD",
    VACATAIRE: t("contracts.contractTypes.substitute"),
  }), [t]);

  const TYPE_CONGE_LABELS: Record<TypeConge, string> = useMemo(() => ({
    ANNUEL: t("contracts.contractTypes.annual"),
    MALADIE: t("contracts.leaveTypes.sick"),
    MATERNITE: t("contracts.leaveTypes.maternity"),
    EXCEPTIONNEL: t("contracts.contractTypes.exceptional"),
    SANS_SOLDE: t("contracts.leaveTypes.unpaid"),
  }), [t]);

  const STATUT_CONGE_LABELS: Record<StatutConge, string> = useMemo(() => ({
    EN_ATTENTE: t("common.pending"),
    APPROUVE: t("meetings.statuses.confirmed"),
    REFUSE: t("meetings.statuses.cancelled"),
  }), [t]);
  const [activeTab, setActiveTab] = useState("contrats");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Contrat form
  const [contratFormOpen, setContratFormOpen] = useState(false);
  const [editContrat, setEditContrat] = useState<ContratEnseignant | null>(null);
  const [contratForm, setContratForm] = useState({
    enseignantId: "",
    typeContrat: "CDD" as TypeContrat,
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
    salaire: 0,
  });

  // Conge form
  const [congeFormOpen, setCongeFormOpen] = useState(false);
  const [congeForm, setCongeForm] = useState({
    enseignantId: "",
    typeConge: "ANNUEL" as TypeConge,
    dateDebut: "",
    dateFin: "",
    motif: "",
  });
  const [contratErrors, setContratErrors] = useState<FormErrors>({});
  const [congeErrors, setCongeErrors] = useState<FormErrors>({});

  const [deleteContratTarget, setDeleteContratTarget] = useState<ContratEnseignant | null>(null);
  const [deleteCongeTarget, setDeleteCongeTarget] = useState<Conge | null>(null);

  const { teachers } = useTeachers();
  const { data: contrats = [], isLoading: contratsLoading } = useContrats();
  const createContratMutation = useCreateContrat();
  const updateContratMutation = useUpdateContrat();
  const deleteContratMutation = useDeleteContrat();

  const { data: conges = [], isLoading: congesLoading } = useConges();
  const createCongeMutation = useCreateConge();
  const approuverCongeMutation = useApprouverConge();
  const refuserCongeMutation = useRefuserConge();
  const deleteCongeMutation = useDeleteConge();

  const getTeacherName = (id: string) => {
    const t = teachers.find((t) => t.id === id);
    return t ? `${t.prenom} ${t.nom}` : `#${id}`;
  };

  // Filtered contrats
  const filteredContrats = useMemo(() => {
    let list = contrats;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => getTeacherName(c.enseignantId).toLowerCase().includes(q));
    }
    if (filterType !== "all") {
      list = list.filter((c) => c.typeContrat === filterType);
    }
    return list;
  }, [contrats, search, filterType, teachers]);

  // Filtered conges
  const filteredConges = useMemo(() => {
    let list = conges;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.enseignantNom?.toLowerCase().includes(q) ||
          getTeacherName(c.enseignantId).toLowerCase().includes(q)
      );
    }
    return list;
  }, [conges, search, teachers]);

  const activeList = activeTab === "contrats" ? filteredContrats : filteredConges;
  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE));
  const paginatedContrats = filteredContrats.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const paginatedConges = filteredConges.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const hasFilters = search || filterType !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setCurrentPage(0);
  };

  const stats = [
    { label: t("contracts.totalContracts"), value: contrats.length, icon: FileText, color: "bg-blue-50", textColor: "text-blue-700" },
    { label: "CDI", value: contrats.filter((c) => c.typeContrat === "CDI").length, icon: Briefcase, color: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("contracts.pendingLeaves"), value: conges.filter((c) => c.statut === "EN_ATTENTE").length, icon: Clock, color: "bg-amber-50", textColor: "text-amber-700" },
  ];

  const openCreateContrat = () => {
    setEditContrat(null);
    setContratForm({ enseignantId: "", typeContrat: "CDD", dateDebut: new Date().toISOString().split("T")[0], dateFin: "", salaire: 0 });
    setContratErrors({});
    setContratFormOpen(true);
  };

  const openEditContrat = (c: ContratEnseignant) => {
    setEditContrat(c);
    setContratForm({
      enseignantId: c.enseignantId,
      typeContrat: c.typeContrat,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin ?? "",
      salaire: c.salaire ?? 0,
    });
    setContratErrors({});
    setContratFormOpen(true);
  };

  const handleSaveContrat = () => {
    const result = validate(contratSchema, contratForm);
    if (!result.ok) { setContratErrors(result.errors); return; }
    setContratErrors({});
    const payload = {
      ...contratForm,
      dateFin: contratForm.dateFin || undefined,
    };
    if (editContrat) {
      updateContratMutation.mutate(
        { id: editContrat.id, data: payload },
        { onSuccess: () => setContratFormOpen(false), onError: (err: Error & { response?: { data?: { message?: string } } }) => setContratErrors({ _root: err.response?.data?.message ?? "Erreur" }) }
      );
    } else {
      createContratMutation.mutate(payload as Omit<ContratEnseignant, "id">, {
        onSuccess: () => setContratFormOpen(false),
        onError: (err: Error & { response?: { data?: { message?: string } } }) => setContratErrors({ _root: err.response?.data?.message ?? "Erreur" }),
      });
    }
  };

  const handleCreateConge = () => {
    const result = validate(congeSchema, { ...congeForm, type: congeForm.typeConge });
    if (!result.ok) { setCongeErrors(result.errors); return; }
    setCongeErrors({});
    const payload = {
      enseignantId: congeForm.enseignantId,
      typeConge: congeForm.typeConge,
      dateDebut: congeForm.dateDebut,
      dateFin: congeForm.dateFin,
      motif: congeForm.motif || undefined,
    };
    createCongeMutation.mutate(payload, {
      onSuccess: () => setCongeFormOpen(false),
      onError: (err: Error & { response?: { data?: { message?: string } } }) => setCongeErrors({ _root: err.response?.data?.message ?? "Erreur" }),
    });
  };

  const handleDeleteContrat = () => {
    if (!deleteContratTarget) return;
    deleteContratMutation.mutate(deleteContratTarget.id, {
      onSuccess: () => setDeleteContratTarget(null),
    });
  };

  const handleDeleteConge = () => {
    if (!deleteCongeTarget) return;
    deleteCongeMutation.mutate(deleteCongeTarget.id, {
      onSuccess: () => setDeleteCongeTarget(null),
    });
  };

  const isLoading = contratsLoading || congesLoading;
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("contracts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("contracts.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            setCongeForm({ enseignantId: "", typeConge: "ANNUEL", dateDebut: "", dateFin: "", motif: "" });
            setCongeFormOpen(true);
          }}>
            <CalendarDays className="h-4 w-4" />
            {t("contracts.leaveRequest")}
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={openCreateContrat}>
            <Plus className="h-4 w-4" />
            {t("contracts.newContract")}
          </Button>
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
            <TabsTrigger value="contrats">Contrats</TabsTrigger>
            <TabsTrigger value="conges">Conges</TabsTrigger>
          </TabsList>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder={t("common.searchPlaceholder")} className="ps-9" />
            </div>
            {activeTab === "contrats" && (
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(0); }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {(Object.keys(TYPE_CONTRAT_LABELS) as TypeContrat[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONTRAT_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" /> {t("common.reset")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Contrats Table */}
        <TabsContent value="contrats">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.teacher")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.type")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("common.startDate")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("common.endDate")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">{t("contracts.baseSalary")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContrats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("common.noResults")}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedContrats.map((contrat) => (
                      <tr key={contrat.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{getTeacherName(contrat.enseignantId)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{TYPE_CONTRAT_LABELS[contrat.typeContrat]}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{new Date(contrat.dateDebut).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{contrat.dateFin ? new Date(contrat.dateFin).toLocaleDateString("fr-FR") : "-"}</td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{contrat.salaire ? `${contrat.salaire.toLocaleString()} ${CURRENCY}` : "-"}</td>
                        <td className="py-3 px-4 text-end">
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => openEditContrat(contrat)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteContratTarget(contrat)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditContrat(contrat)}><Edit className="h-4 w-4 me-2" /> Modifier</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteContratTarget(contrat)} className="text-red-600"><Trash2 className="h-4 w-4 me-2" /> Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && activeTab === "contrats" && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Conges Table */}
        <TabsContent value="conges">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.teacher")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.type")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("common.start")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("common.end")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("discountsPage.reason")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.status")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("contracts.noLeave")}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedConges.map((conge) => (
                      <tr key={conge.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{conge.enseignantNom ?? getTeacherName(conge.enseignantId)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{TYPE_CONGE_LABELS[conge.typeConge]}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{new Date(conge.dateDebut).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{new Date(conge.dateFin).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">{conge.motif ?? "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CONGE_COLORS[conge.statut]}`}>
                            {STATUT_CONGE_LABELS[conge.statut]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            {conge.statut === "EN_ATTENTE" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={() => approuverCongeMutation.mutate(conge.id)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => refuserCongeMutation.mutate(conge.id)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteCongeTarget(conge)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {conge.statut === "EN_ATTENTE" && (
                                <>
                                  <DropdownMenuItem onClick={() => approuverCongeMutation.mutate(conge.id)}>
                                    <CheckCircle className="h-4 w-4 me-2" /> {t("common.confirm")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => refuserCongeMutation.mutate(conge.id)}>
                                    <XCircle className="h-4 w-4 me-2" /> {t("common.cancel")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteCongeTarget(conge)} className="text-red-600">
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
            {totalPages > 1 && activeTab === "conges" && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Contrat Dialog */}
      <Dialog open={contratFormOpen} onOpenChange={setContratFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editContrat ? t("contracts.editContract") : t("contracts.newContract")}</DialogTitle>
            <DialogDescription>{editContrat ? t("contracts.editInfo") : t("contracts.createContract")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {contratErrors._root && (
              <p className="text-sm text-red-600">{contratErrors._root}</p>
            )}
            <div className="space-y-1.5">
              <Label>{t("common.teacher")} <span className="text-red-500">*</span></Label>
              <Select value={contratForm.enseignantId ? String(contratForm.enseignantId) : ""} onValueChange={(v) => setContratForm({ ...contratForm, enseignantId: v })}>
                <SelectTrigger><SelectValue placeholder={t("common.select")} /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contratErrors.enseignantId && <p className="text-xs text-red-600">{contratErrors.enseignantId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.type")} <span className="text-red-500">*</span></Label>
              <Select value={contratForm.typeContrat} onValueChange={(v) => setContratForm({ ...contratForm, typeContrat: v as TypeContrat })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONTRAT_LABELS) as TypeContrat[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONTRAT_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contratErrors.typeContrat && <p className="text-xs text-red-600">{contratErrors.typeContrat}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contratDebut">{t("common.startDate")} <span className="text-red-500">*</span></Label>
                <Input id="contratDebut" type="date" value={contratForm.dateDebut} onChange={(e) => setContratForm({ ...contratForm, dateDebut: e.target.value })} />
                {contratErrors.dateDebut && <p className="text-xs text-red-600">{contratErrors.dateDebut}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contratFin">{t("common.endDate")}</Label>
                <Input id="contratFin" type="date" value={contratForm.dateFin} onChange={(e) => setContratForm({ ...contratForm, dateFin: e.target.value })} />
                {contratErrors.dateFin && <p className="text-xs text-red-600">{contratErrors.dateFin}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaire">{t("contracts.baseSalary")} <span className="text-red-500">*</span></Label>
              <Input id="salaire" type="number" value={contratForm.salaire || ""} onChange={(e) => setContratForm({ ...contratForm, salaire: Number(e.target.value) })} placeholder="0" />
              {contratErrors.salaire && <p className="text-xs text-red-600">{contratErrors.salaire}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button onClick={handleSaveContrat} disabled={createContratMutation.isPending || updateContratMutation.isPending}>
              {(createContratMutation.isPending || updateContratMutation.isPending) ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Conge Dialog */}
      <Dialog open={congeFormOpen} onOpenChange={setCongeFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("contracts.leaveRequest")}</DialogTitle>
            <DialogDescription>{t("contracts.registerLeave")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("common.teacher")} <span className="text-red-500">*</span></Label>
              <Select value={congeForm.enseignantId ? String(congeForm.enseignantId) : ""} onValueChange={(v) => setCongeForm({ ...congeForm, enseignantId: v })}>
                <SelectTrigger><SelectValue placeholder={t("common.select")} /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.type")}</Label>
              <Select value={congeForm.typeConge} onValueChange={(v) => setCongeForm({ ...congeForm, typeConge: v as TypeConge })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONGE_LABELS) as TypeConge[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONGE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="congeDebut">{t("common.startDate")} <span className="text-red-500">*</span></Label>
                <Input id="congeDebut" type="date" value={congeForm.dateDebut} onChange={(e) => setCongeForm({ ...congeForm, dateDebut: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="congeFin">{t("common.endDate")} <span className="text-red-500">*</span></Label>
                <Input id="congeFin" type="date" value={congeForm.dateFin} onChange={(e) => setCongeForm({ ...congeForm, dateFin: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="congeMotif">{t("discountsPage.reason")}</Label>
              <Textarea id="congeMotif" value={congeForm.motif} onChange={(e) => setCongeForm({ ...congeForm, motif: e.target.value })} placeholder={t("contracts.leaveReason")} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button onClick={handleCreateConge} disabled={createCongeMutation.isPending}>
              {createCongeMutation.isPending ? t("common.creating") : t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contrat Confirmation */}
      <Dialog open={!!deleteContratTarget} onOpenChange={(open) => !open && setDeleteContratTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("contracts.deleteContract")}</DialogTitle>
            <DialogDescription>{t("common.deleteConfirmMsg")} ? {t("common.irreversible")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteContrat} disabled={deleteContratMutation.isPending}>
              {deleteContratMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Conge Confirmation */}
      <Dialog open={!!deleteCongeTarget} onOpenChange={(open) => !open && setDeleteCongeTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("contracts.deleteLeave")}</DialogTitle>
            <DialogDescription>{t("common.deleteConfirmMsg")} ?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteConge} disabled={deleteCongeMutation.isPending}>
              {deleteCongeMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
