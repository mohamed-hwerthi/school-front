import { useState } from "react";
import { motion } from "framer-motion";
import {
  Vault,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Lock,
  Unlock,
  Trash2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  History,
  Eye,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCY } from "@/config/currency";
import {
  useCaisses,
  useCaisseOuverte,
  useMouvements,
  useOuvrirCaisse,
  useFermerCaisse,
  useAddMouvement,
  useDeleteMouvement,
} from "@/hooks/useCaisse";
import type {
  CaisseDTO,
  CaisseRequest,
  MouvementDTO,
  MouvementRequest,
  TypeMouvement,
  CategorieMouvement,
} from "@/api/caisse.api";

const CATEGORIE_LABELS: Record<CategorieMouvement, string> = {
  PAIEMENT_SCOLARITE: "Paiement scolarite",
  INSCRIPTION: "Inscription",
  CANTINE: "Cantine",
  TRANSPORT: "Transport",
  FOURNITURES: "Fournitures",
  SALAIRE: "Salaire",
  FACTURE: "Facture",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GestionCaisse() {
  const [tab, setTab] = useState("session");
  const [showOuvrir, setShowOuvrir] = useState(false);
  const [showFermer, setShowFermer] = useState(false);
  const [showMouvement, setShowMouvement] = useState(false);
  const [showDeleteMvt, setShowDeleteMvt] = useState<MouvementDTO | null>(null);
  const [selectedCaisse, setSelectedCaisse] = useState<CaisseDTO | null>(null);

  // Open caisse form
  const [ouvrirForm, setOuvrirForm] = useState<CaisseRequest>({
    soldeOuverture: 0,
    notes: "",
    ouvertPar: "",
  });

  // Mouvement form
  const [mvtForm, setMvtForm] = useState<Omit<MouvementRequest, "caisseId">>({
    type: "ENTREE",
    categorie: "PAIEMENT_SCOLARITE",
    montant: 0,
    libelle: "",
    notes: "",
  });

  const { data: caisses = [], isLoading: loadingCaisses } = useCaisses();
  const { data: caisseOuverte } = useCaisseOuverte();
  const activeCaisseId = selectedCaisse?.id ?? caisseOuverte?.id ?? 0;
  const { data: mouvements = [], isLoading: loadingMvts } = useMouvements(activeCaisseId);

  const ouvrirCaisse = useOuvrirCaisse();
  const fermerCaisse = useFermerCaisse();
  const addMouvement = useAddMouvement();
  const deleteMouvement = useDeleteMouvement();

  const activeCaisse = selectedCaisse ?? caisseOuverte;

  const handleOuvrir = () => {
    ouvrirCaisse.mutate(ouvrirForm, {
      onSuccess: () => {
        setShowOuvrir(false);
        setOuvrirForm({ soldeOuverture: 0, notes: "", ouvertPar: "" });
        setSelectedCaisse(null);
      },
    });
  };

  const handleFermer = () => {
    if (!activeCaisse) return;
    fermerCaisse.mutate({ id: activeCaisse.id }, {
      onSuccess: () => {
        setShowFermer(false);
        setSelectedCaisse(null);
      },
    });
  };

  const handleAddMouvement = () => {
    if (!activeCaisse || !mvtForm.libelle || mvtForm.montant <= 0) return;
    addMouvement.mutate({ ...mvtForm, caisseId: activeCaisse.id }, {
      onSuccess: () => {
        setShowMouvement(false);
        setMvtForm({ type: "ENTREE", categorie: "PAIEMENT_SCOLARITE", montant: 0, libelle: "", notes: "" });
      },
    });
  };

  const statsCards = activeCaisse
    ? [
        {
          title: "Solde d'ouverture",
          value: activeCaisse.soldeOuverture,
          icon: Vault,
          bg: "from-blue-500 to-blue-600",
        },
        {
          title: "Total Entrees",
          value: activeCaisse.totalEntrees,
          icon: TrendingUp,
          bg: "from-green-500 to-green-600",
        },
        {
          title: "Total Sorties",
          value: activeCaisse.totalSorties,
          icon: TrendingDown,
          bg: "from-red-500 to-red-600",
        },
        {
          title: "Solde Actuel",
          value: activeCaisse.soldeActuel,
          icon: DollarSign,
          bg: activeCaisse.soldeActuel >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-600 to-red-700",
        },
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de Caisse</h1>
          <p className="text-sm text-gray-500">
            {caisseOuverte
              ? `Session ouverte le ${caisseOuverte.dateOuverture}`
              : "Aucune session ouverte"}
          </p>
        </div>
        <div className="flex gap-2">
          {!caisseOuverte ? (
            <Button onClick={() => setShowOuvrir(true)} className="bg-gradient-to-r from-green-600 to-green-700">
              <Unlock className="me-2 h-4 w-4" /> Ouvrir la caisse
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setShowMouvement(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                <Plus className="me-2 h-4 w-4" /> Mouvement
              </Button>
              <Button variant="destructive" onClick={() => setShowFermer(true)}>
                <Lock className="me-2 h-4 w-4" /> Fermer la caisse
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {activeCaisse && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl bg-gradient-to-br ${c.bg} p-5 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">{c.title}</p>
                  <p className="mt-1 text-2xl font-bold">{fmt(c.value)} {CURRENCY}</p>
                </div>
                <c.icon className="h-10 w-10 text-white/30" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="session">Session active</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* ─── Active session movements ─── */}
        <TabsContent value="session">
          {!activeCaisse ? (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <Vault className="mx-auto h-16 w-16 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-500">Aucune session de caisse ouverte</p>
              <p className="text-sm text-gray-400">Ouvrez une nouvelle session pour commencer</p>
              <Button className="mt-4" onClick={() => setShowOuvrir(true)}>
                <Unlock className="me-2 h-4 w-4" /> Ouvrir la caisse
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-start text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Categorie</th>
                    <th className="px-4 py-3">Libelle</th>
                    <th className="px-4 py-3 text-end">Montant ({CURRENCY})</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Date/Heure</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingMvts ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
                  ) : mouvements.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucun mouvement enregistre</td></tr>
                  ) : (
                    mouvements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          {m.type === "ENTREE" ? (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              <ArrowUpCircle className="me-1 h-3 w-3" /> Entree
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-0">
                              <ArrowDownCircle className="me-1 h-3 w-3" /> Sortie
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CATEGORIE_LABELS[m.categorie] || m.categorie}
                        </td>
                        <td className="px-4 py-3 font-medium">{m.libelle}</td>
                        <td className="px-4 py-3 text-end font-semibold">
                          <span className={m.type === "ENTREE" ? "text-green-600" : "text-red-600"}>
                            {m.type === "ENTREE" ? "+" : "-"}{fmt(m.montant)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{m.referencePaiement || "-"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(m.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {activeCaisse.statut === "OUVERTE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => setShowDeleteMvt(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── Historique ─── */}
        <TabsContent value="historique">
          <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-start text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date ouverture</th>
                  <th className="px-4 py-3">Date fermeture</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-end">Solde ouverture</th>
                  <th className="px-4 py-3 text-end">Entrees</th>
                  <th className="px-4 py-3 text-end">Sorties</th>
                  <th className="px-4 py-3 text-end">Solde final</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingCaisses ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
                ) : caisses.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Aucune session trouvee</td></tr>
                ) : (
                  caisses.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.dateOuverture}</td>
                      <td className="px-4 py-3 text-gray-600">{c.dateFermeture || "-"}</td>
                      <td className="px-4 py-3">
                        {c.statut === "OUVERTE" ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <Unlock className="me-1 h-3 w-3" /> Ouverte
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-0">
                            <Lock className="me-1 h-3 w-3" /> Fermee
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">{fmt(c.soldeOuverture)}</td>
                      <td className="px-4 py-3 text-end text-green-600">+{fmt(c.totalEntrees)}</td>
                      <td className="px-4 py-3 text-end text-red-600">-{fmt(c.totalSorties)}</td>
                      <td className="px-4 py-3 text-end font-semibold">
                        {fmt(c.soldeActuel)} {CURRENCY}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedCaisse(c); setTab("session"); }}
                        >
                          <Eye className="me-1 h-3.5 w-3.5" /> Voir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Ouvrir Dialog ─── */}
      <Dialog open={showOuvrir} onOpenChange={setShowOuvrir}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ouvrir la caisse</DialogTitle>
            <DialogDescription>Demarrer une nouvelle session de caisse</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Solde d'ouverture ({CURRENCY}) *</Label>
              <Input
                type="number"
                value={ouvrirForm.soldeOuverture}
                onChange={(e) => setOuvrirForm({ ...ouvrirForm, soldeOuverture: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ouvert par</Label>
              <Input
                value={ouvrirForm.ouvertPar || ""}
                onChange={(e) => setOuvrirForm({ ...ouvrirForm, ouvertPar: e.target.value })}
                placeholder="Nom du responsable"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={ouvrirForm.notes || ""}
                onChange={(e) => setOuvrirForm({ ...ouvrirForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleOuvrir} disabled={ouvrirCaisse.isPending} className="bg-green-600 hover:bg-green-700">
              <Unlock className="me-2 h-4 w-4" /> Ouvrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Fermer Dialog ─── */}
      <Dialog open={showFermer} onOpenChange={setShowFermer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fermer la caisse</DialogTitle>
            <DialogDescription>
              Le solde final sera calcule automatiquement. Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          {activeCaisse && (
            <div className="space-y-2 text-sm rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Solde d'ouverture</span>
                <span className="font-medium">{fmt(activeCaisse.soldeOuverture)} {CURRENCY}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total entrees</span>
                <span className="text-green-600 font-medium">+{fmt(activeCaisse.totalEntrees)} {CURRENCY}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total sorties</span>
                <span className="text-red-600 font-medium">-{fmt(activeCaisse.totalSorties)} {CURRENCY}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-base">
                <span>Solde de fermeture</span>
                <span>{fmt(activeCaisse.soldeActuel)} {CURRENCY}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleFermer} disabled={fermerCaisse.isPending}>
              <Lock className="me-2 h-4 w-4" /> Confirmer la fermeture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Mouvement Dialog ─── */}
      <Dialog open={showMouvement} onOpenChange={setShowMouvement}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau mouvement</DialogTitle>
            <DialogDescription>Enregistrer une entree ou sortie de caisse</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={mvtForm.type} onValueChange={(v) => setMvtForm({ ...mvtForm, type: v as TypeMouvement })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREE">Entree</SelectItem>
                    <SelectItem value="SORTIE">Sortie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categorie *</Label>
                <Select value={mvtForm.categorie} onValueChange={(v) => setMvtForm({ ...mvtForm, categorie: v as CategorieMouvement })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Montant ({CURRENCY}) *</Label>
              <Input
                type="number"
                value={mvtForm.montant || ""}
                onChange={(e) => setMvtForm({ ...mvtForm, montant: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Libelle *</Label>
              <Input
                value={mvtForm.libelle}
                onChange={(e) => setMvtForm({ ...mvtForm, libelle: e.target.value })}
                placeholder="Description du mouvement"
              />
            </div>
            <div>
              <Label>Reference paiement</Label>
              <Input
                value={mvtForm.referencePaiement || ""}
                onChange={(e) => setMvtForm({ ...mvtForm, referencePaiement: e.target.value })}
                placeholder="PAY-XXXXXXXX"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={mvtForm.notes || ""}
                onChange={(e) => setMvtForm({ ...mvtForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button
              onClick={handleAddMouvement}
              disabled={!mvtForm.libelle || mvtForm.montant <= 0 || addMouvement.isPending}
              className={mvtForm.type === "ENTREE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {mvtForm.type === "ENTREE" ? (
                <><ArrowUpCircle className="me-2 h-4 w-4" /> Entree</>
              ) : (
                <><ArrowDownCircle className="me-2 h-4 w-4" /> Sortie</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Mouvement Dialog ─── */}
      <Dialog open={!!showDeleteMvt} onOpenChange={() => setShowDeleteMvt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le mouvement</DialogTitle>
            <DialogDescription>
              Supprimer "{showDeleteMvt?.libelle}" ({fmt(showDeleteMvt?.montant ?? 0)} {CURRENCY}) ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (showDeleteMvt) deleteMouvement.mutate(showDeleteMvt.id, { onSuccess: () => setShowDeleteMvt(null) });
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
