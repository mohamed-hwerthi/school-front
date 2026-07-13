import { useState } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import { Plus, Edit, Trash2, BookOpen, GraduationCap, Layers } from "lucide-react";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useHasRole } from "@/hooks/useRbac";
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
} from "@/hooks/useModules";
import { useDomaines } from "@/hooks/useDomaines";
import {
  type ModuleDTO,
  type ModuleRequest,
  SALLE_TYPES,
  PREFERENCES_HORAIRES,
} from "@/api/modules.api";
import type { SousDomaineDTO } from "@/api/domaines.api";

const SALLE_TYPE_LABELS: Record<(typeof SALLE_TYPES)[number], string> = {
  NORMAL: "Salle normale",
  LABO_SVT: "Labo SVT",
  LABO_PHYSIQUE: "Labo physique",
  INFO: "Salle informatique",
  GYMNASE: "Gymnase",
  ARTS: "Salle d'arts",
  MUSIQUE: "Salle de musique",
};

const PREF_HORAIRE_LABELS: Record<(typeof PREFERENCES_HORAIRES)[number], string> = {
  MATIN: "Matin de préférence",
  APRES_MIDI: "Après-midi de préférence",
  INDIFFERENT: "Indifférent",
};

const emptyForm: ModuleRequest = {
  name: "",
  nameVp: "",
  coeffEtatique: 1,
  coeffPrive: 1,
  ordreEtatique: 1,
  ordrePrive: 1,
  niveauId: 0,
  domaineId: undefined,
  sousDomaineId: undefined,
  versionEtatique: true,
  versionPrivee: true,
  salleTypeRequise: "NORMAL",
  dureeMinSeance: 1,
  dureeMaxSeance: 2,
  preferenceHoraire: "INDIFFERENT",
};

export default function ModulesTab() {
  const { niveaux } = useNiveaux();
  // Matières are managed by the school admin/direction only; an ENSEIGNANT
  // gets a read-only, scoped view of his own matières.
  const canManage = useHasRole(["ADMIN", "SUPER_ADMIN", "DIRECTEUR"]);
  const {
    niveauId: selectedNiveauId,
    setNiveauId: setSelectedNiveauId,
    domaineId: filterDomaineId,
    setDomaineId: setFilterDomaineId,
  } = useCarnetSelection();
  const { data: modules = [], isLoading } = useModules(
    selectedNiveauId || undefined
  );
  const { data: domaines = [] } = useDomaines(selectedNiveauId || undefined);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();

  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ModuleRequest>({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<ModuleDTO | null>(null);

  // Flatten sous-domaines for the selected domaine in form
  const formDomaine = domaines.find((d) => d.id === form.domaineId);
  const formSousDomaines: SousDomaineDTO[] = formDomaine?.sousDomaines ?? [];

  // Matières belong to a domaine — allow filtering the list by domaine
  const filteredModules = filterDomaineId
    ? modules.filter((m) => m.domaineId === filterDomaineId)
    : modules;

  const openAdd = () => {
    if (!selectedNiveauId) {
      notify.error("Veuillez sélectionner un niveau d'abord");
      return;
    }
    setEditId(null);
    setForm({ ...emptyForm, niveauId: selectedNiveauId });
    setShowDialog(true);
  };

  const openEdit = (m: ModuleDTO) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      nameVp: m.nameVp || "",
      coeffEtatique: m.coeffEtatique,
      coeffPrive: m.coeffPrive,
      ordreEtatique: m.ordreEtatique,
      ordrePrive: m.ordrePrive,
      niveauId: m.niveauId,
      domaineId: m.domaineId ?? undefined,
      sousDomaineId: m.sousDomaineId ?? undefined,
      versionEtatique: m.versionEtatique,
      versionPrivee: m.versionPrivee,
      salleTypeRequise: m.salleTypeRequise,
      dureeMinSeance: m.dureeMinSeance,
      dureeMaxSeance: m.dureeMaxSeance,
      preferenceHoraire: m.preferenceHoraire,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      notify.error("Le nom de la matière est obligatoire");
      return;
    }
    if (!form.domaineId) {
      notify.error("Le domaine est obligatoire");
      return;
    }
    if (editId) {
      updateModule.mutate(
        { id: editId, data: form },
        {
          onSuccess: () => {
            notify.success("Matière modifiée");
            setShowDialog(false);
          },
          onError: () => notify.error("Erreur lors de la modification"),
        }
      );
    } else {
      createModule.mutate(form, {
        onSuccess: () => {
          notify.success("Matière créée");
          setShowDialog(false);
        },
        onError: () => notify.error("Erreur lors de la création"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteModule.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Matière supprimée");
        setDeleteTarget(null);
      },
      onError: () => notify.error("Erreur lors de la suppression"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter + Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select
            value={selectedNiveauId ? String(selectedNiveauId) : ""}
            onValueChange={(v) => setSelectedNiveauId(v)}
          >
            <SelectTrigger className="w-[220px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sélectionner un niveau" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDomaineId ? filterDomaineId : "all"}
            onValueChange={(v) =>
              setFilterDomaineId(v === "all" ? "" : v)
            }
            disabled={!selectedNiveauId || domaines.length === 0}
          >
            <SelectTrigger className="w-[220px]">
              <Layers className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Tous les domaines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les domaines</SelectItem>
              {domaines.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <div className="sm:ms-auto">
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-primary shadow-btn"
                onClick={openAdd}
              >
                <Plus className="h-4 w-4" />
                Ajouter une matière
              </Button>
            </div>
          )}
        </div>
        {selectedNiveauId && (
          <div className="mt-2 text-xs text-muted-foreground">
            {filteredModules.length} module
            {filteredModules.length !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      {/* Table */}
      {selectedNiveauId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                    Nom de la matière
                  </th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                    Domaine
                  </th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                    Nom VP
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                    Coeff. É
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                    Coeff. P
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                    Ordre É
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                    Ordre P
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                    VÉ
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">
                    VP
                  </th>
                  {canManage && (
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : 9}
                      className="py-16 text-center text-muted-foreground"
                    >
                      Chargement...
                    </td>
                  </tr>
                ) : filteredModules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : 9}
                      className="py-16 text-center text-muted-foreground"
                    >
                      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">
                        {filterDomaineId
                          ? "Aucune matière pour ce domaine"
                          : "Aucune matière pour ce niveau"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                        <div className="text-xs">
                          {m.domaineName || "—"}
                          {m.sousDomaineName && (
                            <span className="block text-muted-foreground/70">
                              {m.sousDomaineName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {m.nameVp || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.coeffEtatique}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.coeffPrive}
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        {m.ordreEtatique}
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        {m.ordrePrive}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.versionEtatique ? "✓" : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.versionPrivee ? "✓" : "—"}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                              onClick={() => openEdit(m)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier la matière" : "Nouvelle matière"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom de la matière *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Mathématiques"
                />
              </div>
              <div>
                <Label>Nom matière VP</Label>
                <Input
                  value={form.nameVp || ""}
                  onChange={(e) => setForm({ ...form, nameVp: e.target.value })}
                  placeholder="Version privée"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Domaine *</Label>
                <Select
                  value={form.domaineId ? String(form.domaineId) : ""}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      domaineId: v,
                      sousDomaineId: undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {domaines.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {domaines.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Aucun domaine — créez-en un dans l'onglet « Domaines ».
                  </p>
                )}
              </div>
              <div>
                <Label>Sous-domaine</Label>
                <Select
                  value={
                    form.sousDomaineId ? String(form.sousDomaineId) : "none"
                  }
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      sousDomaineId: v === "none" ? undefined : v,
                    })
                  }
                  disabled={!form.domaineId || formSousDomaines.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Aucun —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucun —</SelectItem>
                    {formSousDomaines.map((sd) => (
                      <SelectItem key={sd.id} value={String(sd.id)}>
                        {sd.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coefficient étatique</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.coeffEtatique}
                  onChange={(e) =>
                    setForm({ ...form, coeffEtatique: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Coefficient privé</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.coeffPrive}
                  onChange={(e) =>
                    setForm({ ...form, coeffPrive: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordre étatique</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.ordreEtatique}
                  onChange={(e) =>
                    setForm({ ...form, ordreEtatique: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Ordre privé</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.ordrePrive}
                  onChange={(e) =>
                    setForm({ ...form, ordrePrive: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ve"
                  checked={form.versionEtatique}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, versionEtatique: !!checked })
                  }
                />
                <Label htmlFor="ve" className="cursor-pointer">
                  Version étatique
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="vp"
                  checked={form.versionPrivee}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, versionPrivee: !!checked })
                  }
                />
                <Label htmlFor="vp" className="cursor-pointer">
                  Version privée
                </Label>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Planification (emploi du temps)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type de salle requis</Label>
                  <Select
                    value={form.salleTypeRequise ?? "NORMAL"}
                    onValueChange={(v) =>
                      setForm({ ...form, salleTypeRequise: v as ModuleRequest["salleTypeRequise"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALLE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {SALLE_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Préférence horaire</Label>
                  <Select
                    value={form.preferenceHoraire ?? "INDIFFERENT"}
                    onValueChange={(v) =>
                      setForm({ ...form, preferenceHoraire: v as ModuleRequest["preferenceHoraire"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFERENCES_HORAIRES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PREF_HORAIRE_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Durée min séance (heures)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={form.dureeMinSeance ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, dureeMinSeance: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Durée max séance (heures)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={form.dureeMaxSeance ?? 2}
                    onChange={(e) =>
                      setForm({ ...form, dureeMaxSeance: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Mettre <strong>Min = Max = 2</strong> pour forcer des séances doubles (TP, EPS).
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={createModule.isPending || updateModule.isPending}
            >
              {editId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer la matière{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.name}
            </span>{" "}
            ? Les examens et notes associés seront aussi supprimés.
          </p>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteModule.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
