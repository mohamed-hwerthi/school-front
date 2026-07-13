import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CircleDollarSign,
  TrendingDown,
  Percent,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  MessageSquare,
  Mail,
  MoreHorizontal,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useTypesFrais,
  useAllPaiements,
  useCreatePaiement,
  useUpdatePaiement,
  useDeletePaiement,
} from "@/hooks/useFinance";
import { useAllStudents } from "@/hooks/useStudents";
import StudentCombobox from "@/components/StudentCombobox";
import ExportButton from "@/components/ExportButton";
import { FinanceSkeleton } from "@/components/skeletons/FinanceSkeleton";
import { PaiementForm } from "@/components/finance/PaiementForm";
import { CommunicationDialog } from "@/components/finance/CommunicationDialog";
import { AppelDialog } from "@/components/finance/AppelDialog";
import { SuiviEleveCard } from "@/components/finance/SuiviEleveCard";
import {
  MOIS_SCOLAIRES,
  MOIS_LABELS,
  STATUTS_PAIEMENT,
} from "@/types/finance";
import type { Paiement, ModePaiement, StatutPaiement } from "@/types/finance";
import type { Student } from "@/types/student";
import type { PaiementFormValues } from "@/lib/finance-schema";
import { CURRENCY } from "@/config/currency";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import { useSchool } from "@/hooks/useSchool";
import { generateRecuPDF, type RecuData } from "@/lib/generateRecuPDF";
import { FileDown } from "lucide-react";

const ITEMS_PER_PAGE = 8;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

type TabKey = "overview" | "paiements" | "suivi" | "relances";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const statutConfig: Record<string, { bg: string; text: string }> = {
  "Payé": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Partiel": { bg: "bg-amber-100", text: "text-amber-700" },
  "En attente": { bg: "bg-gray-100", text: "text-gray-600" },
  "En retard": { bg: "bg-red-100", text: "text-red-700" },
};

export default function FinancePaiement() {
  const { data: typesFrais = [], isLoading: loadingTypesFrais } = useTypesFrais();
  const { data: paiements = [], isLoading: loadingPaiements } = useAllPaiements();
  const { data: students = [] } = useAllStudents();
  const { school } = useSchool();
  const createPaiement = useCreatePaiement();
  const updatePaiementMutation = useUpdatePaiement();
  const deletePaiementMutation = useDeletePaiement();
  const getTypeFrais = (id: string) => typesFrais.find((t) => t.id === id);
  const getStudent = (id: string) => students.find((s) => s.id === id);

  const handleDownloadRecu = (p: Paiement) => {
    const student = getStudent(p.eleveId);
    const tf = getTypeFrais(p.typeFraisId);
    const recuData: RecuData = {
      reference: p.reference || `PAY-${p.id}`,
      studentName: student ? `${student.prenom} ${student.nom}` : `Eleve #${p.eleveId}`,
      classe: student?.classe ?? "—",
      typeFrais: tf?.nom ?? "—",
      mois: p.mois,
       anneeScolaire: p.anneeScolaire || getSelectedAnneeScolaire(),
      montantDu: p.montantDu,
      montantPaye: p.montantPaye,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
      statut: p.statut,
    };
    generateRecuPDF(recuData, school);
    notify.success("Recu PDF telecharge");
  };
  const loading = loadingTypesFrais || loadingPaiements;

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // List tab filters
  const [search, setSearch] = useState("");
  const [filterTypeFrais, setFilterTypeFrais] = useState("all");
  const [filterMois, setFilterMois] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Suivi tab
  const [selectedEleveId, setSelectedEleveId] = useState<string>("");

  // Relances tab
  const [selectedRelanceIds, setSelectedRelanceIds] = useState<number[]>([]);

  // Dialog states
  const [viewPaiement, setViewPaiement] = useState<Paiement | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editPaiement, setEditPaiement] = useState<Paiement | null>(null);
  const [deletePaiementTarget, setDeletePaiementTarget] = useState<Paiement | null>(null);
  const [smsTarget, setSmsTarget] = useState<{ student: Student; solde: number } | null>(null);
  const [emailTarget, setEmailTarget] = useState<{ student: Student; solde: number } | null>(null);
  const [appelTarget, setAppelTarget] = useState<Student | null>(null);

  // ─── Computed ────────────────────────────────────────
  const activeStudents = useMemo(
    () => students.filter((s) => s.statut === "Actif"),
    [students]
  );

  const totalDu = useMemo(() => paiements.reduce((sum, p) => sum + p.montantDu, 0), [paiements]);
  const totalPaye = useMemo(() => paiements.reduce((sum, p) => sum + p.montantPaye, 0), [paiements]);
  const resteAPayer = totalDu - totalPaye;
  const tauxRecouvrement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;

  const eleveSoldes = useMemo(() => {
    const map: Record<string, { du: number; paye: number }> = {};
    for (const p of paiements) {
      if (!map[p.eleveId]) map[p.eleveId] = { du: 0, paye: 0 };
      map[p.eleveId].du += p.montantDu;
      map[p.eleveId].paye += p.montantPaye;
    }
    return map;
  }, [paiements]);

  const elevesAJour = useMemo(
    () => activeStudents.filter((s) => {
      const solde = eleveSoldes[s.id];
      return solde && solde.du > 0 && solde.paye >= solde.du;
    }).length,
    [activeStudents, eleveSoldes]
  );

  const elevesEnRetard = useMemo(
    () => activeStudents.filter((s) => {
      const solde = eleveSoldes[s.id];
      return solde && solde.du > 0 && solde.paye < solde.du;
    }).length,
    [activeStudents, eleveSoldes]
  );

  const stats = [
    { label: "Total dû", value: `${(totalDu / 1000).toFixed(0)}K`, icon: DollarSign, bgLight: "bg-blue-50", textColor: "text-blue-700" },
    { label: "Total payé", value: `${(totalPaye / 1000).toFixed(0)}K`, icon: CircleDollarSign, bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: "Reste à payer", value: `${(resteAPayer / 1000).toFixed(0)}K`, icon: TrendingDown, bgLight: "bg-red-50", textColor: "text-red-700" },
    { label: "Taux recouvrement", value: `${tauxRecouvrement}%`, icon: Percent, bgLight: "bg-purple-50", textColor: "text-purple-700" },
    { label: "Élèves à jour", value: elevesAJour, icon: UserCheck, bgLight: "bg-cyan-50", textColor: "text-cyan-700" },
    { label: "Élèves en retard", value: elevesEnRetard, icon: AlertTriangle, bgLight: "bg-orange-50", textColor: "text-orange-700" },
  ];

  // ─── Charts data ──────────────────────────────────
  const barChartData = useMemo(() => {
    return MOIS_SCOLAIRES.slice(0, 5).map((mois) => {
      const moisPaiements = paiements.filter((p) => p.mois === mois);
      const paye = moisPaiements.reduce((sum, p) => sum + p.montantPaye, 0);
      const du = moisPaiements.reduce((sum, p) => sum + p.montantDu, 0);
      return { mois: MOIS_LABELS[mois]?.slice(0, 3) ?? mois, Payé: paye, Dû: du };
    });
  }, [paiements]);

  const pieChartData = useMemo(() => {
    return typesFrais.map((tf) => {
      const total = paiements
        .filter((p) => p.typeFraisId === tf.id)
        .reduce((sum, p) => sum + p.montantPaye, 0);
      return { name: tf.nom, value: total };
    }).filter((d) => d.value > 0);
  }, [typesFrais, paiements]);

  // ─── List tab ─────────────────────────────────────
  const filteredPaiements = useMemo(() => {
    return paiements.filter((p) => {
      const student = getStudent(p.eleveId);
      const tf = getTypeFrais(p.typeFraisId);
      const matchSearch =
        search === "" ||
        (student && `${student.prenom} ${student.nom}`.toLowerCase().includes(search.toLowerCase())) ||
        (tf && tf.nom.toLowerCase().includes(search.toLowerCase())) ||
        p.reference.toLowerCase().includes(search.toLowerCase());
      const matchType = filterTypeFrais === "all" || p.typeFraisId === filterTypeFrais;
      const matchMois = filterMois === "all" || p.mois === filterMois;
      const matchStatut = filterStatut === "all" || p.statut === filterStatut;
      return matchSearch && matchType && matchMois && matchStatut;
    });
  }, [paiements, search, filterTypeFrais, filterMois, filterStatut, getStudent, getTypeFrais]);

  const totalPages = Math.max(1, Math.ceil(filteredPaiements.length / ITEMS_PER_PAGE));
  const paginatedPaiements = filteredPaiements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ─── Relances tab ─────────────────────────────────
  const elevesAvecSolde = useMemo(() => {
    return activeStudents
      .map((s) => {
        const solde = eleveSoldes[s.id];
        const du = solde?.du ?? 0;
        const paye = solde?.paye ?? 0;
        return { student: s, du, paye, solde: du - paye };
      })
      .filter((e) => e.solde > 0)
      .sort((a, b) => b.solde - a.solde);
  }, [activeStudents, eleveSoldes]);

  // ─── Handlers ─────────────────────────────────────
  const resetFilters = () => {
    setSearch("");
    setFilterTypeFrais("all");
    setFilterMois("all");
    setFilterStatut("all");
    setCurrentPage(1);
  };

  const hasFilters =
    search || filterTypeFrais !== "all" || filterMois !== "all" || filterStatut !== "all";

  const handleAddPaiement = (data: PaiementFormValues) => {
    createPaiement.mutate(
      {
        eleveId: data.eleveId,
        typeFraisId: data.typeFraisId,
        mois: data.mois,
        montantDu: data.montantDu,
        montantPaye: data.montantPaye,
        datePaiement: data.datePaiement || null,
        modePaiement: data.modePaiement || null,
        statut: data.statut,
        reference: data.reference || "",
        notes: data.notes || "",
      },
      {
        onSuccess: () => {
          notify.success("Paiement ajouté");
          setAddDialogOpen(false);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleEditPaiement = (data: PaiementFormValues) => {
    if (!editPaiement) return;
    updatePaiementMutation.mutate(
      {
        id: editPaiement.id,
        data: {
          eleveId: data.eleveId,
          typeFraisId: data.typeFraisId,
          mois: data.mois,
          montantDu: data.montantDu,
          montantPaye: data.montantPaye,
          datePaiement: data.datePaiement || null,
          modePaiement: data.modePaiement || null,
          statut: data.statut,
          reference: data.reference || "",
          notes: data.notes || "",
        },
      },
      {
        onSuccess: () => {
          notify.success("Paiement modifié");
          setEditPaiement(null);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleDeletePaiement = () => {
    if (!deletePaiementTarget) return;
    deletePaiementMutation.mutate(deletePaiementTarget.id, {
      onSuccess: () => {
        notify.success("Paiement supprimé");
        setDeletePaiementTarget(null);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const toggleRelanceSelection = (eleveId: string) => {
    setSelectedRelanceIds((prev) =>
      prev.includes(eleveId) ? prev.filter((id) => id !== eleveId) : [...prev, eleveId]
    );
  };

  const toggleAllRelances = () => {
    if (selectedRelanceIds.length === elevesAvecSolde.length) {
      setSelectedRelanceIds([]);
    } else {
      setSelectedRelanceIds(elevesAvecSolde.map((e) => e.student.id));
    }
  };

  const handleBulkSMS = () => {
    notify.success(`SMS envoyé à ${selectedRelanceIds.length} parent(s) (simulation)`);
    setSelectedRelanceIds([]);
  };

  const handleBulkEmail = () => {
    notify.success(`Email envoyé à ${selectedRelanceIds.length} parent(s) (simulation)`);
    setSelectedRelanceIds([]);
  };

  const openSMS = (student: Student, solde: number) => setSmsTarget({ student, solde });
  const openEmail = (student: Student, solde: number) => setEmailTarget({ student, solde });
  const openAppel = (student: Student) => setAppelTarget(student);

  const selectedSuiviStudent = selectedEleveId ? getStudent(selectedEleveId) : undefined;
  const selectedSuiviSolde = selectedSuiviStudent
    ? (eleveSoldes[selectedSuiviStudent.id]?.du ?? 0) - (eleveSoldes[selectedSuiviStudent.id]?.paye ?? 0)
    : 0;

  if (loading) return <FinanceSkeleton />;

  // ─── Render tabs ──────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { key: "paiements", label: "Liste paiements", icon: DollarSign },
    { key: "suivi", label: "Suivi par élève", icon: Users },
    { key: "relances", label: "Relances", icon: Send },
  ];

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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            Finance — Paiements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi des paiements, relances et statistiques de recouvrement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            type="paiements"
            label="Exporter"
            filters={{ anneeScolaire: getSelectedAnneeScolaire() }}
          />
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau Paiement
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit flex-wrap"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgLight}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════ VUE D'ENSEMBLE ═══════════════ */}
      {activeTab === "overview" && (
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Bar Chart */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Paiements par mois</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mois" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} ${CURRENCY}`}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="Dû" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Payé" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Répartition par type de frais</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ${CURRENCY}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ LISTE PAIEMENTS ═══════════════ */}
      {activeTab === "paiements" && (
        <>
          {/* Filters */}
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Rechercher par élève, type ou référence..."
                  className="ps-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={filterTypeFrais}
                  onValueChange={(v) => { setFilterTypeFrais(v); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typesFrais.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterMois}
                  onValueChange={(v) => { setFilterMois(v); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {MOIS_SCOLAIRES.map((m) => (
                      <SelectItem key={m} value={m}>{MOIS_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatut}
                  onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {STATUTS_PAIEMENT.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredPaiements.length} paiement{filteredPaiements.length !== 1 ? "s" : ""} trouvé
              {filteredPaiements.length !== 1 ? "s" : ""}
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            custom={7}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Mois</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Montant</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPaiements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun paiement trouvé</p>
                        <p className="text-xs mt-1">Essayez de modifier vos filtres</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPaiements.map((p) => {
                      const student = getStudent(p.eleveId);
                      const tf = getTypeFrais(p.typeFraisId);
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {student ? `${student.prenom} ${student.nom}` : `#${p.eleveId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student?.classe} {p.reference ? `· ${p.reference}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <Badge variant="outline" className="font-medium">
                              {tf?.nom ?? `#${p.typeFraisId}`}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                            {MOIS_LABELS[p.mois] ?? p.mois}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-emerald-600 font-medium">
                              {p.montantPaye.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground"> / {p.montantDu.toLocaleString()} {CURRENCY}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                statutConfig[p.statut]?.bg
                              } ${statutConfig[p.statut]?.text}`}
                            >
                              {p.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                onClick={() => setViewPaiement(p)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                onClick={() => handleDownloadRecu(p)}
                                title="Telecharger recu"
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                                onClick={() => setEditPaiement(p)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                onClick={() => setDeletePaiementTarget(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewPaiement(p)}>
                                    <Eye className="h-4 w-4 me-2" /> Voir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditPaiement(p)}>
                                    <Edit className="h-4 w-4 me-2" /> Modifier
                                  </DropdownMenuItem>
                                  {student && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => openSMS(student, p.montantDu - p.montantPaye)}
                                      >
                                        <MessageSquare className="h-4 w-4 me-2" /> Relance SMS
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openEmail(student, p.montantDu - p.montantPaye)}
                                      >
                                        <Mail className="h-4 w-4 me-2" /> Relance Email
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDownloadRecu(p)}>
                                    <FileDown className="h-4 w-4 me-2" /> Recu PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeletePaiementTarget(p)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 me-2" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredPaiements.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ═══════════════ SUIVI PAR ÉLÈVE ═══════════════ */}
      {activeTab === "suivi" && (
        <>
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="w-full max-w-md">
              <StudentCombobox
                value={selectedEleveId}
                onChange={setSelectedEleveId}
                filter={(s) => activeStudents.some((a) => String(a.id) === String(s.id))}
              />
            </div>
          </motion.div>

          {selectedSuiviStudent ? (
            <motion.div
              custom={7}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <SuiviEleveCard
                student={selectedSuiviStudent}
                onAppel={() => openAppel(selectedSuiviStudent)}
                onSMS={() => openSMS(selectedSuiviStudent, selectedSuiviSolde)}
                onEmail={() => openEmail(selectedSuiviStudent, selectedSuiviSolde)}
              />
            </motion.div>
          ) : (
            <motion.div
              custom={7}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground"
            >
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sélectionnez un élève</p>
              <p className="text-xs mt-1">pour voir son suivi détaillé des paiements</p>
            </motion.div>
          )}
        </>
      )}

      {/* ═══════════════ RELANCES ═══════════════ */}
      {activeTab === "relances" && (
        <>
          {/* Bulk actions */}
          {selectedRelanceIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm flex items-center justify-between"
            >
              <p className="text-sm font-medium text-blue-700">
                {selectedRelanceIds.length} élève{selectedRelanceIds.length > 1 ? "s" : ""} sélectionné
                {selectedRelanceIds.length > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleBulkSMS}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS groupé
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleBulkEmail}>
                  <Mail className="h-3.5 w-3.5" />
                  Email groupé
                </Button>
              </div>
            </motion.div>
          )}

          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start">
                      <Checkbox
                        checked={selectedRelanceIds.length === elevesAvecSolde.length && elevesAvecSolde.length > 0}
                        onCheckedChange={toggleAllRelances}
                      />
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Classe</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Total dû</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Payé</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Solde</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {elevesAvecSolde.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Tous les élèves sont à jour !</p>
                      </td>
                    </tr>
                  ) : (
                    elevesAvecSolde.map((entry) => (
                      <tr
                        key={entry.student.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedRelanceIds.includes(entry.student.id)}
                            onCheckedChange={() => toggleRelanceSelection(entry.student.id)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {entry.student.prenom} {entry.student.nom}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.student.telephoneParent}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                          {entry.student.classe}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                          {entry.du.toLocaleString()} {CURRENCY}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-emerald-600 font-medium">
                          {entry.paye.toLocaleString()} {CURRENCY}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-red-600">
                            {entry.solde.toLocaleString()} {CURRENCY}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                              onClick={() => openAppel(entry.student)}
                              title="Appeler"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-green-600"
                              onClick={() => openSMS(entry.student, entry.solde)}
                              title="SMS"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-purple-600"
                              onClick={() => openEmail(entry.student, entry.solde)}
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
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
        </>
      )}

      {/* ─── View Paiement Dialog ──────────────────── */}
      <Dialog open={!!viewPaiement} onOpenChange={(open) => !open && setViewPaiement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>Informations complètes</DialogDescription>
          </DialogHeader>
          {viewPaiement && (() => {
            const student = getStudent(viewPaiement.eleveId);
            const tf = getTypeFrais(viewPaiement.typeFraisId);
            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">
                      {student ? `${student.prenom} ${student.nom}` : `#${viewPaiement.eleveId}`}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statutConfig[viewPaiement.statut]?.bg
                      } ${statutConfig[viewPaiement.statut]?.text}`}
                    >
                      {viewPaiement.statut}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Type de frais</p>
                    <p className="font-medium">{tf?.nom ?? `#${viewPaiement.typeFraisId}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mois</p>
                    <p className="font-medium">{MOIS_LABELS[viewPaiement.mois] ?? viewPaiement.mois}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Montant dû</p>
                    <p className="font-medium">{viewPaiement.montantDu.toLocaleString()} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Montant payé</p>
                    <p className="font-medium text-emerald-600">{viewPaiement.montantPaye.toLocaleString()} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date paiement</p>
                    <p className="font-medium">{viewPaiement.datePaiement ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mode</p>
                    <p className="font-medium">{viewPaiement.modePaiement ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Référence</p>
                    <p className="font-medium">{viewPaiement.reference || "—"}</p>
                  </div>
                  {viewPaiement.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="font-medium">{viewPaiement.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-gradient-primary shadow-btn"
                    onClick={() => handleDownloadRecu(viewPaiement)}
                  >
                    <FileDown className="h-4 w-4" />
                    Telecharger le recu
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Add Paiement Dialog ───────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
            <DialogDescription>Enregistrer un nouveau paiement</DialogDescription>
          </DialogHeader>
          <PaiementForm
            onSubmit={handleAddPaiement}
            onCancel={() => setAddDialogOpen(false)}
            submitLabel="Ajouter"
          />
        </DialogContent>
      </Dialog>

      {/* ─── Edit Paiement Dialog ──────────────────── */}
      <Dialog open={!!editPaiement} onOpenChange={(open) => !open && setEditPaiement(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
            <DialogDescription>Mettre à jour les informations</DialogDescription>
          </DialogHeader>
          {editPaiement && (
            <PaiementForm
              defaultValues={{
                eleveId: editPaiement.eleveId,
                typeFraisId: editPaiement.typeFraisId,
                mois: editPaiement.mois,
                montantDu: editPaiement.montantDu,
                montantPaye: editPaiement.montantPaye,
                datePaiement: editPaiement.datePaiement ?? "",
                modePaiement: editPaiement.modePaiement ?? "",
                statut: editPaiement.statut,
                reference: editPaiement.reference,
                notes: editPaiement.notes,
              }}
              onSubmit={handleEditPaiement}
              onCancel={() => setEditPaiement(null)}
              submitLabel="Modifier"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────── */}
      <Dialog
        open={!!deletePaiementTarget}
        onOpenChange={(open) => !open && setDeletePaiementTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ?{" "}
              {deletePaiementTarget && (() => {
                const s = getStudent(deletePaiementTarget.eleveId);
                const tf = getTypeFrais(deletePaiementTarget.typeFraisId);
                return (
                  <span className="font-semibold text-foreground">
                    {s ? `${s.prenom} ${s.nom}` : ""} — {tf?.nom ?? ""} ({MOIS_LABELS[deletePaiementTarget.mois] ?? deletePaiementTarget.mois})
                  </span>
                );
              })()}
              . Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeletePaiement}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Communication Dialogs ─────────────────── */}
      <CommunicationDialog
        open={!!smsTarget}
        onOpenChange={(open) => !open && setSmsTarget(null)}
        student={smsTarget?.student ?? null}
        type="SMS"
        solde={smsTarget?.solde ?? 0}
      />

      <CommunicationDialog
        open={!!emailTarget}
        onOpenChange={(open) => !open && setEmailTarget(null)}
        student={emailTarget?.student ?? null}
        type="Email"
        solde={emailTarget?.solde ?? 0}
      />

      <AppelDialog
        open={!!appelTarget}
        onOpenChange={(open) => !open && setAppelTarget(null)}
        student={appelTarget}
      />
    </div>
  );
}
