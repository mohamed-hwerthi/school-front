import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { factureSchema, echeancierSchema } from "@/lib/finance-schemas";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  useFacturesPaged,
  useAllFactures,
  useCreateFacture,
  useGenerateFacture,
  useCancelFacture,
  useDeleteFacture,
  useEcheanciers,
  useCreateEcheancier,
  useDeleteEcheancier,
} from "@/hooks/useFactures";
import { CURRENCY } from "@/config/currency";
import type { Facture, Echeancier } from "@/types/facture";

const STATUT_COLORS: Record<Facture["statut"], string> = {
  NON_PAYEE: "bg-red-100 text-red-700",
  PARTIELLEMENT_PAYEE: "bg-amber-100 text-amber-700",
  PAYEE: "bg-emerald-100 text-emerald-700",
  ANNULEE: "bg-muted text-muted-foreground",
};

const ITEMS_PER_PAGE = 20;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function FacturesPage() {
  const { t } = useLanguage();

  const STATUT_LABELS: Record<Facture["statut"], string> = useMemo(() => ({
    NON_PAYEE: t("invoices.statuses.unpaid"),
    PARTIELLEMENT_PAYEE: t("invoices.statuses.partial"),
    PAYEE: t("invoices.statuses.paid"),
    ANNULEE: t("invoices.statuses.cancelled"),
  }), [t]);
  const [activeTab, setActiveTab] = useState("factures");
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Generate facture
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateEleveId, setGenerateEleveId] = useState("");

  // Create facture form
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    eleveId: 0,
    dateEmission: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    montantTotal: 0,
    montantRemise: 0,
    montantNet: 0,
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [echeancierErrors, setEcheancierErrors] = useState<FormErrors>({});

  // Detail view
  const [detailTarget, setDetailTarget] = useState<Facture | null>(null);

  // Echeancier form
  const [echeancierFormOpen, setEcheancierFormOpen] = useState(false);
  const [echeancierForm, setEcheancierForm] = useState({
    eleveId: 0,
    typeFraisId: undefined as number | undefined,
    montantTotal: 0,
    nbMensualites: 3,
    dateDebut: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<Facture | null>(null);
  const [deleteEcheancierTarget, setDeleteEcheancierTarget] = useState<Echeancier | null>(null);

  const { data: pagedData, isLoading, isFetching } = useFacturesPaged({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    search: search || undefined,
    statut: filterStatut !== "all" ? filterStatut : undefined,
  });

  const { data: allFactures = [] } = useAllFactures();
  const createFactureMutation = useCreateFacture();
  const generateMutation = useGenerateFacture();
  const cancelMutation = useCancelFacture();
  const deleteMutation = useDeleteFacture();

  const { data: echeanciers = [] } = useEcheanciers();
  const createEcheancierMutation = useCreateEcheancier();
  const deleteEcheancierMutation = useDeleteEcheancier();

  const factures = pagedData?.content ?? [];
  const totalElements = pagedData?.totalElements ?? 0;
  const totalPages = pagedData?.totalPages ?? 1;

  const totalMontant = allFactures.reduce((s, f) => s + f.montantNet, 0);
  const payees = allFactures.filter((f) => f.statut === "PAYEE");
  const montantPaye = payees.reduce((s, f) => s + f.montantNet, 0);
  const nonPayees = allFactures.filter((f) => f.statut === "NON_PAYEE" || f.statut === "PARTIELLEMENT_PAYEE");
  const montantRestant = nonPayees.reduce((s, f) => s + f.montantNet, 0);

  const stats = [
    { label: t("invoices.totalInvoices"), value: allFactures.length, icon: Receipt, color: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("invoices.totalAmount"), value: `${totalMontant.toLocaleString()} ${CURRENCY}`, icon: DollarSign, color: "bg-purple-50", textColor: "text-purple-700" },
    { label: t("invoices.paidAmount"), value: `${montantPaye.toLocaleString()} ${CURRENCY}`, icon: CheckCircle, color: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("invoices.remainingAmount"), value: `${montantRestant.toLocaleString()} ${CURRENCY}`, icon: Clock, color: "bg-red-50", textColor: "text-red-700" },
  ];

  const hasFilters = search || filterStatut !== "all";
  const resetFilters = () => {
    setSearch("");
    setFilterStatut("all");
    setCurrentPage(0);
  };

  const handleCreateFacture = () => {
    const result = validate(factureSchema, createForm);
    if (!result.ok) { setCreateErrors(result.errors); return; }
    setCreateErrors({});
    createFactureMutation.mutate(createForm, {
      onSuccess: () => setCreateOpen(false),
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setCreateErrors({ _root: err.response?.data?.message ?? "Erreur lors de la création" });
      },
    });
  };

  const handleGenerate = () => {
    if (!generateEleveId) return;
    generateMutation.mutate(generateEleveId, {
      onSuccess: () => {
        setGenerateOpen(false);
        setGenerateEleveId("");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleCreateEcheancier = () => {
    const result = validate(echeancierSchema, { ...echeancierForm, nombreEcheances: echeancierForm.nbMensualites });
    if (!result.ok) { setEcheancierErrors(result.errors); return; }
    setEcheancierErrors({});
    createEcheancierMutation.mutate(echeancierForm, {
      onSuccess: () => setEcheancierFormOpen(false),
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setEcheancierErrors({ _root: err.response?.data?.message ?? "Erreur lors de la création" });
      },
    });
  };

  const handleDeleteEcheancier = () => {
    if (!deleteEcheancierTarget) return;
    deleteEcheancierMutation.mutate(deleteEcheancierTarget.id, {
      onSuccess: () => setDeleteEcheancierTarget(null),
    });
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("invoices.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("invoices.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setGenerateEleveId(""); setGenerateOpen(true); }}>
            <FileText className="h-4 w-4" />
            {t("invoices.generateInvoice")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            setEcheancierForm({ eleveId: 0, typeFraisId: undefined, montantTotal: 0, nbMensualites: 3, dateDebut: "" });
            setEcheancierFormOpen(true);
          }}>
            <CreditCard className="h-4 w-4" />
            {t("invoices.schedules")}
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={() => {
            setCreateForm({ eleveId: 0, dateEmission: new Date().toISOString().split("T")[0], dateEcheance: "", montantTotal: 0, montantRemise: 0, montantNet: 0 });
            setCreateOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            {t("invoices.newInvoice")}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(0); }}>
        {/* Filters */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
          <TabsList>
            <TabsTrigger value="factures">{t("invoices.invoices")}</TabsTrigger>
            <TabsTrigger value="echeanciers">{t("invoices.schedules")}</TabsTrigger>
          </TabsList>
          {activeTab === "factures" && (
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder={t("invoices.searchPlaceholder")} className="ps-9" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(0); }}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                    {(Object.keys(STATUT_LABELS) as Facture["statut"][]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUT_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" /> {t("common.reset")}
                  </Button>
                )}
              </div>
            </div>
          )}
          {activeTab === "factures" && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {totalElements} {t("invoices.invoices").toLowerCase()} {t("common.found")}
              {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
          )}
        </motion.div>

        {/* Factures Table */}
        <TabsContent value="factures">
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("invoices.number")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.student")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("invoices.issueDate")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("common.amount")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("invoices.discountAmount")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("invoices.net")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.status")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("invoices.noInvoice")}</p>
                        <p className="text-xs mt-1">{t("common.tryModifyFilters")}</p>
                      </td>
                    </tr>
                  ) : (
                    factures.map((facture) => (
                      <tr key={facture.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-medium text-foreground">{facture.numero}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{facture.eleveNom ?? `Eleve #${facture.eleveId}`}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{new Date(facture.dateEmission).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-end text-muted-foreground">{facture.montantTotal.toLocaleString()} {CURRENCY}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-end text-muted-foreground">{facture.montantRemise > 0 ? `-${facture.montantRemise.toLocaleString()}` : "-"}</td>
                        <td className="py-3 px-4 text-end font-semibold text-foreground">{facture.montantNet.toLocaleString()} {CURRENCY}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[facture.statut]}`}>
                            {STATUT_LABELS[facture.statut]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setDetailTarget(facture)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {facture.statut !== "ANNULEE" && facture.statut !== "PAYEE" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-600" onClick={() => cancelMutation.mutate(facture.id)}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(facture)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailTarget(facture)}>
                                <Eye className="h-4 w-4 me-2" /> {t("common.details")}
                              </DropdownMenuItem>
                              {facture.statut !== "ANNULEE" && facture.statut !== "PAYEE" && (
                                <DropdownMenuItem onClick={() => cancelMutation.mutate(facture.id)}>
                                  <Ban className="h-4 w-4 me-2" /> {t("common.cancel")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteTarget(facture)} className="text-red-600">
                                <Trash2 className="h-4 w-4 me-2" /> {t("common.delete")}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i;
                    else if (currentPage < 4) pageNum = i;
                    else if (currentPage > totalPages - 5) pageNum = totalPages - 7 + i;
                    else pageNum = currentPage - 3 + i;
                    return (
                      <Button key={pageNum} variant={pageNum === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(pageNum)}>
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Echeanciers Tab */}
        <TabsContent value="echeanciers">
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">ID</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">{t("common.student")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("invoices.totalAmount")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t("invoices.installments")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">{t("common.startDate")}</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">{t("invoices.schedules")}</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {echeanciers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("invoices.noSchedule")}</p>
                      </td>
                    </tr>
                  ) : (
                    echeanciers.map((ech) => {
                      const paidCount = ech.echeances.filter((e) => e.statut === "PAYEE").length;
                      const lateCount = ech.echeances.filter((e) => e.statut === "EN_RETARD").length;
                      return (
                        <tr key={ech.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">#{ech.id}</td>
                          <td className="py-3 px-4 font-medium text-foreground">Eleve #{ech.eleveId}</td>
                          <td className="py-3 px-4 text-end font-semibold text-foreground">{ech.montantTotal.toLocaleString()} {CURRENCY}</td>
                          <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{ech.nbMensualites}</td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{new Date(ech.dateDebut).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 text-[10px]">{paidCount} payees</Badge>
                              {lateCount > 0 && <Badge variant="outline" className="bg-red-100 text-red-700 text-[10px]">{lateCount} en retard</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteEcheancierTarget(ech)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Generate Facture Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("invoices.generateInvoice")}</DialogTitle>
            <DialogDescription>{t("invoices.generateInvoice")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="genEleveId">{t("common.student")} ID</Label>
              <Input id="genEleveId" type="number" value={generateEleveId} onChange={(e) => setGenerateEleveId(e.target.value)} placeholder={t("invoices.enterStudentId")} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending || !generateEleveId}>
              {generateMutation.isPending ? t("common.generating") : t("common.generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Facture Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.newInvoice")}</DialogTitle>
            <DialogDescription>{t("invoices.createInvoice")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="factEleveId">{t("common.student")} ID *</Label>
              <Input id="factEleveId" type="number" value={createForm.eleveId || ""} onChange={(e) => {
                const v = Number(e.target.value);
                setCreateForm({ ...createForm, eleveId: v });
              }} placeholder={t("invoices.enterStudentId")} aria-invalid={!!createErrors.eleveId} className={createErrors.eleveId ? "border-red-500" : ""} />
              {createErrors.eleveId && <p className="text-xs text-red-600">{createErrors.eleveId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="factDateEmission">{t("invoices.issueDate")}</Label>
                <Input id="factDateEmission" type="date" value={createForm.dateEmission} onChange={(e) => setCreateForm({ ...createForm, dateEmission: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="factDateEcheance">{t("invoices.dueDate")}</Label>
                <Input id="factDateEcheance" type="date" value={createForm.dateEcheance} onChange={(e) => setCreateForm({ ...createForm, dateEcheance: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="factMontant">{t("common.amount")}</Label>
                <Input id="factMontant" type="number" value={createForm.montantTotal || ""} onChange={(e) => {
                  const total = Number(e.target.value);
                  setCreateForm({ ...createForm, montantTotal: total, montantNet: total - createForm.montantRemise });
                }} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="factRemise">{t("invoices.discountAmount")}</Label>
                <Input id="factRemise" type="number" value={createForm.montantRemise || ""} onChange={(e) => {
                  const remise = Number(e.target.value);
                  setCreateForm({ ...createForm, montantRemise: remise, montantNet: createForm.montantTotal - remise });
                }} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="factNet">{t("invoices.net")}</Label>
                <Input id="factNet" type="number" value={createForm.montantNet || ""} readOnly className="bg-muted/30" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button onClick={handleCreateFacture} disabled={createFactureMutation.isPending}>
              {createFactureMutation.isPending ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.invoiceDetails")}</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("invoices.number")}</p>
                  <p className="font-mono font-medium">{detailTarget.numero}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("common.student")}</p>
                  <p className="font-medium">{detailTarget.eleveNom ?? `#${detailTarget.eleveId}`}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoices.issueDate")}</p>
                  <p>{new Date(detailTarget.dateEmission).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoices.dueDate")}</p>
                  <p>{detailTarget.dateEcheance ? new Date(detailTarget.dateEcheance).toLocaleDateString("fr-FR") : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoices.totalAmount")}</p>
                  <p className="font-medium">{detailTarget.montantTotal.toLocaleString()} {CURRENCY}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoices.discountAmount")}</p>
                  <p>{detailTarget.montantRemise > 0 ? `${detailTarget.montantRemise.toLocaleString()} ${CURRENCY}` : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("invoices.netAmount")}</p>
                  <p className="font-heading text-lg font-bold">{detailTarget.montantNet.toLocaleString()} {CURRENCY}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("common.status")}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[detailTarget.statut]}`}>
                    {STATUT_LABELS[detailTarget.statut]}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Echeancier Dialog */}
      <Dialog open={echeancierFormOpen} onOpenChange={setEcheancierFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.newSchedule")}</DialogTitle>
            <DialogDescription>{t("invoices.createSchedule")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="echEleveId">{t("common.student")} ID</Label>
              <Input id="echEleveId" type="number" value={echeancierForm.eleveId || ""} onChange={(e) => setEcheancierForm({ ...echeancierForm, eleveId: e.target.value })} placeholder={t("invoices.enterStudentId")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="echMontant">{t("invoices.totalAmount")}</Label>
                <Input id="echMontant" type="number" value={echeancierForm.montantTotal || ""} onChange={(e) => setEcheancierForm({ ...echeancierForm, montantTotal: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="echMensualites">{t("invoices.nbInstallments")}</Label>
                <Input id="echMensualites" type="number" min={1} value={echeancierForm.nbMensualites} onChange={(e) => setEcheancierForm({ ...echeancierForm, nbMensualites: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="echDateDebut">{t("common.startDate")}</Label>
              <Input id="echDateDebut" type="date" value={echeancierForm.dateDebut} onChange={(e) => setEcheancierForm({ ...echeancierForm, dateDebut: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button onClick={handleCreateEcheancier} disabled={createEcheancierMutation.isPending}>
              {createEcheancierMutation.isPending ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Facture Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("invoices.deleteInvoice")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")}{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.numero}</span> ?
              {t("common.irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Echeancier Confirmation */}
      <Dialog open={!!deleteEcheancierTarget} onOpenChange={(open) => !open && setDeleteEcheancierTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("invoices.deleteSchedule")}</DialogTitle>
            <DialogDescription>{t("common.deleteConfirmMsg")} ? {t("common.irreversible")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteEcheancier} disabled={deleteEcheancierMutation.isPending}>
              {deleteEcheancierMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
