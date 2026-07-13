import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import {
  FileText,
  Search,
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  ListOrdered,
  Plus,
  UserPlus,
  Link2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  useInscriptions,
  useInscriptionStats,
  useUpdateStatut,
  useCreateInscription,
  useConvertInscriptionToStudent,
} from "@/hooks/useInscriptions";
import { useNiveaux } from "@/hooks/useNiveaux";
import type { Inscription, InscriptionStatut, CreateInscriptionRequest } from "@/types/inscription";
import { validate, type FormErrors } from "@/lib/validate";
import { createInscriptionSchema } from "@/lib/inscription-schema";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const STATUT_BADGE_CONFIG: Record<string, string> = {
  SOUMISE: "bg-blue-100 text-blue-700",
  EN_REVISION: "bg-yellow-100 text-yellow-700",
  ACCEPTEE: "bg-emerald-100 text-emerald-700",
  REFUSEE: "bg-red-100 text-red-700",
  EN_ATTENTE: "bg-orange-100 text-orange-700",
  LISTE_ATTENTE: "bg-purple-100 text-purple-700",
};

export default function InscriptionsPage() {
  const navigate = useNavigate();
  const publicInscriptionUrl = `${window.location.origin}/inscription-publique`;
  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicInscriptionUrl);
      notify.success("Lien d'inscription publique copié");
    } catch {
      notify.error("Impossible de copier le lien");
    }
  };
  const { t } = useLanguage();

  const STATUT_OPTIONS: { value: InscriptionStatut; label: string }[] = [
    { value: "SOUMISE", label: t("inscriptions.statusOptions.SOUMISE") },
    { value: "EN_REVISION", label: t("inscriptions.statusOptions.EN_REVISION") },
    { value: "ACCEPTEE", label: t("inscriptions.statusOptions.ACCEPTEE") },
    { value: "REFUSEE", label: t("inscriptions.statusOptions.REFUSEE") },
    { value: "EN_ATTENTE", label: t("inscriptions.statusOptions.EN_ATTENTE") },
    { value: "LISTE_ATTENTE", label: t("inscriptions.statusOptions.LISTE_ATTENTE") },
  ];

  const getStatutBadge = (statut: InscriptionStatut) => {
    const className = STATUT_BADGE_CONFIG[statut] ?? "";
    const key = `inscriptions.statusOptions.${statut}` as const;
    return (
      <Badge variant="outline" className={className}>
        {t(key)}
      </Badge>
    );
  };

  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterAnnee, setFilterAnnee] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedInscription, setSelectedInscription] =
    useState<Inscription | null>(null);
  const [changeStatutOpen, setChangeStatutOpen] = useState(false);
  const [newStatut, setNewStatut] = useState<string>("");
  const [commentaire, setCommentaire] = useState("");

  const queryParams = {
    statut: filterStatut !== "all" ? filterStatut : undefined,
    anneeScolaire: filterAnnee || undefined,
    page: currentPage,
    size: 20,
  };

  const { data: pagedData, isLoading } = useInscriptions(queryParams);
  const { data: stats } = useInscriptionStats(filterAnnee || undefined);
  const updateStatutMutation = useUpdateStatut();
  const createInscriptionMutation = useCreateInscription();
  const convertInscriptionMutation = useConvertInscriptionToStudent();
  const { niveaux, getClassesForNiveau } = useNiveaux();

  // Convert dialog state
  const [convertTarget, setConvertTarget] = useState<Inscription | null>(null);
  const [convertClasse, setConvertClasse] = useState("");
  const [convertSexe, setConvertSexe] = useState("");

  const defaultAnnee = (() => {
    const now = new Date();
    const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return `${y}-${y + 1}`;
  })();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateInscriptionRequest>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "M",
    anneeScolaire: defaultAnnee,
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const resetCreateForm = () => {
    setCreateForm({
      nom: "",
      prenom: "",
      dateNaissance: "",
      sexe: "M",
      anneeScolaire: defaultAnnee,
    });
    setCreateErrors({});
  };
  const handleCreateInscription = () => {
    const result = validate(createInscriptionSchema, createForm);
    if (!result.ok) {
      setCreateErrors(result.errors);
      return;
    }
    setCreateErrors({});
    createInscriptionMutation.mutate(createForm, {
      onSuccess: () => {
        notify.success("Dossier d'inscription créé (statut: Soumise)");
        setCreateOpen(false);
        resetCreateForm();
      },
      onError: (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
        const status = err.response?.status;
        const msg = err.response?.data?.message ?? "Erreur lors de la création";
        if (status === 409) setCreateErrors({ _root: msg });
        else setCreateErrors({ _root: msg });
      },
    });
  };

  const inscriptions = pagedData?.content ?? [];
  const totalPages = pagedData?.totalPages ?? 1;
  const totalElements = pagedData?.totalElements ?? 0;

  const hasFilters = filterStatut !== "all" || !!filterAnnee;

  const resetFilters = () => {
    setFilterStatut("all");
    setFilterAnnee("");
    setCurrentPage(0);
  };

  const openDetail = (inscription: Inscription) => {
    setSelectedInscription(inscription);
  };

  const openChangeStatut = (inscription: Inscription) => {
    setSelectedInscription(inscription);
    setNewStatut(inscription.statut);
    setCommentaire(inscription.commentaire ?? "");
    setChangeStatutOpen(true);
  };

  const handleChangeStatut = () => {
    if (!selectedInscription || !newStatut) return;
    updateStatutMutation.mutate(
      {
        id: selectedInscription.id,
        data: {
          statut: newStatut as InscriptionStatut,
          commentaire: commentaire || undefined,
        },
      },
      {
        onSuccess: () => {
          notify.success("Statut mis a jour avec succes");
          setChangeStatutOpen(false);
          setSelectedInscription(null);
        },
        onError: (error) => {
          notify.error(
            error instanceof Error ? error.message : "Erreur lors de la mise a jour"
          );
        },
      }
    );
  };

  const statCards = [
    {
      label: t("inscriptions.submitted"),
      value: stats?.totalSoumises ?? 0,
      icon: FileText,
      color: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: t("inscriptions.accepted"),
      value: stats?.totalAcceptees ?? 0,
      icon: CheckCircle,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: t("inscriptions.refused"),
      value: stats?.totalRefusees ?? 0,
      icon: XCircle,
      color: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      label: t("inscriptions.pending"),
      value: stats?.totalEnAttente ?? 0,
      icon: Clock,
      color: "bg-orange-50",
      textColor: "text-orange-700",
    },
    {
      label: t("inscriptions.waitingList"),
      value: stats?.totalListeAttente ?? 0,
      icon: ListOrdered,
      color: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      label: t("inscriptions.conversionRate"),
      value: `${stats?.tauxConversion ?? 0}%`,
      icon: TrendingUp,
      color: "bg-teal-50",
      textColor: "text-teal-700",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {t("inscriptions.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("inscriptions.subtitle")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn">
              <Plus className="h-4 w-4" />
              Nouvelle inscription
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Créer un dossier d'inscription</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="gap-2.5 py-2.5">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium">Saisir un dossier</span>
                <span className="text-xs text-muted-foreground">Créer une inscription à valider (statut: Soumise)</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Raccourci (hors workflow)</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/dashboard/eleves/ajouter")} className="gap-2.5 py-2.5">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">Ajouter un élève au registre</span>
                <span className="text-xs text-muted-foreground">Saisie directe, sans dossier</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
            >
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Select
              value={filterStatut}
              onValueChange={(v) => {
                setFilterStatut(v);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {STATUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder={t("inscriptions.yearPlaceholder")}
              value={filterAnnee}
              onChange={(e) => {
                setFilterAnnee(e.target.value);
                setCurrentPage(0);
              }}
              className="w-[220px]"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                {t("common.reset")}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {totalElements} {t("common.found")}
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
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("inscriptions.fileNumber")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("inscriptions.fullName")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                  {t("common.level")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  {t("inscriptions.submissionDate")}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                  {t("common.status")}
                </th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {inscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("inscriptions.noInscription")}</p>
                    <p className="text-xs mt-1">
                      {t("inscriptions.noMatchFilter")}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                      <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
                        <FileText className="h-4 w-4" />
                        Saisir un dossier
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={copyPublicLink}>
                        <Link2 className="h-4 w-4" />
                        Copier le lien public
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                inscriptions.map((inscription) => (
                  <tr
                    key={inscription.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => openDetail(inscription)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {inscription.numeroDossier}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">
                        {inscription.prenom} {inscription.nom}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {inscription.niveauNom ?? "-"}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                      {inscription.createdAt
                        ? new Date(inscription.createdAt).toLocaleDateString(
                            "fr-FR"
                          )
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {getStatutBadge(inscription.statut)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(inscription);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChangeStatut(inscription);
                          }}
                        >
                          {t("common.changeStatus")}
                        </Button>
                        {inscription.statut === "ACCEPTEE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvertTarget(inscription);
                              setConvertClasse("");
                            }}
                          >
                            <UserPlus className="h-4 w-4 me-1" />
                            Eleve
                          </Button>
                        )}
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
            <p className="text-xs text-muted-foreground">
              {t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedInscription && !changeStatutOpen}
        onOpenChange={(open) => !open && setSelectedInscription(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("inscriptions.detail")}</DialogTitle>
            <DialogDescription>
              {t("inscriptions.file")}:{" "}
              <span className="font-mono font-semibold text-foreground">
                {selectedInscription?.numeroDossier}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedInscription && (
            <div className="space-y-6 py-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t("inscriptions.currentStatus")}
                  </span>
                  <div className="mt-1">
                    {getStatutBadge(selectedInscription.statut)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedInscription.statut === "ACCEPTEE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => {
                        setConvertTarget(selectedInscription);
                        setConvertClasse("");
                      }}
                    >
                      <UserPlus className="h-4 w-4 me-1" />
                      Convertir en élève
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openChangeStatut(selectedInscription)}
                  >
                    {t("common.changeStatus")}
                  </Button>
                </div>
              </div>

              {/* Informations eleve */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("inscriptions.studentInfo")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">{t("common.lastName")}</span>
                    <p className="font-medium">{selectedInscription.nom}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.firstName")}
                    </span>
                    <p className="font-medium">{selectedInscription.prenom}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.dateOfBirth")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.dateNaissance
                        ? new Date(
                            selectedInscription.dateNaissance
                          ).toLocaleDateString("fr-FR")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.placeOfBirth")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.lieuNaissance ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("common.gender")}</span>
                    <p className="font-medium">
                      {selectedInscription.sexe === "M"
                        ? t("common.male")
                        : selectedInscription.sexe === "F"
                          ? t("common.female")
                          : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.address")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.adresse ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations parent */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("inscriptions.parentInfo")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("inscriptions.parentNameLabel")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.prenomParent ?? ""}{" "}
                      {selectedInscription.nomParent ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.phone")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.telephoneParent ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("common.email")}</span>
                    <p className="font-medium">
                      {selectedInscription.emailParent ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations scolaires */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("inscriptions.schoolInfo")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("inscriptions.requestedLevel")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.niveauNom ?? "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("common.schoolYear")}
                    </span>
                    <p className="font-medium">
                      {selectedInscription.anneeScolaire}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commentaire */}
              {selectedInscription.commentaire && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {t("common.comment")}
                  </h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {selectedInscription.commentaire}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog
        open={changeStatutOpen}
        onOpenChange={(open) => {
          if (!open) {
            setChangeStatutOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.changeStatus")}</DialogTitle>
            <DialogDescription>
              Inscription de{" "}
              <span className="font-semibold text-foreground">
                {selectedInscription?.prenom} {selectedInscription?.nom}
              </span>{" "}
              — Dossier{" "}
              <span className="font-mono">
                {selectedInscription?.numeroDossier}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="statut">{t("common.newStatus")}</Label>
              <Select value={newStatut} onValueChange={setNewStatut}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commentaire">{t("common.comment")}</Label>
              <Textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder={t("common.addComment")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleChangeStatut}
              disabled={
                updateStatutMutation.isPending ||
                !newStatut ||
                newStatut === selectedInscription?.statut
              }
            >
              {updateStatutMutation.isPending
                ? t("common.updating")
                : t("common.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to student dialog */}
      <Dialog open={!!convertTarget} onOpenChange={(o) => !o && setConvertTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Convertir en élève</DialogTitle>
            <DialogDescription>
              {convertTarget?.prenom} {convertTarget?.nom} — {convertTarget?.niveauNom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Classe <span className="text-red-500">*</span></Label>
              <Select value={convertClasse} onValueChange={setConvertClasse}>
                <SelectTrigger><SelectValue placeholder="Selectionner une classe..." /></SelectTrigger>
                <SelectContent>
                  {convertTarget?.niveauNom && getClassesForNiveau(convertTarget.niveauNom).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!convertTarget?.sexe) && (
              <div className="space-y-1.5">
                <Label>Genre <span className="text-red-500">*</span></Label>
                <Select value={convertSexe} onValueChange={setConvertSexe}>
                  <SelectTrigger><SelectValue placeholder="Selectionner le genre..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
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
              onClick={() => {
                if (!convertTarget) return;
                const sexeValue = convertTarget.sexe || convertSexe || undefined;
                if (!sexeValue) {
                  notify.error("Veuillez sélectionner le genre");
                  return;
                }
                convertInscriptionMutation.mutate(
                  { id: convertTarget.id, classe: convertClasse || undefined, sexe: sexeValue },
                  {
                    onSuccess: () => {
                      notify.success("Élève créé avec succès");
                      setConvertTarget(null);
                      setConvertClasse("");
                      setConvertSexe("");
                    },
                    onError: (err: any) => {
                      notify.error(err?.response?.data?.message || err?.message || "Erreur lors de la conversion");
                    },
                  }
                );
              }}
              disabled={convertInscriptionMutation.isPending || !convertClasse || (!convertTarget?.sexe && !convertSexe)}
            >
              {convertInscriptionMutation.isPending ? "Conversion..." : "Convertir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create inscription dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Saisir un dossier d'inscription</DialogTitle>
            <DialogDescription>
              Crée un dossier avec statut <b>Soumise</b>. Il apparaîtra dans la liste pour être accepté / refusé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pe-1">
            {createErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createErrors._root}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={createForm.nom} onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })} aria-invalid={!!createErrors.nom} className={createErrors.nom ? "border-red-500" : ""} />
                {createErrors.nom && <p className="text-xs text-red-600">{createErrors.nom}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input value={createForm.prenom} onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })} aria-invalid={!!createErrors.prenom} className={createErrors.prenom ? "border-red-500" : ""} />
                {createErrors.prenom && <p className="text-xs text-red-600">{createErrors.prenom}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de naissance *</Label>
                <Input type="date" value={createForm.dateNaissance} onChange={(e) => setCreateForm({ ...createForm, dateNaissance: e.target.value })} aria-invalid={!!createErrors.dateNaissance} className={createErrors.dateNaissance ? "border-red-500" : ""} />
                {createErrors.dateNaissance && <p className="text-xs text-red-600">{createErrors.dateNaissance}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Sexe</Label>
                <Select value={createForm.sexe} onValueChange={(v) => setCreateForm({ ...createForm, sexe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lieu de naissance</Label>
              <Input value={createForm.lieuNaissance ?? ""} onChange={(e) => setCreateForm({ ...createForm, lieuNaissance: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={createForm.adresse ?? ""} onChange={(e) => setCreateForm({ ...createForm, adresse: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Niveau souhaité *</Label>
                <Select
                  value={createForm.niveauId ? String(createForm.niveauId) : undefined}
                  onValueChange={(v) => setCreateForm({ ...createForm, niveauId: v })}
                >
                  <SelectTrigger className={createErrors.niveauId ? "border-red-500" : ""}><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={String(n.id)}>{n.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createErrors.niveauId && <p className="text-xs text-red-600">{createErrors.niveauId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Année scolaire *</Label>
                <Input placeholder="2025-2026" value={createForm.anneeScolaire} onChange={(e) => setCreateForm({ ...createForm, anneeScolaire: e.target.value })} aria-invalid={!!createErrors.anneeScolaire} className={createErrors.anneeScolaire ? "border-red-500" : ""} />
                {createErrors.anneeScolaire && <p className="text-xs text-red-600">{createErrors.anneeScolaire}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom du parent</Label>
                <Input value={createForm.nomParent ?? ""} onChange={(e) => setCreateForm({ ...createForm, nomParent: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Prénom du parent</Label>
                <Input value={createForm.prenomParent ?? ""} onChange={(e) => setCreateForm({ ...createForm, prenomParent: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Téléphone parent</Label>
                <Input value={createForm.telephoneParent ?? ""} onChange={(e) => setCreateForm({ ...createForm, telephoneParent: e.target.value })} aria-invalid={!!createErrors.telephoneParent} className={createErrors.telephoneParent ? "border-red-500" : ""} />
                {createErrors.telephoneParent && <p className="text-xs text-red-600">{createErrors.telephoneParent}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email parent</Label>
                <Input type="email" value={createForm.emailParent ?? ""} onChange={(e) => setCreateForm({ ...createForm, emailParent: e.target.value })} aria-invalid={!!createErrors.emailParent} className={createErrors.emailParent ? "border-red-500" : ""} />
                {createErrors.emailParent && <p className="text-xs text-red-600">{createErrors.emailParent}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreateInscription} disabled={createInscriptionMutation.isPending}>
              {createInscriptionMutation.isPending ? "Création…" : "Créer le dossier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
