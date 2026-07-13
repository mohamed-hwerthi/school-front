import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  Power,
  PowerOff,
  ArrowUpDown,
  Eye,
  Plus,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
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
  useSuperAdminDashboard,
  useSuperAdminTenants,
  useActivateTenant,
  useDeactivateTenant,
  useChangePlan,
} from "@/hooks/useSaas";
import type { TenantResponse } from "@/types/saas";
import { useLanguage } from "@/hooks/useLanguage";
import { CURRENCY } from "@/config/currency";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700",
  STANDARD: "bg-blue-100 text-blue-700",
  PREMIUM: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default function SuperAdminDashboard() {
  const { t } = useLanguage();
  const loading = useSimulatedLoading(600);
  const { data: dashboard } = useSuperAdminDashboard();
  const { data: tenants } = useSuperAdminTenants();
  const activate = useActivateTenant();
  const deactivate = useDeactivateTenant();
  const changePlan = useChangePlan();

  const [planDialog, setPlanDialog] = useState<TenantResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const handleToggleActive = (tenant: TenantResponse) => {
    if (tenant.active) {
      deactivate.mutate(tenant.id, {
        onSuccess: () => notify.success(`${tenant.name} desactive`),
      });
    } else {
      activate.mutate(tenant.id, {
        onSuccess: () => notify.success(`${tenant.name} active`),
      });
    }
  };

  const handleChangePlan = () => {
    if (!planDialog || !selectedPlan) return;
    changePlan.mutate(
      { id: planDialog.id, plan: selectedPlan },
      {
        onSuccess: () => {
          notify.success(`Forfait mis a jour pour ${planDialog.name}`);
          setPlanDialog(null);
        },
      }
    );
  };

  if (loading) return <DashboardSkeleton />;

  const stats = [
    {
      label: t("superAdmin.totalSchools"),
      value: dashboard?.totalTenants ?? 0,
      icon: Building2,
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      label: t("superAdmin.activeSchools"),
      value: dashboard?.activeTenants ?? 0,
      icon: Activity,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: t("superAdmin.totalStudents"),
      value: dashboard?.totalStudentsAllTenants ?? 0,
      icon: Users,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: t("superAdmin.monthlyRevenue"),
      value: `${(dashboard?.revenueMonthly ?? 0).toFixed(2)} ${CURRENCY}`,
      icon: DollarSign,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("superAdmin.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("superAdmin.title")}
          </p>
        </div>
        <Button
          asChild
          className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 self-start sm:self-auto"
        >
          <Link to="/super-admin/nouvelle-ecole">
            <Plus className="h-4 w-4" />
            Nouvelle école
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.text}`} />
            </div>
            <p className="mt-2 font-heading text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Plan Distribution */}
      {dashboard?.tenantsByPlan && Object.keys(dashboard.tenantsByPlan).length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <h3 className="font-heading text-sm font-semibold mb-3">{t("superAdmin.planDistribution")}</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboard.tenantsByPlan).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                <Badge className={`text-xs ${planColors[plan] || ""}`}>{plan}</Badge>
                <span className="font-heading text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tenants Table */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="p-5 pb-0">
          <h3 className="font-heading text-sm font-semibold">{t("superAdmin.allSchools")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tenants?.length ?? 0} ecole(s) enregistree(s)
          </p>
        </div>
        <div className="overflow-x-auto p-5 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ecole</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Forfait</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tarif</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Limites</th>
                <th className="py-3 px-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tenants || []).map((tenant) => (
                <tr key={tenant.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.contactEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge className={`text-xs ${planColors[tenant.plan] || "bg-gray-100"}`}>
                      {tenant.plan || "FREE"}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      tenant.active
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-red-50 text-red-700 ring-1 ring-red-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tenant.active ? "bg-emerald-500" : "bg-red-500"}`} />
                      {tenant.active ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {(tenant.monthlyRate ?? 0).toFixed(2)} {CURRENCY}/mois
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground">
                    <div>{tenant.maxStudents ?? 50} eleves</div>
                    <div>{tenant.maxTeachers ?? 10} enseignants</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={tenant.active ? "Desactiver" : "Activer"}
                        onClick={() => handleToggleActive(tenant)}
                      >
                        {tenant.active ? (
                          <PowerOff className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Power className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Changer le forfait"
                        onClick={() => {
                          setPlanDialog(tenant);
                          setSelectedPlan(tenant.plan || "FREE");
                        }}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!tenants || tenants.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="mb-3">Aucune ecole enregistree</p>
                    <Button asChild size="sm" className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600">
                      <Link to="/super-admin/nouvelle-ecole">
                        <Plus className="h-4 w-4" />
                        Créer la première école
                      </Link>
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Change Plan Dialog */}
      <Dialog open={!!planDialog} onOpenChange={(open) => !open && setPlanDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("superAdmin.changePlan")}</DialogTitle>
            <DialogDescription>
              {planDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="text-sm font-medium">{t("superAdmin.newPlan")}</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">{t("superAdmin.plans.free")}</SelectItem>
                <SelectItem value="STANDARD">{t("superAdmin.plans.standard")}</SelectItem>
                <SelectItem value="PREMIUM">{t("superAdmin.plans.premium")}</SelectItem>
                <SelectItem value="ENTERPRISE">{t("superAdmin.plans.enterprise")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleChangePlan} disabled={changePlan.isPending}>
              {changePlan.isPending ? t("common.updating") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
