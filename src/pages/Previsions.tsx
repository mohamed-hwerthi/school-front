import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Calculator,
  ArrowUpDown,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { notify } from "@/lib/toast";
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
  usePrevisions,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useExportComptable,
} from "@/hooks/useBudget";
import type { BudgetDTO, BudgetRequest } from "@/api/budget.api";
import { CURRENCY } from "@/config/currency";
import { useLanguage } from "@/hooks/useLanguage";

const ANNEES = ["2025-2026", "2024-2025", "2023-2024"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const MOIS_LABELS: Record<number, string> = {
  1: "Janvier",
  2: "Fevrier",
  3: "Mars",
  4: "Avril",
  5: "Mai",
  6: "Juin",
  7: "Juillet",
  8: "Aout",
  9: "Septembre",
  10: "Octobre",
  11: "Novembre",
  12: "Decembre",
};

export default function Previsions() {
  const { t } = useLanguage();
  const [anneeScolaire, setAnneeScolaire] = useState(ANNEES[0]);
  const [filterType, setFilterType] = useState<"all" | "RECETTE" | "DEPENSE">("all");

  const { data: previsionData, isLoading } = usePrevisions(anneeScolaire);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudgetMutation = useDeleteBudget();
  const exportComptable = useExportComptable();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetDTO | null>(null);

  // Form state
  const emptyForm: BudgetRequest = {
    anneeScolaire,
    label: "",
    type: "RECETTE",
    categorie: "",
    montantPrevu: 0,
    montantRealise: 0,
    mois: null,
  };
  const [form, setForm] = useState<BudgetRequest>(emptyForm);

  const budgets = useMemo(() => {
    if (!previsionData?.budgets) return [];
    if (filterType === "all") return previsionData.budgets;
    return previsionData.budgets.filter((b) => b.type === filterType);
  }, [previsionData, filterType]);

  const chartData = useMemo(() => {
    if (!previsionData?.budgets) return [];
    const grouped: Record<string, { name: string; prevu: number; realise: number }> = {};
    previsionData.budgets.forEach((b) => {
      const cat = b.categorie || b.type;
      if (!grouped[cat]) {
        grouped[cat] = { name: cat, prevu: 0, realise: 0 };
      }
      grouped[cat].prevu += b.montantPrevu;
      grouped[cat].realise += b.montantRealise;
    });
    return Object.values(grouped);
  }, [previsionData]);

  const openAdd = () => {
    setForm({ ...emptyForm, anneeScolaire });
    setAddDialogOpen(true);
  };

  const openEdit = (b: BudgetDTO) => {
    setForm({
      anneeScolaire: b.anneeScolaire,
      label: b.label,
      type: b.type,
      categorie: b.categorie,
      montantPrevu: b.montantPrevu,
      montantRealise: b.montantRealise,
      mois: b.mois,
    });
    setEditBudget(b);
  };

  const handleCreate = () => {
    if (!form.label || !form.montantPrevu) {
      notify.error("Veuillez remplir les champs obligatoires");
      return;
    }
    createBudget.mutate(form, {
      onSuccess: () => {
        notify.success("Ligne budgetaire ajoutee");
        setAddDialogOpen(false);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const handleUpdate = () => {
    if (!editBudget) return;
    updateBudget.mutate(
      { id: editBudget.id, data: form },
      {
        onSuccess: () => {
          notify.success("Ligne budgetaire modifiee");
          setEditBudget(null);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBudgetMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Ligne budgetaire supprimee");
        setDeleteTarget(null);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const handleExport = () => {
    exportComptable.mutate(anneeScolaire, {
      onSuccess: () => notify.success("Export telecharge"),
      onError: (err) => notify.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Libelle *</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Ex: Frais de scolarite"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v as "RECETTE" | "DEPENSE" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RECETTE">Recette</SelectItem>
              <SelectItem value="DEPENSE">Depense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Categorie</Label>
          <Input
            value={form.categorie ?? ""}
            onChange={(e) => setForm({ ...form, categorie: e.target.value })}
            placeholder="Ex: Scolarite, Fournitures..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Mois</Label>
          <Select
            value={form.mois != null ? String(form.mois) : "none"}
            onValueChange={(v) => setForm({ ...form, mois: v === "none" ? null : Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Annuel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Annuel</SelectItem>
              {Object.entries(MOIS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Montant prevu ({CURRENCY}) *</Label>
          <Input
            type="number"
            value={form.montantPrevu || ""}
            onChange={(e) => setForm({ ...form, montantPrevu: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Montant realise ({CURRENCY})</Label>
          <Input
            type="number"
            value={form.montantRealise || ""}
            onChange={(e) => setForm({ ...form, montantRealise: Number(e.target.value) })}
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
          <h1 className="text-2xl font-bold text-foreground">{t("forecasts.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi du budget previsionnel et realise
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={anneeScolaire} onValueChange={setAnneeScolaire}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNEES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExport}
            disabled={exportComptable.isPending}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="bg-gradient-primary shadow-btn gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Nouvelle ligne
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">{t("forecasts.plannedRevenue")}</p>
              <p className="text-xl font-bold text-green-700">
                {(previsionData?.totalRecettesPrevues ?? 0).toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">{t("forecasts.plannedExpenses")}</p>
              <p className="text-xl font-bold text-red-700">
                {(previsionData?.totalDepensesPrevues ?? 0).toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">{t("forecasts.plannedBalance")}</p>
              <p className="text-xl font-bold text-blue-700">
                {(previsionData?.soldePrevu ?? 0).toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <ArrowUpDown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">{t("forecasts.variance")}</p>
              <p
                className={`text-xl font-bold ${
                  (previsionData?.variance ?? 0) >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {(previsionData?.variance ?? 0) >= 0 ? "+" : ""}
                {(previsionData?.variance ?? 0).toLocaleString()} {CURRENCY}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart: Prevu vs Realise */}
      {chartData.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Prevu vs Realise par categorie
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} ${CURRENCY}`,
                  name === "prevu" ? "Prevu" : "Realise",
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend
                formatter={(value: string) => (value === "prevu" ? "Prevu" : "Realise")}
              />
              <Bar dataKey="prevu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realise" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as "all" | "RECETTE" | "DEPENSE")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout</SelectItem>
            <SelectItem value="RECETTE">Recettes</SelectItem>
            <SelectItem value="DEPENSE">Depenses</SelectItem>
          </SelectContent>
        </Select>
        <span className="ms-auto text-xs text-muted-foreground">
          {budgets.length} ligne{budgets.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Libelle
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Categorie
                </th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">
                  Mois
                </th>
                <th className="py-3 px-4 text-end font-semibold text-muted-foreground">
                  Prevu
                </th>
                <th className="py-3 px-4 text-end font-semibold text-muted-foreground">
                  Realise
                </th>
                <th className="py-3 px-4 text-end font-semibold text-muted-foreground">
                  Ecart
                </th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Aucune ligne budgetaire trouvee
                  </td>
                </tr>
              ) : (
                budgets.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{b.label}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={b.type === "RECETTE" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {b.type === "RECETTE" ? "Recette" : "Depense"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {b.categorie || "--"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {b.mois ? MOIS_LABELS[b.mois] : "Annuel"}
                    </td>
                    <td className="py-3 px-4 text-end font-medium whitespace-nowrap">
                      {b.montantPrevu.toLocaleString()} {CURRENCY}
                    </td>
                    <td className="py-3 px-4 text-end font-medium whitespace-nowrap">
                      {b.montantRealise.toLocaleString()} {CURRENCY}
                    </td>
                    <td
                      className={`py-3 px-4 text-end font-semibold whitespace-nowrap ${
                        b.variance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {b.variance >= 0 ? "+" : ""}
                      {b.variance.toLocaleString()} {CURRENCY}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(b)}>
                            <Edit className="h-3.5 w-3.5 me-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(b)}
                            className="text-destructive"
                          >
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("forecasts.newBudgetLine")}</DialogTitle>
            <DialogDescription>
              Ajouter une prevision de recette ou de depense
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={handleCreate}
              disabled={createBudget.isPending}
            >
              {createBudget.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBudget} onOpenChange={() => setEditBudget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("forecasts.editBudgetLine")}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={handleUpdate}
              disabled={updateBudget.isPending}
            >
              {updateBudget.isPending ? "Enregistrement..." : "Enregistrer"}
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
              Voulez-vous vraiment supprimer la ligne "{deleteTarget?.label}" ? Cette
              action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBudgetMutation.isPending}
            >
              {deleteBudgetMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
