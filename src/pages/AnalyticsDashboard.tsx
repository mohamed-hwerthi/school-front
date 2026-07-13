import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import {
  useKpis,
  useComparaisonClasses,
  useElevesARisque,
  useKpiConfigs,
  useCreateKpiConfig,
  useUpdateKpiConfig,
  useDeleteKpiConfig,
} from "@/hooks/useAnalytics";
import type { KpiConfigRequest } from "@/types/analytics";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const kpiStatusConfig: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  OK: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700" },
  ALERTE: { icon: AlertCircle, bg: "bg-amber-50", text: "text-amber-700" },
  CRITIQUE: { icon: XCircle, bg: "bg-red-50", text: "text-red-700" },
};

const tendanceIcons: Record<string, React.ElementType> = {
  UP: TrendingUp,
  DOWN: TrendingDown,
  STABLE: Minus,
};

const riskBadge: Record<string, string> = {
  FAIBLE: "bg-emerald-100 text-emerald-700",
  MOYEN: "bg-amber-100 text-amber-700",
  ELEVE: "bg-orange-100 text-orange-700",
  CRITIQUE: "bg-red-100 text-red-700",
};

const KPI_TYPES = ["TAUX_REUSSITE", "TAUX_PRESENCE", "TAUX_PAIEMENT", "MOYENNE_GENERALE", "CUSTOM"];

export default function AnalyticsDashboard() {
  const loading = useSimulatedLoading(600);
  const [activeTab, setActiveTab] = useState<"dashboard" | "config">("dashboard");
  const [seuil, setSeuil] = useState(50);

  // Data
  const { data: kpis } = useKpis();
  const { data: comparaison } = useComparaisonClasses();
  const { data: elevesRisque } = useElevesARisque(seuil);
  const { data: kpiConfigs } = useKpiConfigs();

  // Mutations
  const createKpi = useCreateKpiConfig();
  const updateKpi = useUpdateKpiConfig();
  const deleteKpi = useDeleteKpiConfig();

  // KPI Config form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<KpiConfigRequest>({
    nom: "",
    type: "CUSTOM",
    valeurCible: 0,
    seuilAlerte: 0,
  });

  const handleSaveKpi = () => {
    if (!form.nom) {
      notify.error("Le nom est requis");
      return;
    }
    if (editId) {
      updateKpi.mutate({ id: editId, data: form }, {
        onSuccess: () => { notify.success("KPI mis a jour"); setShowForm(false); setEditId(null); },
      });
    } else {
      createKpi.mutate(form, {
        onSuccess: () => { notify.success("KPI cree"); setShowForm(false); },
      });
    }
  };

  const handleDeleteKpi = (id: string) => {
    deleteKpi.mutate(id, {
      onSuccess: () => notify.success("KPI supprime"),
    });
  };

  const openEdit = (config: { id: string; nom: string; type: string; valeurCible: number; seuilAlerte: number; description?: string }) => {
    setEditId(config.id);
    setForm({
      nom: config.nom,
      type: config.type,
      valeurCible: config.valeurCible,
      seuilAlerte: config.seuilAlerte,
      description: config.description,
    });
    setShowForm(true);
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & BI
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Indicateurs de performance et analyse avancee
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className="gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "config" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("config")}
            className="gap-1.5"
          >
            <Settings className="h-4 w-4" />
            Config KPI
          </Button>
        </div>
      </motion.div>

      {activeTab === "dashboard" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {(kpis || []).map((kpi, i) => {
              const status = kpiStatusConfig[kpi.statut] || kpiStatusConfig.OK;
              const TendanceIcon = tendanceIcons[kpi.tendance] || Minus;
              return (
                <motion.div
                  key={kpi.nom}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${status.bg}`}>
                      <status.icon className={`h-4 w-4 ${status.text}`} />
                    </div>
                    <TendanceIcon className={`h-4 w-4 ${
                      kpi.tendance === "UP" ? "text-emerald-500" :
                      kpi.tendance === "DOWN" ? "text-red-500" : "text-gray-400"
                    }`} />
                  </div>
                  <p className="font-heading text-2xl font-bold">{kpi.valeurActuelle}</p>
                  <p className="text-xs text-muted-foreground">{kpi.nom}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          kpi.statut === "OK" ? "bg-emerald-500" :
                          kpi.statut === "ALERTE" ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, kpi.valeurCible > 0
                            ? (kpi.valeurActuelle / kpi.valeurCible) * 100
                            : 0)}%`
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      /{kpi.valeurCible}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Class Comparison Table */}
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="p-5 pb-0">
              <h3 className="font-heading text-sm font-semibold">Comparaison des classes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Performance par classe
              </p>
            </div>
            <div className="overflow-x-auto p-5 pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Effectif</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Moyenne</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Taux Reussite</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Taux Presence</th>
                  </tr>
                </thead>
                <tbody>
                  {(comparaison?.classes || []).map((c) => (
                    <tr key={c.classeId} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-medium">{c.classeName}</td>
                      <td className="py-3 px-3">{c.effectif}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${c.moyenne >= 10 ? "text-emerald-600" : "text-red-600"}`}>
                          {c.moyenne.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">{c.tauxReussite}%</td>
                      <td className="py-3 px-3">{c.tauxPresence}%</td>
                    </tr>
                  ))}
                  {(!comparaison?.classes || comparaison.classes.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aucune donnee disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* At-Risk Students */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="p-5 pb-0 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Eleves a risque
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score de risque &ge; {seuil}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Seuil:</span>
                <Input
                  type="number"
                  value={seuil}
                  onChange={(e) => setSeuil(Number(e.target.value))}
                  className="w-20 h-8 text-xs"
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <div className="overflow-x-auto p-5 pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Eleve</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Niveau</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Absences</th>
                    <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {(elevesRisque || []).map((e) => (
                    <tr key={e.eleveId} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">
                            {e.prenom.charAt(0)}{e.nom.charAt(0)}
                          </div>
                          <span className="font-medium">{e.prenom} {e.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{e.classe || "-"}</td>
                      <td className="py-3 px-3 font-bold">{e.scoreRisque.toFixed(0)}</td>
                      <td className="py-3 px-3">
                        <Badge className={`text-xs ${riskBadge[e.niveauRisque] || ""}`}>
                          {e.niveauRisque}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">{e.totalAbsences}</td>
                      <td className="py-3 px-3">{e.totalIncidents}</td>
                    </tr>
                  ))}
                  {(!elevesRisque || elevesRisque.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucun eleve a risque au-dessus du seuil
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {activeTab === "config" && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="p-5 pb-0 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-semibold">Configuration des KPIs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Definir les indicateurs et seuils d'alerte
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => {
              setEditId(null);
              setForm({ nom: "", type: "CUSTOM", valeurCible: 0, seuilAlerte: 0 });
              setShowForm(true);
            }}>
              <Plus className="h-4 w-4" />
              Nouveau KPI
            </Button>
          </div>
          <div className="overflow-x-auto p-5 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nom</th>
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cible</th>
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Seuil Alerte</th>
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actif</th>
                  <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(kpiConfigs || []).map((config) => (
                  <tr key={config.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-3 font-medium">{config.nom}</td>
                    <td className="py-3 px-3">
                      <Badge variant="secondary" className="text-xs">{config.type}</Badge>
                    </td>
                    <td className="py-3 px-3">{config.valeurCible}</td>
                    <td className="py-3 px-3">{config.seuilAlerte}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block h-2 w-2 rounded-full ${config.actif ? "bg-emerald-500" : "bg-gray-300"}`} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(config)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteKpi(config.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!kpiConfigs || kpiConfigs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucun KPI configure
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* KPI Config Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le KPI" : "Nouveau KPI"}</DialogTitle>
            <DialogDescription>
              {editId ? "Mettez a jour les parametres du KPI" : "Definissez un nouvel indicateur de performance"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom</label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom du KPI" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KPI_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Valeur cible</label>
                <Input type="number" value={form.valeurCible}
                  onChange={(e) => setForm({ ...form, valeurCible: Number(e.target.value) })}
                  className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Seuil d'alerte</label>
                <Input type="number" value={form.seuilAlerte}
                  onChange={(e) => setForm({ ...form, seuilAlerte: Number(e.target.value) })}
                  className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveKpi}>
              {editId ? "Mettre a jour" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
