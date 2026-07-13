import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { livreSchema } from "@/lib/services-schemas";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  RotateCcw,
  AlertTriangle,
  BarChart3,
  Library,
  BookCopy,
  Clock,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  useLivres,
  useLivreCategories,
  useCreateLivre,
  useUpdateLivre,
  useDeleteLivre,
  useEmprunts,
  useCreateEmprunt,
  useRetourEmprunt,
  useEmpruntsEnRetard,
  useBibliothequeStats,
} from "@/hooks/useBibliotheque";
import type { Livre, CreateLivreRequest, Emprunt, CreateEmpruntRequest } from "@/types/bibliotheque";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const STATUT_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  EN_COURS: { label: "En cours", variant: "default", color: "text-blue-600 bg-blue-50 border-blue-200" },
  RETOURNE: { label: "Retourne", variant: "secondary", color: "text-green-600 bg-green-50 border-green-200" },
  EN_RETARD: { label: "En retard", variant: "destructive", color: "text-red-600 bg-red-50 border-red-200" },
  PERDU: { label: "Perdu", variant: "outline", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

// ═══════════════════════════════════════════════════════════
// Catalogue Tab
// ═══════════════════════════════════════════════════════════
function CatalogueTab() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");

  const { data: livresData, isLoading } = useLivres({
    page,
    size: 20,
    search: search || undefined,
    categorie: filterCategorie !== "all" ? filterCategorie : undefined,
  });
  const { data: categories = [] } = useLivreCategories();
  const createLivre = useCreateLivre();
  const updateLivre = useUpdateLivre();
  const deleteLivre = useDeleteLivre();

  const livres = livresData?.content ?? [];
  const totalPages = livresData?.totalPages ?? 0;

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editLivre, setEditLivre] = useState<Livre | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Livre | null>(null);

  const emptyForm: CreateLivreRequest = {
    titre: "",
    auteur: "",
    isbn: "",
    categorie: "",
    editeur: "",
    anneePublication: null,
    description: "",
    nombreExemplaires: 1,
    emplacement: "",
    imageUrl: "",
  };
  const [form, setForm] = useState<CreateLivreRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const openAdd = () => {
    setForm(emptyForm);
    setAddDialogOpen(true);
  };

  const openEdit = (l: Livre) => {
    setForm({
      titre: l.titre,
      auteur: l.auteur,
      isbn: l.isbn,
      categorie: l.categorie,
      editeur: l.editeur,
      anneePublication: l.anneePublication,
      description: l.description,
      nombreExemplaires: l.nombreExemplaires,
      emplacement: l.emplacement,
      imageUrl: l.imageUrl,
    });
    setEditLivre(l);
  };

  const handleCreate = () => {
    const result = validate(livreSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    createLivre.mutate(form, {
      onSuccess: () => {
        notify.success("Livre ajoute au catalogue");
        setAddDialogOpen(false);
      },
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setFormErrors({ _root: err.response?.data?.message ?? err.message });
      },
    });
  };

  const handleUpdate = () => {
    if (!editLivre) return;
    updateLivre.mutate(
      { id: editLivre.id, data: form },
      {
        onSuccess: () => {
          notify.success("Livre modifie");
          setEditLivre(null);
        },
        onError: (err) => notify.error(err.message),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteLivre.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify.success("Livre supprime");
        setDeleteTarget(null);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const resetFilters = () => {
    setSearch("");
    setFilterCategorie("all");
    setPage(0);
  };

  const livreFormFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Titre *</Label>
          <Input
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            placeholder="Titre du livre"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Auteur</Label>
          <Input
            value={form.auteur ?? ""}
            onChange={(e) => setForm({ ...form, auteur: e.target.value })}
            placeholder="Nom de l'auteur"
          />
        </div>
        <div className="space-y-1.5">
          <Label>ISBN</Label>
          <Input
            value={form.isbn ?? ""}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            placeholder="978-..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Categorie</Label>
          <Input
            value={form.categorie ?? ""}
            onChange={(e) => setForm({ ...form, categorie: e.target.value })}
            placeholder="Ex: Roman, Sciences, Histoire"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Editeur</Label>
          <Input
            value={form.editeur ?? ""}
            onChange={(e) => setForm({ ...form, editeur: e.target.value })}
            placeholder="Maison d'edition"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Annee de publication</Label>
          <Input
            type="number"
            value={form.anneePublication ?? ""}
            onChange={(e) =>
              setForm({ ...form, anneePublication: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="2024"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nombre d'exemplaires</Label>
          <Input
            type="number"
            value={form.nombreExemplaires ?? 1}
            onChange={(e) =>
              setForm({ ...form, nombreExemplaires: e.target.value ? Number(e.target.value) : 1 })
            }
            min={1}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Emplacement</Label>
          <Input
            value={form.emplacement ?? ""}
            onChange={(e) => setForm({ ...form, emplacement: e.target.value })}
            placeholder="Etagere A3, Salle 2"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Resume ou description du livre..."
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou auteur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="ps-9"
          />
        </div>
        <Select value={filterCategorie} onValueChange={(v) => { setFilterCategorie(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterCategorie !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
            <X className="h-3.5 w-3.5" /> Reinitialiser
          </Button>
        )}
        <Button className="bg-gradient-primary shadow-btn gap-2 ms-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Ajouter un livre
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Titre</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Auteur</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Categorie</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">ISBN</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Exemplaires</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Disponibles</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Emplacement</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {livres.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Aucun livre trouve
                  </td>
                </tr>
              ) : (
                livres.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{l.titre}</td>
                    <td className="py-3 px-4 text-muted-foreground">{l.auteur || "--"}</td>
                    <td className="py-3 px-4">
                      {l.categorie ? (
                        <Badge variant="secondary" className="text-xs">{l.categorie}</Badge>
                      ) : "--"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{l.isbn || "--"}</td>
                    <td className="py-3 px-4 text-center">{l.nombreExemplaires}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={l.exemplairesDisponibles > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {l.exemplairesDisponibles}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{l.emplacement || "--"}</td>
                    <td className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(l)}>
                            <Edit className="h-3.5 w-3.5 me-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(l)} className="text-destructive">
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
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un livre</DialogTitle>
            <DialogDescription>Ajouter un nouveau livre au catalogue de la bibliotheque</DialogDescription>
          </DialogHeader>
          {livreFormFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button className="bg-gradient-primary shadow-btn" onClick={handleCreate} disabled={createLivre.isPending}>
              {createLivre.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLivre} onOpenChange={() => setEditLivre(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le livre</DialogTitle>
          </DialogHeader>
          {livreFormFields}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button className="bg-gradient-primary shadow-btn" onClick={handleUpdate} disabled={updateLivre.isPending}>
              {updateLivre.isPending ? "Enregistrement..." : "Enregistrer"}
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
              Voulez-vous vraiment supprimer le livre "{deleteTarget?.titre}" ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLivre.isPending}>
              {deleteLivre.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Emprunts Tab
// ═══════════════════════════════════════════════════════════
function EmpruntsTab() {
  const { data: emprunts = [], isLoading } = useEmprunts();
  const createEmprunt = useCreateEmprunt();
  const retourEmprunt = useRetourEmprunt();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterStatut, setFilterStatut] = useState("all");
  const [search, setSearch] = useState("");

  const emptyForm: CreateEmpruntRequest = {
    livreId: 0,
    eleveId: 0,
    dateRetourPrevue: "",
    notes: "",
  };
  const [form, setForm] = useState<CreateEmpruntRequest>(emptyForm);

  const filtered = useMemo(() => {
    return emprunts.filter((e) => {
      const matchStatut = filterStatut === "all" || e.statut === filterStatut;
      const matchSearch =
        !search ||
        e.livreTitle.toLowerCase().includes(search.toLowerCase()) ||
        e.eleveName.toLowerCase().includes(search.toLowerCase());
      return matchStatut && matchSearch;
    });
  }, [emprunts, filterStatut, search]);

  const handleCreate = () => {
    if (!form.livreId || !form.eleveId || !form.dateRetourPrevue) {
      notify.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createEmprunt.mutate(form, {
      onSuccess: () => {
        notify.success("Emprunt enregistre");
        setAddDialogOpen(false);
        setForm(emptyForm);
      },
      onError: (err) => notify.error(err.message),
    });
  };

  const handleRetour = (id: string) => {
    retourEmprunt.mutate(id, {
      onSuccess: () => notify.success("Livre retourne avec succes"),
      onError: (err) => notify.error(err.message),
    });
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par livre ou eleve..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="EN_COURS">En cours</SelectItem>
            <SelectItem value="RETOURNE">Retourne</SelectItem>
            <SelectItem value="EN_RETARD">En retard</SelectItem>
            <SelectItem value="PERDU">Perdu</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterStatut !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatut("all"); }} className="gap-1">
            <X className="h-3.5 w-3.5" /> Reinitialiser
          </Button>
        )}
        <Button className="bg-gradient-primary shadow-btn gap-2 ms-auto" onClick={() => { setForm(emptyForm); setAddDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouvel emprunt
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Livre</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Eleve</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Date emprunt</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Retour prevu</th>
                <th className="py-3 px-4 text-start font-semibold text-muted-foreground">Retour effectif</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun emprunt trouve
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{e.livreTitle}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.eleveName || `Eleve #${e.eleveId}`}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(e.dateEmprunt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(e.dateRetourPrevue).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {e.dateRetourEffective
                        ? new Date(e.dateRetourEffective).toLocaleDateString("fr-FR")
                        : "--"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUT_CONFIG[e.statut]?.color ?? ""}`}>
                        {STATUT_CONFIG[e.statut]?.label ?? e.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(e.statut === "EN_COURS" || e.statut === "EN_RETARD") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleRetour(e.id)}
                          disabled={retourEmprunt.isPending}
                        >
                          <RotateCcw className="h-3 w-3" /> Retour
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <span className="text-xs text-muted-foreground">
        {filtered.length} emprunt{filtered.length > 1 ? "s" : ""}
      </span>

      {/* Add Emprunt Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel emprunt</DialogTitle>
            <DialogDescription>Enregistrer un nouvel emprunt de livre</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>ID Livre *</Label>
              <Input
                type="number"
                value={form.livreId || ""}
                onChange={(e) => setForm({ ...form, livreId: e.target.value })}
                placeholder="ID du livre"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ID Eleve *</Label>
              <Input
                type="number"
                value={form.eleveId || ""}
                onChange={(e) => setForm({ ...form, eleveId: e.target.value })}
                placeholder="ID de l'eleve"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date de retour prevue *</Label>
              <Input
                type="date"
                value={form.dateRetourPrevue}
                onChange={(e) => setForm({ ...form, dateRetourPrevue: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Notes optionnelles..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button className="bg-gradient-primary shadow-btn" onClick={handleCreate} disabled={createEmprunt.isPending}>
              {createEmprunt.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Retards Tab
// ═══════════════════════════════════════════════════════════
function RetardsTab() {
  const { data: retards = [], isLoading } = useEmpruntsEnRetard();
  const retourEmprunt = useRetourEmprunt();

  const handleRetour = (id: string) => {
    retourEmprunt.mutate(id, {
      onSuccess: () => notify.success("Livre retourne avec succes"),
      onError: (err) => notify.error(err.message),
    });
  };

  const getDaysLate = (dateRetourPrevue: string): number => {
    const today = new Date();
    const due = new Date(dateRetourPrevue);
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-semibold text-foreground">
          Emprunts en retard ({retards.length})
        </h2>
      </div>

      {retards.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Aucun emprunt en retard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {retards.map((e) => {
            const daysLate = getDaysLate(e.dateRetourPrevue);
            return (
              <motion.div
                key={e.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="rounded-xl border border-red-200 bg-red-50/30 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{e.livreTitle}</span>
                    <Badge variant="destructive" className="text-xs">
                      {daysLate} jour{daysLate > 1 ? "s" : ""} de retard
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Emprunteur : {e.eleveName || `Eleve #${e.eleveId}`}
                    {" | "}
                    Emprunt : {new Date(e.dateEmprunt).toLocaleDateString("fr-FR")}
                    {" | "}
                    Retour prevu : {new Date(e.dateRetourPrevue).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0"
                  onClick={() => handleRetour(e.id)}
                  disabled={retourEmprunt.isPending}
                >
                  <RotateCcw className="h-3 w-3" /> Retourner
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Statistiques Tab
// ═══════════════════════════════════════════════════════════
function StatistiquesTab() {
  const { data: stats, isLoading } = useBibliothequeStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Library className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total livres</p>
              <p className="text-xl font-bold text-blue-700">{stats.totalLivres}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <BookCopy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Total emprunts</p>
              <p className="text-xl font-bold text-green-700">{stats.totalEmprunts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">En cours</p>
              <p className="text-xl font-bold text-foreground">{stats.empruntsEnCours}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">En retard</p>
              <p className="text-xl font-bold text-red-700">{stats.empruntsEnRetard}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top borrowed books */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Livres les plus empruntes</h3>
        </div>
        {stats.livresLesPlusEmpruntes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune donnee disponible
          </p>
        ) : (
          <div className="space-y-3">
            {stats.livresLesPlusEmpruntes.map((item, index) => {
              const maxCount = stats.livresLesPlusEmpruntes[0]?.count ?? 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.livreId} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground w-6 text-end">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.titre}
                      </span>
                      <span className="text-sm font-semibold text-primary ms-2">
                        {item.count} emprunt{item.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Bibliotheque Page
// ═══════════════════════════════════════════════════════════
export default function Bibliotheque() {
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bibliotheque</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion du catalogue, des emprunts et des retards
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalogue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalogue" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Catalogue
          </TabsTrigger>
          <TabsTrigger value="emprunts" className="gap-1.5">
            <BookCopy className="h-4 w-4" /> Emprunts
          </TabsTrigger>
          <TabsTrigger value="retards" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Retards
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogue">
          <CatalogueTab />
        </TabsContent>

        <TabsContent value="emprunts">
          <EmpruntsTab />
        </TabsContent>

        <TabsContent value="retards">
          <RetardsTab />
        </TabsContent>

        <TabsContent value="statistiques">
          <StatistiquesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
