import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { circuitSchema } from "@/lib/services-schemas";
import {
  Bus,
  MapPin,
  Users,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Route,
  Car,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useVehicules,
  useCreateVehicule,
  useUpdateVehicule,
  useDeleteVehicule,
  useCircuits,
  useCreateCircuit,
  useUpdateCircuit,
  useDeleteCircuit,
  useAffectationsTransport,
  useAffecterTransport,
  useDesaffecterTransport,
  useDeleteAffectation,
  useTransportStats,
} from "@/hooks/useTransport";
import type { Vehicule, Circuit, AffectationTransport, CreateCircuitRequest, CreateAffectationRequest } from "@/types/transport";
import { useAllStudents } from "@/hooks/useStudents";
import { getSelectedAnneeScolaire } from "@/lib/utils";
import StudentCombobox from "@/components/StudentCombobox";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const STATUT_COLORS: Record<string, string> = {
  ACTIF: "bg-emerald-100 text-emerald-700",
  EN_PANNE: "bg-red-100 text-red-700",
  EN_MAINTENANCE: "bg-orange-100 text-orange-700",
};

const ITEMS_PER_PAGE = 15;

export default function TransportPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          Transport Scolaire
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerez les vehicules, circuits et affectations de transport
        </p>
      </motion.div>

      <Tabs defaultValue="circuits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="circuits" className="gap-1.5">
            <Route className="h-4 w-4" /> Circuits
          </TabsTrigger>
          <TabsTrigger value="vehicules" className="gap-1.5">
            <Car className="h-4 w-4" /> Vehicules
          </TabsTrigger>
          <TabsTrigger value="affectations" className="gap-1.5">
            <Users className="h-4 w-4" /> Affectations
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="circuits">
          <CircuitsTab />
        </TabsContent>
        <TabsContent value="vehicules">
          <VehiculesTab />
        </TabsContent>
        <TabsContent value="affectations">
          <AffectationsTab />
        </TabsContent>
        <TabsContent value="statistiques">
          <StatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Circuits Tab ----

function CircuitsTab() {
  const { data: circuits = [], isLoading } = useCircuits();
  const { data: vehicules = [] } = useVehicules();
  const createMutation = useCreateCircuit();
  const updateMutation = useUpdateCircuit();
  const deleteMutation = useDeleteCircuit();

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Circuit | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Form state
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<CreateCircuitRequest>({
    nom: "",
    description: "",
    vehiculeId: undefined,
    heureDepart: "",
    heureRetour: "",
  });

  const filtered = useMemo(() => {
    if (!search) return circuits;
    const q = search.toLowerCase();
    return circuits.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.vehiculeImmatriculation?.toLowerCase().includes(q)
    );
  }, [circuits, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const openCreate = () => {
    setEditingCircuit(null);
    setForm({ nom: "", description: "", vehiculeId: undefined, heureDepart: "", heureRetour: "" });
    setShowDialog(true);
  };

  const openEdit = (circuit: Circuit) => {
    setEditingCircuit(circuit);
    setForm({
      nom: circuit.nom,
      description: circuit.description || "",
      vehiculeId: circuit.vehiculeId || undefined,
      heureDepart: circuit.heureDepart || "",
      heureRetour: circuit.heureRetour || "",
      distanceKm: circuit.distanceKm || undefined,
      coutMensuel: circuit.coutMensuel || undefined,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const result = validate(circuitSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    const onError = (err: Error & { response?: { data?: { message?: string } } }) => setFormErrors({ _root: err.response?.data?.message ?? "Erreur" });
    if (editingCircuit) {
      updateMutation.mutate(
        { id: editingCircuit.id, data: form },
        { onSuccess: () => setShowDialog(false), onError }
      );
    } else {
      createMutation.mutate(form, { onSuccess: () => setShowDialog(false), onError });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher un circuit..." className="ps-9" />
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nouveau circuit
        </Button>
      </div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Nom</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Vehicule</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Horaires</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Distance</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Eleves</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun circuit</p>
                  </td>
                </tr>
              ) : (
                paginated.map((circuit) => (
                  <tr key={circuit.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{circuit.nom}</td>
                    <td className="py-3 px-4 text-muted-foreground">{circuit.vehiculeImmatriculation || "-"}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {circuit.heureDepart && circuit.heureRetour
                        ? `${circuit.heureDepart} - ${circuit.heureRetour}`
                        : "-"}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {circuit.distanceKm ? `${circuit.distanceKm} km` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{circuit.nbEleves ?? 0}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={circuit.actif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                        {circuit.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(circuit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(circuit)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCircuit ? "Modifier le circuit" : "Nouveau circuit"}</DialogTitle>
            <DialogDescription>
              {editingCircuit ? "Modifiez les informations du circuit" : "Ajoutez un nouveau circuit de transport"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {formErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label>Nom du circuit</Label>
              <Input value={form.nom} onChange={(e) => { setForm({ ...form, nom: e.target.value }); setFormErrors({}); }} placeholder="Ex: Circuit Nord" aria-invalid={!!formErrors.nom} />
              {formErrors.nom && <p className="text-xs text-red-600">{formErrors.nom}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicule</Label>
              <Select value={form.vehiculeId ? String(form.vehiculeId) : ""} onValueChange={(v) => setForm({ ...form, vehiculeId: v ? Number(v) : undefined })}>
                <SelectTrigger className={formErrors.vehiculeId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selectionner un vehicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.immatriculation} - {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.vehiculeId && <p className="text-xs text-red-600">{formErrors.vehiculeId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Heure depart</Label>
                <Input type="time" value={form.heureDepart || ""} onChange={(e) => setForm({ ...form, heureDepart: e.target.value })} aria-invalid={!!formErrors.heureDepart} className={formErrors.heureDepart ? "border-red-500" : ""} />
                {formErrors.heureDepart && <p className="text-xs text-red-600">{formErrors.heureDepart}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Heure retour</Label>
                <Input type="time" value={form.heureRetour || ""} onChange={(e) => setForm({ ...form, heureRetour: e.target.value })} aria-invalid={!!formErrors.heureRetour} className={formErrors.heureRetour ? "border-red-500" : ""} />
                {formErrors.heureRetour && <p className="text-xs text-red-600">{formErrors.heureRetour}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Distance (km)</Label>
                <Input type="number" value={form.distanceKm || ""} onChange={(e) => setForm({ ...form, distanceKm: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cout mensuel (TND)</Label>
                <Input type="number" value={form.coutMensuel || ""} onChange={(e) => setForm({ ...form, coutMensuel: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={!form.nom.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "Enregistrement..." : editingCircuit ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Supprimer le circuit <span className="font-semibold text-foreground">{deleteTarget?.nom}</span> ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Vehicules Tab ----

function VehiculesTab() {
  const { data: vehicules = [], isLoading } = useVehicules();
  const createMutation = useCreateVehicule();
  const updateMutation = useUpdateVehicule();
  const deleteMutation = useDeleteVehicule();

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState<Vehicule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicule | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [form, setForm] = useState<Partial<Vehicule>>({
    immatriculation: "",
    marque: "",
    modele: "",
    capacite: 0,
    chauffeurNom: "",
    chauffeurTelephone: "",
    statut: "ACTIF",
  });

  const filtered = useMemo(() => {
    if (!search) return vehicules;
    const q = search.toLowerCase();
    return vehicules.filter(
      (v) =>
        v.immatriculation.toLowerCase().includes(q) ||
        v.marque?.toLowerCase().includes(q) ||
        v.chauffeurNom?.toLowerCase().includes(q)
    );
  }, [vehicules, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const openCreate = () => {
    setEditingVehicule(null);
    setForm({ immatriculation: "", marque: "", modele: "", capacite: 0, chauffeurNom: "", chauffeurTelephone: "", statut: "ACTIF" });
    setShowDialog(true);
  };

  const openEdit = (v: Vehicule) => {
    setEditingVehicule(v);
    setForm({
      immatriculation: v.immatriculation,
      marque: v.marque || "",
      modele: v.modele || "",
      capacite: v.capacite,
      chauffeurNom: v.chauffeurNom || "",
      chauffeurTelephone: v.chauffeurTelephone || "",
      dateAssurance: v.dateAssurance || "",
      dateControleTechnique: v.dateControleTechnique || "",
      statut: v.statut,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingVehicule) {
      updateMutation.mutate({ id: editingVehicule.id, data: form }, { onSuccess: () => setShowDialog(false) });
    } else {
      createMutation.mutate(form, { onSuccess: () => setShowDialog(false) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher un vehicule..." className="ps-9" />
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nouveau vehicule
        </Button>
      </div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Immatriculation</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Marque / Modele</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Capacite</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Chauffeur</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Assurance</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun vehicule</p>
                  </td>
                </tr>
              ) : (
                paginated.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{v.immatriculation}</td>
                    <td className="py-3 px-4 text-muted-foreground">{v.marque} {v.modele}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{v.capacite} places</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {v.chauffeurNom || "-"}
                      {v.chauffeurTelephone && <span className="text-xs block">{v.chauffeurTelephone}</span>}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {v.dateAssurance || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={STATUT_COLORS[v.statut] || ""}>
                        {v.statut === "ACTIF" ? "Actif" : v.statut === "EN_PANNE" ? "En panne" : "Maintenance"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(v)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicule ? "Modifier le vehicule" : "Nouveau vehicule"}</DialogTitle>
            <DialogDescription>
              {editingVehicule ? "Modifiez les informations du vehicule" : "Ajoutez un nouveau vehicule de transport"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Immatriculation</Label>
                <Input value={form.immatriculation || ""} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} placeholder="AB-123-CD" />
              </div>
              <div className="space-y-1.5">
                <Label>Capacite</Label>
                <Input type="number" value={form.capacite || ""} onChange={(e) => setForm({ ...form, capacite: Number(e.target.value) })} placeholder="50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Marque</Label>
                <Input value={form.marque || ""} onChange={(e) => setForm({ ...form, marque: e.target.value })} placeholder="Mercedes" />
              </div>
              <div className="space-y-1.5">
                <Label>Modele</Label>
                <Input value={form.modele || ""} onChange={(e) => setForm({ ...form, modele: e.target.value })} placeholder="Sprinter" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Chauffeur</Label>
                <Input value={form.chauffeurNom || ""} onChange={(e) => setForm({ ...form, chauffeurNom: e.target.value })} placeholder="Nom du chauffeur" />
              </div>
              <div className="space-y-1.5">
                <Label>Telephone</Label>
                <Input value={form.chauffeurTelephone || ""} onChange={(e) => setForm({ ...form, chauffeurTelephone: e.target.value })} placeholder="06 XX XX XX XX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date assurance</Label>
                <Input type="date" value={form.dateAssurance || ""} onChange={(e) => setForm({ ...form, dateAssurance: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Controle technique</Label>
                <Input type="date" value={form.dateControleTechnique || ""} onChange={(e) => setForm({ ...form, dateControleTechnique: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.statut || "ACTIF"} onValueChange={(v) => setForm({ ...form, statut: v as Vehicule["statut"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="EN_PANNE">En panne</SelectItem>
                  <SelectItem value="EN_MAINTENANCE">En maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={!form.immatriculation?.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "Enregistrement..." : editingVehicule ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Supprimer le vehicule <span className="font-semibold text-foreground">{deleteTarget?.immatriculation}</span> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Affectations Tab ----

function AffectationsTab() {
  const { data: affectations = [], isLoading } = useAffectationsTransport();
  const { data: circuits = [] } = useCircuits();
  const { data: students = [] } = useAllStudents();
  const affecterMutation = useAffecterTransport();
  const desaffecterMutation = useDesaffecterTransport();
  const deleteMutation = useDeleteAffectation();

  const studentLabel = (id: string | number) => {
    const s = students.find((st) => String(st.id) === String(id));
    return s ? `${s.prenom} ${s.nom}${s.matricule ? ` · ${s.matricule}` : ""}` : `#${id}`;
  };

  const [search, setSearch] = useState("");
  const [filterCircuit, setFilterCircuit] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AffectationTransport | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [form, setForm] = useState<CreateAffectationRequest>({
    eleveId: 0,
    circuitId: 0,
    anneeScolaire: getSelectedAnneeScolaire(),
  });

  const filtered = useMemo(() => {
    let list = affectations;
    if (filterCircuit !== "all") {
      list = list.filter((a) => a.circuitId === Number(filterCircuit));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.circuitNom?.toLowerCase().includes(q) ||
          a.arretNom?.toLowerCase().includes(q) ||
          String(a.eleveId).includes(q) ||
          studentLabel(a.eleveId).toLowerCase().includes(q)
      );
    }
    return list;
  }, [affectations, search, filterCircuit]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleCreate = () => {
    affecterMutation.mutate(form, { onSuccess: () => setShowDialog(false) });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher..." className="ps-9" />
          </div>
          <Select value={filterCircuit} onValueChange={(v) => { setFilterCircuit(v); setCurrentPage(0); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par circuit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les circuits</SelectItem>
              {circuits.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm({ eleveId: 0, circuitId: 0, anneeScolaire: getSelectedAnneeScolaire() }); setShowDialog(true); }} className="gap-1.5">
          <UserPlus className="h-4 w-4" /> Nouvelle affectation
        </Button>
      </div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Circuit</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Arret</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">Annee scolaire</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune affectation</p>
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{studentLabel(a.eleveId)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.circuitNom || "-"}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{a.arretNom || "-"}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{a.anneeScolaire}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={a.actif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                        {a.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {a.actif && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600"
                            onClick={() => desaffecterMutation.mutate(a.id)}
                            disabled={desaffecterMutation.isPending}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
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

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle affectation</DialogTitle>
            <DialogDescription>Affecter un eleve a un circuit de transport</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Élève</Label>
              <StudentCombobox
                value={form.eleveId ? String(form.eleveId) : ""}
                onChange={(v) => setForm({ ...form, eleveId: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Circuit</Label>
              <Select value={form.circuitId ? String(form.circuitId) : ""} onValueChange={(v) => setForm({ ...form, circuitId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un circuit" />
                </SelectTrigger>
                <SelectContent>
                  {circuits.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Annee scolaire</Label>
              <Input value={form.anneeScolaire} onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })} placeholder={getSelectedAnneeScolaire()} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!form.eleveId || !form.circuitId || affecterMutation.isPending}>
              {affecterMutation.isPending ? "Enregistrement..." : "Affecter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Supprimer cette affectation ? Cette action est irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Stats Tab ----

function StatsTab() {
  const { data: stats, isLoading } = useTransportStats();

  if (isLoading) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Circuits",
      value: stats?.totalCircuits ?? 0,
      icon: Route,
      color: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Total Vehicules",
      value: stats?.totalVehicules ?? 0,
      icon: Car,
      color: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      label: "Eleves Transportes",
      value: stats?.totalEleves ?? 0,
      icon: Users,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Taux de Remplissage",
      value: `${(stats?.tauxRemplissage ?? 0).toFixed(1)}%`,
      icon: BarChart3,
      color: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
            <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
