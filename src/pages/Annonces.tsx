import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { validate, type FormErrors } from "@/lib/validate";
import { annonceSchema } from "@/lib/communication-schemas";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Calendar,
  Users,
  AlertTriangle,
  MessageSquare,
  Send,
  FileText,
  Paperclip,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/auth/Gates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  useAnnonces,
  useCreateAnnonce,
  useUpdateAnnonce,
  useDeleteAnnonce,
} from "@/hooks/useAnnonces";
import { integrationsApi } from "@/api/integrations.api";
import { useMySmsCredits } from "@/hooks/useSmsCredits";
import { useClasses } from "@/hooks/useClasses";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useCreneaux, useEmploiByClasse } from "@/hooks/useEmploiDuTemps";
import { useSchool } from "@/hooks/useSchool";
import { useActiveAnneeScolaire } from "@/hooks/useAnneeScolaire";
import { generateEmploiDuTempsPdf } from "@/utils/generateEmploiDuTempsPdf";
import { resolveFileUrl, extractOriginalName, uploadFile } from "@/api/storage.api";
import type { Annonce, AnnonceType, DestinatairesType } from "@/types/notification";
import { notify } from "@/lib/toast";

const TYPE_COLORS: Record<AnnonceType, string> = {
  GENERAL: "bg-blue-100 text-blue-700",
  URGENT: "bg-red-100 text-red-700 border-red-300",
  EVENEMENT: "bg-purple-100 text-purple-700",
  REUNION: "bg-emerald-100 text-emerald-700",
};

interface FormState {
  titre: string;
  contenu: string;
  type: AnnonceType;
  destinataires: DestinatairesType;
  classeId?: string;
  niveauNom?: string;
  fichierUrl?: string;
  dateExpiration?: string;
}

const initialForm: FormState = {
  titre: "",
  contenu: "",
  type: "GENERAL",
  destinataires: "TOUS",
  classeId: "",
  niveauNom: "",
  fichierUrl: "",
  dateExpiration: "",
};

export default function AnnoncesPage() {
  const { t } = useLanguage();

  const TYPE_LABELS: Record<AnnonceType, string> = useMemo(() => ({
    GENERAL: t("announcements.announcementTypes.general"),
    URGENT: t("announcements.announcementTypes.urgent"),
    EVENEMENT: t("announcements.announcementTypes.event"),
    REUNION: t("announcements.announcementTypes.meeting"),
  }), [t]);

  const DEST_LABELS: Record<DestinatairesType, string> = useMemo(() => ({
    TOUS: t("announcements.recipientTypes.all"),
    PARENTS: t("announcements.recipientTypes.parents"),
    ENSEIGNANTS: t("announcements.recipientTypes.teachers"),
    ELEVES: t("announcements.recipientTypes.students"),
    CLASSE: t("announcements.recipientTypes.class"),
    NIVEAU: t("announcements.recipientTypes.level"),
  }), [t]);
  const [showDialog, setShowDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsPhones, setSmsPhones] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const { data: annonces = [], isLoading } = useAnnonces();
  const { data: smsCredits } = useMySmsCredits();
  const createAnnonce = useCreateAnnonce();
  const updateAnnonce = useUpdateAnnonce();
  const deleteAnnonce = useDeleteAnnonce();

  const { data: classes = [] } = useClasses();
  const { niveaux } = useNiveaux();
  const { data: creneaux = [] } = useCreneaux();
  const { school } = useSchool();
  const { data: activeAnnee } = useActiveAnneeScolaire();
  const [edtClasseId, setEdtClasseId] = useState("");
  const [generatingEdt, setGeneratingEdt] = useState(false);
  const { data: edtEntries = [] } = useEmploiByClasse(edtClasseId);

  const JOURS = useMemo(() => [
    { value: 1, label: t("common.days.monday") },
    { value: 2, label: t("common.days.tuesday") },
    { value: 3, label: t("common.days.wednesday") },
    { value: 4, label: t("common.days.thursday") },
    { value: 5, label: t("common.days.friday") },
    { value: 6, label: t("common.days.saturday") },
  ], [t]);

  const anneeScolaireLabel =
    activeAnnee?.label ??
    (activeAnnee?.dateDebut
      ? `${activeAnnee.dateDebut.slice(0, 4)} - ${activeAnnee.dateFin?.slice(0, 4) ?? ""}`
      : undefined);

  const generateAndAttachEdt = async () => {
    if (!edtClasseId) return;
    if (!school) {
      notify.error(t("announcements.edtError"));
      return;
    }
    const classe = classes.find((c) => c.id === edtClasseId);
    setGeneratingEdt(true);
    try {
      const blob = await generateEmploiDuTempsPdf(
        {
          school,
          anneeScolaireLabel,
          classeName: classe?.fullName ?? `Classe ${edtClasseId}`,
          jours: JOURS.map((j) => j.label),
          creneaux,
          entries: edtEntries,
        },
        { download: false }
      );
      if (!blob) return;
      const file = new File(
        [blob],
        `Emploi_du_temps_${(classe?.fullName ?? edtClasseId).replace(/\s+/g, "_")}.pdf`,
        { type: "application/pdf" }
      );
      const info = await uploadFile(file, "annonces");
      setForm({ ...form, fichierUrl: info.fileUrl });
      notify.success(t("announcements.edtGenerated"));
    } catch {
      notify.error(t("announcements.edtError"));
    } finally {
      setGeneratingEdt(false);
    }
  };

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return annonces;
    return annonces.filter((a) => a.type === typeFilter);
  }, [annonces, typeFilter]);

  const handleOpenCreate = () => {
    setForm(initialForm);
    setEditId(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (annonce: Annonce) => {
    setForm({
      titre: annonce.titre,
      contenu: annonce.contenu,
      type: annonce.type,
      destinataires: annonce.destinataires,
      classeId: annonce.classeId?.toString() || "",
      niveauNom: annonce.niveauNom || "",
      fichierUrl: annonce.fichierUrl || "",
      dateExpiration: annonce.dateExpiration
        ? new Date(annonce.dateExpiration).toISOString().slice(0, 16)
        : "",
    });
    setEditId(annonce.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const result = validate(annonceSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});

    const payload: Record<string, unknown> = {
      titre: form.titre,
      contenu: form.contenu,
      type: form.type,
      destinataires: form.destinataires,
    };
    if (form.classeId) payload.classeId = form.classeId;
    if (form.niveauNom) payload.niveauNom = form.niveauNom;
    // En modification, la chaîne vide est envoyée telle quelle : c'est ainsi
    // que le retrait d'une pièce jointe est signalé au serveur.
    if (form.fichierUrl || editId) payload.fichierUrl = form.fichierUrl ?? "";
    if (form.dateExpiration) payload.dateExpiration = form.dateExpiration;

    if (editId) {
      updateAnnonce.mutate(
        { id: editId, data: payload as Partial<Annonce> },
        {
          onSuccess: () => {
            notify.success(t("announcements.updated"));
            setShowDialog(false);
          },
          onError: () => notify.error(t("common.updateError")),
        }
      );
    } else {
      createAnnonce.mutate(payload as Omit<Annonce, "id" | "createdAt" | "actif">, {
        onSuccess: () => {
          notify.success(t("announcements.created"));
          setShowDialog(false);
        },
        onError: () => notify.error(t("common.createError")),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteAnnonce.mutate(id, {
      onSuccess: () => notify.success(t("announcements.deletedMsg")),
      onError: () => notify.error(t("common.deleteError")),
    });
  };

  const handleSendBulkSms = async () => {
    const phones = smsPhones
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (phones.length === 0 || !smsMessage.trim()) {
      notify.error(t("announcements.smsValidation"));
      return;
    }

    if (smsCredits && phones.length > smsCredits.remaining) {
      notify.error(`Credits SMS insuffisants. Disponible: ${smsCredits.remaining}, Requis: ${phones.length}`);
      return;
    }

    setSmsSending(true);
    try {
      const result = await integrationsApi.sendBulkSms(phones, smsMessage);
      notify.success(t("announcements.smsSuccess", { sent: result.length, total: phones.length }));
      setShowSmsDialog(false);
      setSmsPhones("");
      setSmsMessage("");
    } catch {
      notify.error(t("announcements.smsError"));
    } finally {
      setSmsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("announcements.title")}</h1>
          <p className="text-muted-foreground">
            {t("announcements.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {smsCredits && (
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              smsCredits.remaining <= 0
                ? "bg-red-50 text-red-700"
                : smsCredits.remaining < 20
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{smsCredits.remaining}/{smsCredits.totalCredits} SMS</span>
            </div>
          )}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[160px] sm:flex-none">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("announcements.announcementTypes.all")}</SelectItem>
              {(Object.keys(TYPE_LABELS) as AnnonceType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PermissionGate perms={["MANAGE_COMMUNICATION", "WRITE_MESSAGES"]}>
            <Button variant="outline" onClick={() => setShowSmsDialog(true)}>
              <MessageSquare className="me-2 h-4 w-4" />
              {t("announcements.sendSms")}
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="me-2 h-4 w-4" />
              {t("announcements.newAnnouncement")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Annonces grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Megaphone className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">{t("announcements.noAnnouncement")}</p>
          <p className="text-sm">{t("announcements.createFirst")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((annonce) => (
            <Card
              key={annonce.id}
              className={`relative ${
                annonce.type === "URGENT" ? "border-red-300 border-2" : ""
              }`}
            >
              {annonce.type === "URGENT" && (
                <div className="absolute -top-2 -end-2">
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <AlertTriangle className="me-1 h-3 w-3" />
                    URGENT
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{annonce.titre}</CardTitle>
                    <CardDescription className="text-xs">
                      {annonce.auteurName && `Par ${annonce.auteurName} - `}
                      {new Date(annonce.datePublication).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {annonce.contenu}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className={TYPE_COLORS[annonce.type]}>
                    {TYPE_LABELS[annonce.type]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="me-1 h-3 w-3" />
                    {DEST_LABELS[annonce.destinataires]}
                    {annonce.destinataires === "NIVEAU" && annonce.niveauNom && (
                      <span className="ms-1">· {annonce.niveauNom}</span>
                    )}
                  </Badge>
                  {annonce.dateExpiration && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="me-1 h-3 w-3" />
                      {t("announcements.expires")}:{" "}
                      {new Date(annonce.dateExpiration).toLocaleDateString("fr-FR")}
                    </Badge>
                  )}
                  {annonce.fichierUrl && (
                    <a
                      href={resolveFileUrl(annonce.fichierUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      <FileText className="h-3 w-3" />
                      {extractOriginalName(annonce.fichierUrl)}
                    </a>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                <PermissionGate perms={["MANAGE_COMMUNICATION", "WRITE_MESSAGES"]}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(annonce)}
                  >
                    <Edit className="me-1 h-3 w-3" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(annonce.id)}
                  >
                    <Trash2 className="me-1 h-3 w-3" />
                    {t("common.delete")}
                  </Button>
                </PermissionGate>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk SMS dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("announcements.bulkSms")}
            </DialogTitle>
            <DialogDescription>
              {t("announcements.bulkSmsDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {smsCredits && (
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                smsCredits.remaining <= 0
                  ? "bg-red-50 text-red-700"
                  : "bg-muted"
              }`}>
                <span>Credits SMS disponibles</span>
                <span className="font-bold">{smsCredits.remaining}/{smsCredits.totalCredits}</span>
              </div>
            )}
            <div>
              <Label htmlFor="smsPhones">{t("announcements.phoneNumbers")}</Label>
              <Textarea
                id="smsPhones"
                value={smsPhones}
                onChange={(e) => setSmsPhones(e.target.value)}
                placeholder={t("announcements.phonePlaceholder")}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("announcements.phoneSeparatorHint")}
              </p>
            </div>
            <div>
              <Label htmlFor="smsMessage">{t("common.message")}</Label>
              <Textarea
                id="smsMessage"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder={t("announcements.smsMessage")}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {smsMessage.length}/160 {t("announcements.charsCount")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                <X className="me-2 h-4 w-4" />
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button onClick={handleSendBulkSms} disabled={smsSending}>
              {smsSending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="me-2 h-4 w-4" />
              )}
              {t("common.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t("announcements.editAnnouncement") : t("announcements.newAnnouncement")}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? t("announcements.editInfo")
                : t("announcements.fillInfo")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formErrors._root}</div>
            )}
            <div>
              <Label htmlFor="titre">{t("common.title")} *</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder={t("announcements.titlePlaceholder")}
                aria-invalid={!!formErrors.titre}
                className={formErrors.titre ? "border-red-500" : ""}
              />
              {formErrors.titre && <p className="text-xs text-red-600">{formErrors.titre}</p>}
            </div>
            <div>
              <Label htmlFor="contenu">{t("common.content")} *</Label>
              <Textarea
                id="contenu"
                value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                placeholder={t("announcements.contentPlaceholder")}
                rows={4}
                aria-invalid={!!formErrors.contenu}
                className={formErrors.contenu ? "border-red-500" : ""}
              />
              {formErrors.contenu && <p className="text-xs text-red-600">{formErrors.contenu}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("common.type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as AnnonceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as AnnonceType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("announcements.recipients")}</Label>
                <Select
                  value={form.destinataires}
                  onValueChange={(v) =>
                    setForm({ ...form, destinataires: v as DestinatairesType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEST_LABELS) as DestinatairesType[]).map((dest) => (
                      <SelectItem key={dest} value={dest}>
                        {DEST_LABELS[dest]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.destinataires === "CLASSE" && (
              <div>
                <Label htmlFor="classeId">{t("announcements.selectClass")} *</Label>
                <Select
                  value={form.classeId}
                  onValueChange={(v) => setForm({ ...form, classeId: v })}
                >
                  <SelectTrigger
                    id="classeId"
                    className={formErrors.classeId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("announcements.selectClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.classeId && (
                  <p className="text-xs text-red-600">{formErrors.classeId}</p>
                )}
              </div>
            )}
            {form.destinataires === "NIVEAU" && (
              <div>
                <Label htmlFor="niveauNom">{t("announcements.selectLevel")} *</Label>
                <Select
                  value={form.niveauNom}
                  onValueChange={(v) => setForm({ ...form, niveauNom: v })}
                >
                  <SelectTrigger
                    id="niveauNom"
                    className={formErrors.niveauNom ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("announcements.selectLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.nom}>
                        {n.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.niveauNom && (
                  <p className="text-xs text-red-600">{formErrors.niveauNom}</p>
                )}
              </div>
            )}
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                {t("announcements.attachment")}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                {t("announcements.attachmentDesc")}
              </p>
              {form.fichierUrl ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">
                      {extractOriginalName(form.fichierUrl)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={resolveFileUrl(form.fichierUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
                      title={t("announcements.viewDocument")}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fichierUrl: "" })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                      title={t("announcements.attachmentRemove")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <FileUpload
                  folder="annonces"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onUpload={(info) => setForm({ ...form, fichierUrl: info.fileUrl })}
                />
              )}
              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OU</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("announcements.edtClass")}
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={edtClasseId} onValueChange={setEdtClasseId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("announcements.selectClass")} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={generateAndAttachEdt}
                    disabled={!edtClasseId || generatingEdt}
                  >
                    {generatingEdt ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="me-2 h-4 w-4" />
                    )}
                    {generatingEdt
                      ? t("announcements.generatingEdt")
                      : t("announcements.generateEdt")}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="dateExpiration">{t("announcements.expiryDate")}</Label>
              <Input
                id="dateExpiration"
                type="datetime-local"
                value={form.dateExpiration}
                onChange={(e) => setForm({ ...form, dateExpiration: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                <X className="me-2 h-4 w-4" />
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={createAnnonce.isPending || updateAnnonce.isPending}
            >
              {(createAnnonce.isPending || updateAnnonce.isPending) && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {editId ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
