import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  AlertTriangle,
  Gavel,
  ChevronLeft,
  ChevronRight,
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
  useIncidents,
  useCreateIncident,
  useDeleteIncident,
  useSanctions,
  useCreateSanction,
  useDeleteSanction,
} from "@/hooks/useDiscipline";
import { useAllStudents } from "@/hooks/useStudents";
import type { Incident, Sanction, TypeIncident, GraviteType, TypeSanction } from "@/types/discipline";
import { validate, type FormErrors } from "@/lib/validate";
import { incidentSchema, sanctionSchema } from "@/lib/discipline-schema";

const TYPE_INCIDENT_LABELS: Record<TypeIncident, string> = {
  BAGARRE: "Bagarre",
  INSOLENCE: "Insolence",
  VANDALISME: "Vandalisme",
  TRICHERIE: "Tricherie",
  RETARD_REPETE: "Retard repete",
  ABSENCE_INJUSTIFIEE: "Absence injustifiee",
  AUTRE: "Autre",
};

const GRAVITE_LABELS: Record<GraviteType, string> = {
  LEGERE: "Legere",
  MOYENNE: "Moyenne",
  GRAVE: "Grave",
  TRES_GRAVE: "Tres grave",
};

const GRAVITE_COLORS: Record<GraviteType, string> = {
  LEGERE: "bg-blue-100 text-blue-700",
  MOYENNE: "bg-orange-100 text-orange-700",
  GRAVE: "bg-red-100 text-red-700",
  TRES_GRAVE: "bg-red-200 text-red-800",
};

const TYPE_SANCTION_LABELS: Record<TypeSanction, string> = {
  AVERTISSEMENT: "Avertissement",
  BLAME: "Blame",
  EXCLUSION_TEMPORAIRE: "Exclusion temporaire",
  EXCLUSION_DEFINITIVE: "Exclusion definitive",
  TRAVAIL_SUPPLEMENTAIRE: "Travail supplementaire",
  CONVOCATION_PARENT: "Convocation parent",
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

export default function DisciplinePage() {
  const [activeTab, setActiveTab] = useState("incidents");
  const [search, setSearch] = useState("");
  const [filterGravite, setFilterGravite] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Incident form state
  const [incidentFormOpen, setIncidentFormOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    titre: "",
    date: new Date().toISOString().split("T")[0],
    type: "AUTRE" as TypeIncident,
    description: "",
    gravite: "LEGERE" as GraviteType,
    lieu: "",
    elevesImpliques: [] as { eleveId: string; roleEleve?: string }[],
    signaleParId: undefined as number | undefined,
  });

  // Sanction form state
  const [sanctionFormOpen, setSanctionFormOpen] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({
    eleveId: 0,
    incidentId: undefined as number | undefined,
    typeSanction: "AVERTISSEMENT" as TypeSanction,
    description: "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
    notifieParent: false,
  });
  const [sanctionNiveau, setSanctionNiveau] = useState<string>("");
  const [incidentErrors, setIncidentErrors] = useState<FormErrors>({});
  const [sanctionErrors, setSanctionErrors] = useState<FormErrors>({});
  const [sanctionClasse, setSanctionClasse] = useState<string>("");

  const [deleteIncidentTarget, setDeleteIncidentTarget] = useState<Incident | null>(null);
  const [deleteSanctionTarget, setDeleteSanctionTarget] = useState<Sanction | null>(null);

  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: sanctionsRaw = [], isLoading: sanctionsLoading } = useSanctions();
  const { data: allStudents = [] } = useAllStudents();

  const studentNameById = useMemo(() => {
    const m = new Map<number, string>();
    allStudents.forEach((s) => m.set(s.id, `${s.nom} ${s.prenom}`.trim()));
    return m;
  }, [allStudents]);

  const sanctions = useMemo(
    () =>
      sanctionsRaw.map((s) => ({
        ...s,
        eleveNom: s.eleveNom ?? studentNameById.get(s.eleveId),
      })),
    [sanctionsRaw, studentNameById],
  );

  const niveauOptions = useMemo(
    () => [...new Set(allStudents.map((s) => s.niveau).filter(Boolean))].sort(),
    [allStudents],
  );
  const classeOptions = useMemo(
    () =>
      [
        ...new Set(
          allStudents
            .filter((s) => !sanctionNiveau || s.niveau === sanctionNiveau)
            .map((s) => s.classe)
            .filter(Boolean),
        ),
      ].sort(),
    [allStudents, sanctionNiveau],
  );
  const eleveOptions = useMemo(
    () =>
      allStudents
        .filter((s) => (!sanctionNiveau || s.niveau === sanctionNiveau) && (!sanctionClasse || s.classe === sanctionClasse))
        .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)),
    [allStudents, sanctionNiveau, sanctionClasse],
  );
  const createIncidentMutation = useCreateIncident();
  const deleteIncidentMutation = useDeleteIncident();
  const createSanctionMutation = useCreateSanction();
  const deleteSanctionMutation = useDeleteSanction();

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    let list = incidents;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (inc) =>
          inc.titre?.toLowerCase().includes(q) ||
          inc.description?.toLowerCase().includes(q) ||
          TYPE_INCIDENT_LABELS[inc.type].toLowerCase().includes(q)
      );
    }
    if (filterGravite !== "all") {
      list = list.filter((inc) => inc.gravite === filterGravite);
    }
    if (filterType !== "all") {
      list = list.filter((inc) => inc.type === filterType);
    }
    return list;
  }, [incidents, search, filterGravite, filterType]);

  // Filtered sanctions
  const filteredSanctions = useMemo(() => {
    let list = sanctions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.eleveNom?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          TYPE_SANCTION_LABELS[s.typeSanction].toLowerCase().includes(q)
      );
    }
    return list;
  }, [sanctions, search]);

  const activeList = activeTab === "incidents" ? filteredIncidents : filteredSanctions;
  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE));
  const paginatedIncidents = filteredIncidents.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  const paginatedSanctions = filteredSanctions.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const hasFilters = search || filterGravite !== "all" || filterType !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilterGravite("all");
    setFilterType("all");
    setCurrentPage(0);
  };

  const stats = [
    { label: "Total Incidents", value: incidents.length, icon: AlertTriangle, color: "bg-red-50", textColor: "text-red-700" },
    { label: "Cas Graves", value: incidents.filter((i) => i.gravite === "GRAVE" || i.gravite === "TRES_GRAVE").length, icon: ShieldAlert, color: "bg-orange-50", textColor: "text-orange-700" },
    { label: "Sanctions Actives", value: sanctions.length, icon: Gavel, color: "bg-purple-50", textColor: "text-purple-700" },
  ];

  const apiError = (setter: (e: FormErrors) => void) => (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
    const msg = err.response?.data?.message ?? "Erreur lors de l'enregistrement";
    setter({ _root: msg });
  };

  const handleCreateIncident = () => {
    const result = validate(incidentSchema, incidentForm);
    if (!result.ok) { setIncidentErrors(result.errors); return; }
    setIncidentErrors({});
    createIncidentMutation.mutate(incidentForm, {
      onSuccess: () => setIncidentFormOpen(false),
      onError: apiError(setIncidentErrors),
    });
  };

  const handleCreateSanction = () => {
    const result = validate(sanctionSchema, sanctionForm);
    if (!result.ok) { setSanctionErrors(result.errors); return; }
    setSanctionErrors({});
    createSanctionMutation.mutate(sanctionForm, {
      onSuccess: () => setSanctionFormOpen(false),
      onError: apiError(setSanctionErrors),
    });
  };

  const handleDeleteIncident = () => {
    if (!deleteIncidentTarget) return;
    deleteIncidentMutation.mutate(deleteIncidentTarget.id, {
      onSuccess: () => setDeleteIncidentTarget(null),
    });
  };

  const handleDeleteSanction = () => {
    if (!deleteSanctionTarget) return;
    deleteSanctionMutation.mutate(deleteSanctionTarget.id, {
      onSuccess: () => setDeleteSanctionTarget(null),
    });
  };

  const isLoading = incidentsLoading || sanctionsLoading;
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Discipline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerez les incidents disciplinaires et les sanctions</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate perms={["WRITE_DISCIPLINE"]}>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              setSanctionForm({ eleveId: 0, incidentId: undefined, typeSanction: "AVERTISSEMENT", description: "", dateDebut: new Date().toISOString().split("T")[0], dateFin: "", notifieParent: false });
              setSanctionNiveau("");
              setSanctionClasse("");
              setSanctionFormOpen(true);
            }}>
              <Gavel className="h-4 w-4" />
              Sanction
            </Button>
            <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={() => {
              setIncidentForm({ titre: "", date: new Date().toISOString().split("T")[0], type: "AUTRE", description: "", gravite: "LEGERE", lieu: "", elevesImpliques: [], signaleParId: undefined });
              setIncidentFormOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Signaler un incident
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
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
          </TabsList>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher..." className="ps-9" />
            </div>
            {activeTab === "incidents" && (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(0); }}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {(Object.keys(TYPE_INCIDENT_LABELS) as TypeIncident[]).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_INCIDENT_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGravite} onValueChange={(v) => { setFilterGravite(v); setCurrentPage(0); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Gravite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {(Object.keys(GRAVITE_LABELS) as GraviteType[]).map((g) => (
                      <SelectItem key={g} value={g}>{GRAVITE_LABELS[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                Reinitialiser
              </Button>
            )}
          </div>
        </motion.div>

        {/* Incidents Table */}
        <TabsContent value="incidents">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Gravite</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Description</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Eleves impliques</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun incident trouve</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedIncidents.map((inc) => (
                      <tr key={inc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">{new Date(inc.date).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{TYPE_INCIDENT_LABELS[inc.type]}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${GRAVITE_COLORS[inc.gravite]}`}>
                            {GRAVITE_LABELS[inc.gravite]}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground max-w-[250px] truncate">
                          {inc.description ?? "-"}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                          {inc.elevesImpliques?.length ?? 0} eleve{(inc.elevesImpliques?.length ?? 0) !== 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <PermissionGate perms={["WRITE_DISCIPLINE"]}>
                            <div className="hidden sm:flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteIncidentTarget(inc)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDeleteIncidentTarget(inc)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 me-2" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </PermissionGate>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && activeTab === "incidents" && (
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

        {/* Sanctions Table */}
        <TabsContent value="sanctions">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Eleve</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Date debut</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Date fin</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Description</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Parent notifie</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSanctions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <Gavel className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucune sanction trouvee</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedSanctions.map((sanction) => (
                      <tr key={sanction.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{sanction.eleveNom ?? `Eleve #${sanction.eleveId}`}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{TYPE_SANCTION_LABELS[sanction.typeSanction]}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{new Date(sanction.dateDebut).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{sanction.dateFin ? new Date(sanction.dateFin).toLocaleDateString("fr-FR") : "-"}</td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">{sanction.description ?? "-"}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <Badge variant="outline" className={sanction.notifieParent ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                            {sanction.notifieParent ? "Oui" : "Non"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <PermissionGate perms={["WRITE_DISCIPLINE"]}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteSanctionTarget(sanction)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && activeTab === "sanctions" && (
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

      {/* Create Incident Dialog */}
      <Dialog open={incidentFormOpen} onOpenChange={setIncidentFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler un incident</DialogTitle>
            <DialogDescription>Renseignez les details de l'incident disciplinaire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {incidentErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{incidentErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="incidentTitre">Titre *</Label>
              <Input id="incidentTitre" value={incidentForm.titre} onChange={(e) => setIncidentForm({ ...incidentForm, titre: e.target.value })} placeholder="Ex: Bagarre en cour de recreation" aria-invalid={!!incidentErrors.titre} className={incidentErrors.titre ? "border-red-500" : ""} />
              {incidentErrors.titre && <p className="text-xs text-red-600">{incidentErrors.titre}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateIncident">Date *</Label>
                <Input id="dateIncident" type="date" value={incidentForm.date} onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })} aria-invalid={!!incidentErrors.date} className={incidentErrors.date ? "border-red-500" : ""} />
                {incidentErrors.date && <p className="text-xs text-red-600">{incidentErrors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="incidentLieu">Lieu</Label>
                <Input id="incidentLieu" value={incidentForm.lieu} onChange={(e) => setIncidentForm({ ...incidentForm, lieu: e.target.value })} placeholder="Ex: Cour, Salle 3B..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={incidentForm.type} onValueChange={(v) => setIncidentForm({ ...incidentForm, type: v as TypeIncident })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_INCIDENT_LABELS) as TypeIncident[]).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_INCIDENT_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gravite</Label>
                <Select value={incidentForm.gravite} onValueChange={(v) => setIncidentForm({ ...incidentForm, gravite: v as GraviteType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GRAVITE_LABELS) as GraviteType[]).map((g) => (
                      <SelectItem key={g} value={g}>{GRAVITE_LABELS[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="incidentDesc">Description</Label>
              <Textarea id="incidentDesc" value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="Decrivez l'incident..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreateIncident} disabled={createIncidentMutation.isPending}>
              {createIncidentMutation.isPending ? "Creation..." : "Signaler"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sanction Dialog */}
      <Dialog open={sanctionFormOpen} onOpenChange={setSanctionFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une sanction</DialogTitle>
            <DialogDescription>Definissez la sanction pour l'eleve concerne.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {sanctionErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{sanctionErrors._root}</div>
            )}
            {sanctionErrors.eleveId && (
              <p className="text-xs text-red-600">{sanctionErrors.eleveId}</p>
            )}
            {sanctionErrors.dateFin && (
              <p className="text-xs text-red-600">Date fin: {sanctionErrors.dateFin}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Niveau *</Label>
                <Select
                  value={sanctionNiveau || undefined}
                  onValueChange={(v) => {
                    setSanctionNiveau(v);
                    setSanctionClasse("");
                    setSanctionForm({ ...sanctionForm, eleveId: 0 });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select
                  value={sanctionClasse || undefined}
                  onValueChange={(v) => {
                    setSanctionClasse(v);
                    setSanctionForm({ ...sanctionForm, eleveId: 0 });
                  }}
                  disabled={!sanctionNiveau}
                >
                  <SelectTrigger><SelectValue placeholder={sanctionNiveau ? "Choisir une classe" : "Niveau d'abord"} /></SelectTrigger>
                  <SelectContent>
                    {classeOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Eleve *</Label>
              <Select
                value={sanctionForm.eleveId ? String(sanctionForm.eleveId) : undefined}
                onValueChange={(v) => setSanctionForm({ ...sanctionForm, eleveId: v })}
                disabled={!sanctionClasse}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sanctionClasse ? "Selectionner un eleve" : "Classe d'abord"} />
                </SelectTrigger>
                <SelectContent>
                  {eleveOptions.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nom} {e.prenom} {e.matricule ? `(${e.matricule})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de sanction</Label>
              <Select value={sanctionForm.typeSanction} onValueChange={(v) => setSanctionForm({ ...sanctionForm, typeSanction: v as TypeSanction })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_SANCTION_LABELS) as TypeSanction[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_SANCTION_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sanctionDebut">Date debut</Label>
                <Input id="sanctionDebut" type="date" value={sanctionForm.dateDebut} onChange={(e) => setSanctionForm({ ...sanctionForm, dateDebut: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sanctionFin">Date fin</Label>
                <Input id="sanctionFin" type="date" value={sanctionForm.dateFin} onChange={(e) => setSanctionForm({ ...sanctionForm, dateFin: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sanctionDesc">Description</Label>
              <Textarea id="sanctionDesc" value={sanctionForm.description} onChange={(e) => setSanctionForm({ ...sanctionForm, description: e.target.value })} placeholder="Details de la sanction..." rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifieParent"
                checked={sanctionForm.notifieParent}
                onChange={(e) => setSanctionForm({ ...sanctionForm, notifieParent: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="notifieParent">Notifier le parent</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreateSanction} disabled={createSanctionMutation.isPending}>
              {createSanctionMutation.isPending ? "Creation..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Incident Confirmation */}
      <Dialog open={!!deleteIncidentTarget} onOpenChange={(open) => !open && setDeleteIncidentTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l'incident</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer cet incident ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteIncident} disabled={deleteIncidentMutation.isPending}>
              {deleteIncidentMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sanction Confirmation */}
      <Dialog open={!!deleteSanctionTarget} onOpenChange={(open) => !open && setDeleteSanctionTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la sanction</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer cette sanction ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteSanction} disabled={deleteSanctionMutation.isPending}>
              {deleteSanctionMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
