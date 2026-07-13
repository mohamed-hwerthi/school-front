import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingDown,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  MoreHorizontal,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  useCategoriesDepense,
  useDepensesPaged,
  useDepenseStats,
  useCreateDepense,
  useUpdateDepense,
  useDeleteDepense,
} from "@/hooks/useDepenses";
import type { DepenseDTO, DepenseRequest } from "@/api/depenses.api";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import { validate, type FormErrors } from "@/lib/validate";
import { depenseSchema } from "@/lib/finance-schemas";
import { CURRENCY } from "@/config/currency";

const ITEMS_PER_PAGE = 10;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#a855f7",
];

const MODE_LABELS: Record<string, string> = {
  ESPECES: "Especes",
  VIREMENT: "Virement",
  CHEQUE: "Cheque",
  CARTE_BANCAIRE: "Carte bancaire",
  PRELEVEMENT: "Prelevement",
};

const MODES = ["ESPECES", "VIREMENT", "CHEQUE", "CARTE_BANCAIRE", "PRELEVEMENT"] as const;

export default function Depenses() {
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: categories = [] } = useCategoriesDepense();
  const currentAnnee = getSelectedAnneeScolaire();
  const { data: statsData } = useDepenseStats(currentAnnee);
  const { data: pagedData, isLoading } = useDepensesPaged({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    search: search || undefined,
    anneeScolaire: currentAnnee,
    categorieId: filterCategorie !== "all" ? filterCategorie : undefined,
    sortBy: "dateDepense",
    sortDir: "desc",
  });

  const createDepense = useCreateDepense();
  const updateDepense = useUpdateDepense();
  const deleteDepenseMutation = useDeleteDepense();

  const depenses = pagedData?.content ?? [];
  const totalPages = pagedData?.totalPages ?? 1;
  const totalElements = pagedData?.totalElements ?? 0;

  // Dialog states
  const [viewDepense, setViewDepense] = useState<DepenseDTO | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDepense, setEditDepense] = useState<DepenseDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepenseDTO | null>(null);

  // Form state
  const emptyForm: DepenseRequest = {
    categorieId: 0,
    libelle: "",
    montant: 0,
    dateDepense: new Date().toISOString().split("T")[0],
    modePaiement: null,
    fournisseur: "",
    reference: "",
    recurrente: false,
    notes: "",
    anneeScolaire: getSelectedAnneeScolaire(),
  };
  const [form, setForm] = useState<DepenseRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const chartData = useMemo(() => {
    if (!statsData?.parCategorie) return [];
    return statsData.parCategorie.map((c) => ({
      name: c.categorieNom.length > 15 ? c.categorieNom.slice(0, 15) + "..." : c.categorieNom,
      total: c.total,
    }));
  }, [statsData]);

  const resetFilters = () => {
    setSearch("");
    setFilterCategorie("all");
    setCurrentPage(0);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setAddDialogOpen(true);
  };

  const openEdit = (d: DepenseDTO) => {
    setForm({
      categorieId: d.categorieId,
      libelle: d.libelle,
      montant: d.montant,
      dateDepense: d.dateDepense,
      modePaiement: d.modePaiement,
      fournisseur: d.fournisseur ?? "",
      reference: d.reference ?? "",
      recurrente: d.recurrente,
      notes: d.notes ?? "",
      anneeScolaire: d.anneeScolaire,
    });
    setEditDepense(d);
  };

  const handleCreate = () => {
    const result = validate(depenseSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    createDepense.mutate(form, {
      onSuccess: () => {
        notify.success("Depense ajoutee");
        setAddDialogOpen(false);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const handleUpdate = () => {
    if (!editDepense) return;
    updateDepense.mutate(
      { id: editDepense.id, data: form },
      {
        onSuccess: () => {
          notify.success("Depense modifiee");
          setEditDepense(null);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDepenseMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Depense supprimee");
        setDeleteTarget(null);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const formFields = (
    <div className="space-y-4">
      {formErrors._root && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formErrors._root}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Catégorie *</Label>
          <Select
            value={form.categorieId ? String(form.categorieId) : ""}
            onValueChange={(v) => setForm({ ...form, categorieId: v })}
          >
            <SelectTrigger className={formErrors.categorieId ? "border-red-500" : ""}><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.categorieId && <p className="text-xs text-red-600">{formErrors.categorieId}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Libellé *</Label>
          <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} aria-invalid={!!formErrors.libelle} className={formErrors.libelle ? "border-red-500" : ""} />
          {formErrors.libelle && <p className="text-xs text-red-600">{formErrors.libelle}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Montant ({CURRENCY}) *</Label>
          <Input type="number" value={form.montant || ""} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} aria-invalid={!!formErrors.montant} className={formErrors.montant ? "border-red-500" : ""} />
          {formErrors.montant && <p className="text-xs text-red-600">{formErrors.montant}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.dateDepense} onChange={(e) => setForm({ ...form, dateDepense: e.target.value })} aria-invalid={!!formErrors.dateDepense} className={formErrors.dateDepense ? "border-red-500" : ""} />
          {formErrors.dateDepense && <p className="text-xs text-red-600">{formErrors.dateDepense}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Mode de paiement</Label>
          <Select
            value={form.modePaiement ?? ""}
            onValueChange={(v) => setForm({ ...form, modePaiement: v as DepenseRequest["modePaiement"] })}
          >
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>{MODE_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fournisseur</Label>
          <Input value={form.fournisseur ?? ""} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Reference</Label>
          <Input value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="DEP-XXXXXX" />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Checkbox
            checked={form.recurrente ?? false}
            onCheckedChange={(v) => setForm({ ...form, recurrente: !!v })}
            id="recurrente"
          />
          <Label htmlFor="recurrente" className="cursor-pointer">Depense recurrente</Label>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Depenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des sorties financieres — {currentAnnee}
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-btn gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Nouvelle depense
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Total depenses</p>
              <p className="text-xl font-bold text-red-700">
                {(statsData?.totalDepenses ?? 0).toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nombre d'operations</p>
              <p className="text-xl font-bold text-foreground">{statsData?.nombreDepenses ?? 0}</p>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Categories</p>
              <p className="text-xl font-bold text-foreground">{categories.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Depenses par categorie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} ${CURRENCY}`, "Total"]}
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
            className="ps-9"
          />
        </div>
        <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setCurrentPage(0); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterCategorie !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
            <X className="h-3.5 w-3.5" /> Reinitialiser
          </Button>
        )}
        <span className="ms-auto text-xs text-muted-foreground">
          {totalElements} depense{totalElements > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Date</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Libelle</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Categorie</th>
                <th className="py-3 px-4 text-end font-semibold text-muted-foreground">Montant</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Fournisseur</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Mode</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {depenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucune depense trouvee
                  </td>
                </tr>
              ) : (
                depenses.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(d.dateDepense).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {d.libelle}
                      {d.recurrente && (
                        <Badge variant="outline" className="ms-2 text-[10px]">Recurrente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">{d.categorieNom}</Badge>
                    </td>
                    <td className="py-3 px-4 text-end font-semibold text-red-600 whitespace-nowrap">
                      -{d.montant.toLocaleString()} {CURRENCY}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {d.fournisseur || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {d.modePaiement ? MODE_LABELS[d.modePaiement] : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDepense(d)}>
                            <Eye className="h-3.5 w-3.5 me-2" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(d)}>
                            <Edit className="h-3.5 w-3.5 me-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(d)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5 me-2" /> Supprimer
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewDepense} onOpenChange={() => setViewDepense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail de la depense</DialogTitle>
          </DialogHeader>
          {viewDepense && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Libelle :</span> <strong>{viewDepense.libelle}</strong></div>
                <div><span className="text-muted-foreground">Categorie :</span> <strong>{viewDepense.categorieNom}</strong></div>
                <div><span className="text-muted-foreground">Montant :</span> <strong className="text-red-600">{viewDepense.montant.toLocaleString()} {CURRENCY}</strong></div>
                <div><span className="text-muted-foreground">Date :</span> <strong>{new Date(viewDepense.dateDepense).toLocaleDateString("fr-FR")}</strong></div>
                <div><span className="text-muted-foreground">Mode :</span> <strong>{viewDepense.modePaiement ? MODE_LABELS[viewDepense.modePaiement] : "—"}</strong></div>
                <div><span className="text-muted-foreground">Fournisseur :</span> <strong>{viewDepense.fournisseur || "—"}</strong></div>
                <div><span className="text-muted-foreground">Reference :</span> <strong>{viewDepense.reference || "—"}</strong></div>
                <div><span className="text-muted-foreground">Recurrente :</span> <strong>{viewDepense.recurrente ? "Oui" : "Non"}</strong></div>
              </div>
              {viewDepense.notes && (
                <div><span className="text-muted-foreground">Notes :</span> <p className="mt-1">{viewDepense.notes}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Fermer</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle depense</DialogTitle>
            <DialogDescription>Enregistrer une sortie financiere</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button className="bg-gradient-primary shadow-btn" onClick={handleCreate}
              disabled={createDepense.isPending}>
              {createDepense.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDepense} onOpenChange={() => setEditDepense(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la depense</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button className="bg-gradient-primary shadow-btn" onClick={handleUpdate}
              disabled={updateDepense.isPending}>
              {updateDepense.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer la depense "{deleteTarget?.libelle}" ?
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}
              disabled={deleteDepenseMutation.isPending}>
              {deleteDepenseMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
