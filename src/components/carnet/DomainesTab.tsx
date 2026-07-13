import { useState } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  GraduationCap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
  useDomaines,
  useCreateDomaine,
  useUpdateDomaine,
  useDeleteDomaine,
  useCreateSousDomaine,
  useUpdateSousDomaine,
  useDeleteSousDomaine,
} from "@/hooks/useDomaines";
import type {
  DomaineDTO,
  DomaineRequest,
  SousDomaineDTO,
  SousDomaineRequest,
} from "@/api/domaines.api";

export default function DomainesTab() {
  const { niveaux } = useNiveaux();
  // Domaines are managed by the school admin/direction only; an ENSEIGNANT
  // gets a read-only, scoped view of his own domaines.
  const canManage = useHasRole(["ADMIN", "SUPER_ADMIN", "DIRECTEUR"]);
  const { niveauId: selectedNiveauId, setNiveauId: setSelectedNiveauId } = useCarnetSelection();
  const { data: domaines = [], isLoading } = useDomaines(
    selectedNiveauId || undefined
  );

  const createDomaine = useCreateDomaine();
  const updateDomaine = useUpdateDomaine();
  const deleteDomaine = useDeleteDomaine();
  const createSD = useCreateSousDomaine();
  const updateSD = useUpdateSousDomaine();
  const deleteSD = useDeleteSousDomaine();

  // Domaine dialog
  const [showDomDialog, setShowDomDialog] = useState(false);
  const [editDomId, setEditDomId] = useState<number | null>(null);
  const [domForm, setDomForm] = useState<DomaineRequest>({
    name: "",
    nameAr: "",
    ordre: 1,
    coeffEtatique: 1,
    coeffPrive: 1,
    versionEtatique: true,
    versionPrivee: true,
    niveauId: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<DomaineDTO | null>(null);

  // SousDomaine dialog
  const [showSDDialog, setShowSDDialog] = useState(false);
  const [editSDId, setEditSDId] = useState<number | null>(null);
  const [sdForm, setSDForm] = useState<SousDomaineRequest>({
    name: "",
    nameAr: "",
    ordre: 1,
    domaineId: 0,
  });
  const [deleteSDTarget, setDeleteSDTarget] = useState<SousDomaineDTO | null>(
    null
  );

  // Expanded domaines
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Domaine CRUD
  const openAddDomaine = () => {
    if (!selectedNiveauId) {
      notify.error("Veuillez sélectionner un niveau d'abord");
      return;
    }
    setEditDomId(null);
    setDomForm({
      name: "",
      nameAr: "",
      ordre: domaines.length + 1,
      coeffEtatique: 1,
      coeffPrive: 1,
      versionEtatique: true,
      versionPrivee: true,
      niveauId: selectedNiveauId,
    });
    setShowDomDialog(true);
  };

  const openEditDomaine = (d: DomaineDTO) => {
    setEditDomId(d.id);
    setDomForm({
      name: d.name,
      nameAr: d.nameAr || "",
      ordre: d.ordre,
      coeffEtatique: d.coeffEtatique,
      coeffPrive: d.coeffPrive,
      versionEtatique: d.versionEtatique,
      versionPrivee: d.versionPrivee,
      niveauId: d.niveauId,
    });
    setShowDomDialog(true);
  };

  const handleSaveDomaine = () => {
    if (!domForm.name.trim()) {
      notify.error("Le nom du domaine est obligatoire");
      return;
    }
    if (editDomId) {
      updateDomaine.mutate(
        { id: editDomId, data: domForm },
        {
          onSuccess: () => {
            notify.success("Domaine modifié");
            setShowDomDialog(false);
          },
          onError: () => notify.error("Erreur lors de la modification"),
        }
      );
    } else {
      createDomaine.mutate(domForm, {
        onSuccess: () => {
          notify.success("Domaine créé");
          setShowDomDialog(false);
        },
        onError: () => notify.error("Erreur lors de la création"),
      });
    }
  };

  const handleDeleteDomaine = () => {
    if (!deleteTarget) return;
    deleteDomaine.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Domaine supprimé");
        setDeleteTarget(null);
      },
      onError: () => notify.error("Erreur lors de la suppression"),
    });
  };

  // SousDomaine CRUD
  const openAddSD = (domaineId: string, sdCount: number) => {
    setEditSDId(null);
    setSDForm({ name: "", nameAr: "", ordre: sdCount + 1, domaineId });
    setShowSDDialog(true);
  };

  const openEditSD = (sd: SousDomaineDTO) => {
    setEditSDId(sd.id);
    setSDForm({
      name: sd.name,
      nameAr: sd.nameAr || "",
      ordre: sd.ordre,
      domaineId: sd.domaineId,
    });
    setShowSDDialog(true);
  };

  const handleSaveSD = () => {
    if (!sdForm.name.trim()) {
      notify.error("Le nom du sous-domaine est obligatoire");
      return;
    }
    if (editSDId) {
      updateSD.mutate(
        { id: editSDId, data: sdForm },
        {
          onSuccess: () => {
            notify.success("Sous-domaine modifié");
            setShowSDDialog(false);
          },
          onError: () => notify.error("Erreur"),
        }
      );
    } else {
      createSD.mutate(sdForm, {
        onSuccess: () => {
          notify.success("Sous-domaine créé");
          setShowSDDialog(false);
        },
        onError: () => notify.error("Erreur"),
      });
    }
  };

  const handleDeleteSD = () => {
    if (!deleteSDTarget) return;
    deleteSD.mutate(deleteSDTarget.id, {
      onSuccess: () => {
        notify.success("Sous-domaine supprimé");
        setDeleteSDTarget(null);
      },
      onError: () => notify.error("Erreur"),
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
          {canManage && (
            <div className="sm:ms-auto">
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-primary shadow-btn"
                onClick={openAddDomaine}
              >
                <Plus className="h-4 w-4" />
                Ajouter un domaine
              </Button>
            </div>
          )}
        </div>
        {selectedNiveauId && (
          <div className="mt-2 text-xs text-muted-foreground">
            {domaines.length} domaine{domaines.length !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      {/* Domaines List */}
      {selectedNiveauId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-3"
        >
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-card p-16 text-center text-muted-foreground">
              Chargement...
            </div>
          ) : domaines.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card p-16 text-center text-muted-foreground">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun domaine pour ce niveau</p>
              <p className="text-xs mt-1">
                Créez des domaines pour grouper vos modules (ex: Langue Arabe,
                Sciences...)
              </p>
            </div>
          ) : (
            domaines.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
              >
                {/* Domaine Header */}
                <div className="flex items-center gap-3 p-4 bg-muted/20">
                  <button
                    onClick={() => toggleExpand(d.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded.has(d.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Layers className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {d.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.nameAr && <span className="font-arabic">{d.nameAr} · </span>}
                      Ordre: {d.ordre} · {d.sousDomaines.length} sous-domaine
                      {d.sousDomaines.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {d.versionEtatique && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          Étatique · coeff {d.coeffEtatique}
                        </span>
                      )}
                      {d.versionPrivee && (
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                          Privé · coeff {d.coeffPrive}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                        onClick={() => openEditDomaine(d)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sous-domaines */}
                {expanded.has(d.id) && (
                  <div className="border-t border-border/50">
                    {d.sousDomaines.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Aucun sous-domaine
                      </div>
                    ) : (
                      d.sousDomaines.map((sd) => (
                        <div
                          key={sd.id}
                          className="flex items-center gap-3 px-4 py-3 ps-16 border-b border-border/30 last:border-0 hover:bg-muted/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              {sd.name}
                            </p>
                            {sd.nameAr && (
                              <p className="text-xs text-muted-foreground">
                                {sd.nameAr}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Ordre: {sd.ordre}
                          </span>
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                                onClick={() => openEditSD(sd)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                onClick={() => setDeleteSDTarget(sd)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {canManage && (
                      <div className="px-4 py-2 border-t border-border/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            openAddSD(d.id, d.sousDomaines.length)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter un sous-domaine
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Domaine Dialog */}
      <Dialog open={showDomDialog} onOpenChange={setShowDomDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editDomId ? "Modifier le domaine" : "Nouveau domaine"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nom du domaine *</Label>
              <Input
                value={domForm.name}
                onChange={(e) =>
                  setDomForm({ ...domForm, name: e.target.value })
                }
                placeholder="Ex: Langue Arabe"
              />
            </div>
            <div>
              <Label>Nom en arabe</Label>
              <Input
                value={domForm.nameAr || ""}
                onChange={(e) =>
                  setDomForm({ ...domForm, nameAr: e.target.value })
                }
                placeholder="مجال اللغة العربية"
                dir="rtl"
              />
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                min={1}
                value={domForm.ordre}
                onChange={(e) =>
                  setDomForm({ ...domForm, ordre: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coefficient étatique</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={domForm.coeffEtatique}
                  onChange={(e) =>
                    setDomForm({
                      ...domForm,
                      coeffEtatique: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Coefficient privé</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={domForm.coeffPrive}
                  onChange={(e) =>
                    setDomForm({
                      ...domForm,
                      coeffPrive: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Affichage</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dom-ve"
                    checked={domForm.versionEtatique}
                    onCheckedChange={(checked) =>
                      setDomForm({ ...domForm, versionEtatique: !!checked })
                    }
                  />
                  <Label htmlFor="dom-ve" className="cursor-pointer">
                    Version étatique
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dom-vp"
                    checked={domForm.versionPrivee}
                    onCheckedChange={(checked) =>
                      setDomForm({ ...domForm, versionPrivee: !!checked })
                    }
                  />
                  <Label htmlFor="dom-vp" className="cursor-pointer">
                    Version privée
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleSaveDomaine}
              disabled={createDomaine.isPending || updateDomaine.isPending}
            >
              {editDomId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SousDomaine Dialog */}
      <Dialog open={showSDDialog} onOpenChange={setShowSDDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editSDId
                ? "Modifier le sous-domaine"
                : "Nouveau sous-domaine"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nom du sous-domaine *</Label>
              <Input
                value={sdForm.name}
                onChange={(e) =>
                  setSDForm({ ...sdForm, name: e.target.value })
                }
                placeholder="Ex: Éducation sociale"
              />
            </div>
            <div>
              <Label>Nom en arabe</Label>
              <Input
                value={sdForm.nameAr || ""}
                onChange={(e) =>
                  setSDForm({ ...sdForm, nameAr: e.target.value })
                }
                placeholder="التنشئة الاجتماعية"
                dir="rtl"
              />
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                min={1}
                value={sdForm.ordre}
                onChange={(e) =>
                  setSDForm({ ...sdForm, ordre: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleSaveSD}
              disabled={createSD.isPending || updateSD.isPending}
            >
              {editSDId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Domaine Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer le domaine{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.name}
            </span>{" "}
            ? Les sous-domaines seront aussi supprimés.
          </p>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteDomaine}
              disabled={deleteDomaine.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SousDomaine Dialog */}
      <Dialog
        open={!!deleteSDTarget}
        onOpenChange={(open) => !open && setDeleteSDTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer le sous-domaine{" "}
            <span className="font-semibold text-foreground">
              {deleteSDTarget?.name}
            </span>{" "}
            ?
          </p>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteSD}
              disabled={deleteSD.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
