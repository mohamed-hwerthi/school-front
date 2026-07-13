import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  Award,
  ClipboardList,
  Receipt,
  Loader2,
  Download,
  History,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAllStudents } from "@/hooks/useStudents";
import {
  useDocumentHistory,
  useGenerateCertificatScolarite,
  useGenerateCarteScolaire,
  useGenerateAttestation,
  useGenerateReleveNotes,
  useGenerateRecuPaiement,
  useGenerateBulk,
} from "@/hooks/useDocuments";
import type { DocumentType } from "@/types/document";
import { DOCUMENT_TYPE_LABELS } from "@/types/document";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const DOC_CARDS: Array<{
  type: DocumentType;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
  textColor: string;
}> = [
  {
    type: "CERTIFICAT_SCOLARITE",
    label: "Certificat de Scolarite",
    description: "Generer un certificat de scolarite pour un eleve",
    icon: FileText,
    color: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    type: "CARTE_SCOLAIRE",
    label: "Carte Scolaire",
    description: "Generer la carte scolaire d'un eleve",
    icon: CreditCard,
    color: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    type: "ATTESTATION_REUSSITE",
    label: "Attestation de Reussite",
    description: "Generer une attestation de reussite",
    icon: Award,
    color: "bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    type: "RELEVE_NOTES",
    label: "Releve de Notes",
    description: "Generer le releve de notes d'un eleve",
    icon: ClipboardList,
    color: "bg-purple-50",
    textColor: "text-purple-700",
  },
  {
    type: "RECU_PAIEMENT",
    label: "Recu de Paiement",
    description: "Generer un recu de paiement",
    icon: Receipt,
    color: "bg-rose-50",
    textColor: "text-rose-700",
  },
];

export default function GenerationDocuments() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedTrimestre, setSelectedTrimestre] = useState<number>(0);
  const [paiementId, setPaiementId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [filterNiveau, setFilterNiveau] = useState<string>("all");
  const [filterClasse, setFilterClasse] = useState<string>("all");
  const [historyPage, setHistoryPage] = useState(0);

  const { data: students = [] } = useAllStudents();
  const { data: history = [], isLoading: historyLoading } = useDocumentHistory();

  const genCertificat = useGenerateCertificatScolarite();
  const genCarte = useGenerateCarteScolaire();
  const genAttestation = useGenerateAttestation();
  const genReleve = useGenerateReleveNotes();
  const genRecu = useGenerateRecuPaiement();
  const genBulk = useGenerateBulk();

  const isGenerating =
    genCertificat.isPending ||
    genCarte.isPending ||
    genAttestation.isPending ||
    genReleve.isPending ||
    genRecu.isPending ||
    genBulk.isPending;

  const niveauOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => { if (s.niveau) set.add(s.niveau); });
    return Array.from(set).sort();
  }, [students]);

  const classeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (!s.classe) return;
      if (filterNiveau !== "all" && s.niveau !== filterNiveau) return;
      set.add(s.classe);
    });
    return Array.from(set).sort();
  }, [students, filterNiveau]);

  const filteredStudents = students.filter((s) => {
    if (filterNiveau !== "all" && s.niveau !== filterNiveau) return false;
    if (filterClasse !== "all" && s.classe !== filterClasse) return false;
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.prenom?.toLowerCase().includes(q) ||
      s.nom?.toLowerCase().includes(q) ||
      s.matricule?.toLowerCase().includes(q)
    );
  });

  const ITEMS_PER_PAGE = 10;
  const historyPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const paginatedHistory = history.slice(
    historyPage * ITEMS_PER_PAGE,
    (historyPage + 1) * ITEMS_PER_PAGE
  );

  const handleGenerate = () => {
    if (!selectedDocType) return;

    switch (selectedDocType) {
      case "CERTIFICAT_SCOLARITE":
        if (selectedStudentId) genCertificat.mutate(selectedStudentId);
        break;
      case "CARTE_SCOLAIRE":
        if (selectedStudentId) genCarte.mutate(selectedStudentId);
        break;
      case "ATTESTATION_REUSSITE":
        if (selectedStudentId)
          genAttestation.mutate({ eleveId: selectedStudentId });
        break;
      case "RELEVE_NOTES":
        if (selectedStudentId)
          genReleve.mutate({
            eleveId: selectedStudentId,
            trimestre: selectedTrimestre > 0 ? selectedTrimestre : undefined,
          });
        break;
      case "RECU_PAIEMENT": {
        const pid = paiementId;
        if (!isNaN(pid) && pid) genRecu.mutate(pid);
        break;
      }
    }
    setSelectedDocType(null);
    setSelectedStudentId(0);
    setSelectedTrimestre(0);
    setPaiementId("");
  };

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
            {t("documents.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("documents.subtitle")}
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <FileText className="h-4 w-4" /> Generer
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" /> Historique
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {DOC_CARDS.map((card, i) => (
              <motion.div
                key={card.type}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-xl border border-border/50 bg-card p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => {
                  setSelectedDocType(card.type);
                  setSelectedStudentId(0);
                  setSelectedTrimestre(0);
                  setPaiementId("");
                  setStudentSearch("");
                  setFilterNiveau("all");
                  setFilterClasse("all");
                }}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                >
                  <card.icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <h3 className="mt-3 font-semibold text-sm text-foreground">
                  {card.label}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                          Type
                        </th>
                        <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                          Eleve
                        </th>
                        <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                          Fichier
                        </th>
                        <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-16 text-center text-muted-foreground"
                          >
                            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Aucun document genere</p>
                            <p className="text-xs mt-1">
                              Les documents generes apparaitront ici
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedHistory.map((doc) => (
                          <tr
                            key={doc.id}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <Badge variant="outline">
                                {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {doc.eleveName || "-"}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                              {doc.fileName}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                              {doc.dateGeneration
                                ? new Date(doc.dateGeneration).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {historyPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Page {historyPage + 1} sur {historyPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={historyPage === 0}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={historyPage >= historyPages - 1}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>

      </Tabs>

      {/* Student Selection Dialog */}
      <Dialog
        open={selectedDocType !== null && selectedDocType !== "RECU_PAIEMENT"}
        onOpenChange={(open) => {
          if (!open) setSelectedDocType(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDocType
                ? DOCUMENT_TYPE_LABELS[selectedDocType]
                : "Document"}
            </DialogTitle>
            <DialogDescription>
              Selectionnez un eleve pour generer le document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Niveau</Label>
                <Select
                  value={filterNiveau}
                  onValueChange={(v) => { setFilterNiveau(v); setFilterClasse("all"); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Classe</Label>
                <Select
                  value={filterClasse}
                  onValueChange={setFilterClasse}
                  disabled={classeOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {classeOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Rechercher un eleve..."
                className="ps-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun eleve trouve</p>
                </div>
              ) : (
                filteredStudents.slice(0, 50).map((s) => (
                  <div
                    key={s.id}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-center justify-between ${
                      selectedStudentId === s.id ? "bg-primary/10" : ""
                    }`}
                    onClick={() => setSelectedStudentId(s.id)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s.nom} {s.prenom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.matricule || "N/A"} - {s.classe || "N/A"}
                      </p>
                    </div>
                    {selectedStudentId === s.id && (
                      <Badge variant="default" className="text-xs">
                        Selectionne
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
            {selectedDocType === "RELEVE_NOTES" && (
              <div className="space-y-1.5">
                <Label>Trimestre (optionnel)</Label>
                <Select
                  value={selectedTrimestre ? String(selectedTrimestre) : "0"}
                  onValueChange={(v) => setSelectedTrimestre(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les trimestres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Annuel</SelectItem>
                    <SelectItem value="1">Trimestre 1</SelectItem>
                    <SelectItem value="2">Trimestre 2</SelectItem>
                    <SelectItem value="3">Trimestre 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleGenerate}
              disabled={!selectedStudentId || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 me-1.5" />
                  Generer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paiement ID Dialog (for Recu) */}
      <Dialog
        open={selectedDocType === "RECU_PAIEMENT"}
        onOpenChange={(open) => {
          if (!open) setSelectedDocType(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recu de Paiement</DialogTitle>
            <DialogDescription>
              Entrez le numero de paiement pour generer le recu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="paiementId">Numero de paiement</Label>
              <Input
                id="paiementId"
                type="number"
                value={paiementId}
                onChange={(e) => setPaiementId(e.target.value)}
                placeholder="Ex: 123"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleGenerate}
              disabled={!paiementId || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 me-1.5" />
                  Generer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
