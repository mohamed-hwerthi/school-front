import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { validate, type FormErrors } from "@/lib/validate";
import { reunionSchema } from "@/lib/communication-schemas";
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Clock,
  User,
  Users,
  List,
  LayoutGrid,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  useMeetings,
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
} from "@/hooks/useMeetings";
import type { MeetingRequest, MeetingResponse } from "@/api/meetings.api";
import { notify } from "@/lib/toast";

interface FormState {
  title: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  enseignantId: string;
  parentId: string;
  studentId: string;
  statut: string;
  notes: string;
}

const initialForm: FormState = {
  title: "",
  date: "",
  heureDebut: "",
  heureFin: "",
  enseignantId: "",
  parentId: "",
  studentId: "",
  statut: "PLANIFIE",
  notes: "",
};

export default function ReunionsPage() {
  const { t } = useLanguage();

  const STATUT_CONFIG: Record<string, { label: string; color: string }> = useMemo(() => ({
    PLANIFIE: { label: t("meetings.statuses.planned"), color: "bg-blue-100 text-blue-700" },
    CONFIRME: { label: t("meetings.statuses.confirmed"), color: "bg-emerald-100 text-emerald-700" },
    ANNULE: { label: t("meetings.statuses.cancelled"), color: "bg-red-100 text-red-700" },
  }), [t]);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [statutFilter, setStatutFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const { data: meetings = [], isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const filtered = useMemo(() => {
    if (statutFilter === "ALL") return meetings;
    return meetings.filter((m) => m.statut === statutFilter);
  }, [meetings, statutFilter]);

  // Group meetings by date for calendar view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, MeetingResponse[]> = {};
    for (const m of filtered) {
      const key = m.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleOpenCreate = () => {
    setForm(initialForm);
    setEditId(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (meeting: MeetingResponse) => {
    setForm({
      title: meeting.title,
      date: meeting.date,
      heureDebut: meeting.heureDebut,
      heureFin: meeting.heureFin,
      enseignantId: meeting.enseignantId?.toString() || "",
      parentId: meeting.parentId?.toString() || "",
      studentId: meeting.studentId?.toString() || "",
      statut: meeting.statut,
      notes: meeting.notes || "",
    });
    setEditId(meeting.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const result = validate(reunionSchema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});

    const payload: MeetingRequest = {
      title: form.title,
      date: form.date,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      statut: form.statut,
      notes: form.notes || undefined,
    };
    if (form.enseignantId) payload.enseignantId = form.enseignantId;
    if (form.parentId) payload.parentId = form.parentId;
    if (form.studentId) payload.studentId = form.studentId;

    if (editId) {
      updateMeeting.mutate(
        { id: editId, data: payload },
        {
          onSuccess: () => {
            notify.success(t("meetings.updated"));
            setShowDialog(false);
          },
          onError: () => notify.error(t("common.updateError")),
        }
      );
    } else {
      createMeeting.mutate(payload, {
        onSuccess: () => {
          notify.success(t("meetings.created"));
          setShowDialog(false);
        },
        onError: () => notify.error(t("common.createError")),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteMeeting.mutate(id, {
      onSuccess: () => notify.success(t("meetings.deletedMsg")),
      onError: () => notify.error(t("common.deleteError")),
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {t("meetings.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("meetings.planDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="me-2 h-4 w-4" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("common.allStatuses")}</SelectItem>
              <SelectItem value="PLANIFIE">{t("meetings.statuses.planned")}</SelectItem>
              <SelectItem value="CONFIRME">{t("meetings.statuses.confirmed")}</SelectItem>
              <SelectItem value="ANNULE">{t("meetings.statuses.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t("meetings.newMeeting")}
          </Button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">{t("meetings.noMeeting")}</p>
          <p className="text-sm">{t("meetings.planFirst")}</p>
        </div>
      ) : viewMode === "calendar" ? (
        /* Calendar-style grouped view */
        <div className="space-y-6">
          {groupedByDate.map(([date, dateMeetings]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {formatDate(date)}
              </h2>
              <div className="space-y-2">
                {dateMeetings.map((meeting) => {
                  const config = STATUT_CONFIG[meeting.statut] || STATUT_CONFIG.PLANIFIE;
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 px-3 py-2 min-w-[80px]">
                        <span className="text-xs text-muted-foreground">
                          {meeting.heureDebut?.slice(0, 5)}
                        </span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {meeting.heureFin?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{meeting.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {meeting.enseignantName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {meeting.enseignantName}
                            </span>
                          )}
                          {meeting.parentName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.parentName}
                            </span>
                          )}
                          {meeting.studentName && (
                            <span className="flex items-center gap-1">
                              {t("common.student")}: {meeting.studentName}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={config.color}>{config.label}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(meeting)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(meeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((meeting) => {
            const config = STATUT_CONFIG[meeting.statut] || STATUT_CONFIG.PLANIFIE;
            return (
              <Card key={meeting.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(meeting.date)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {meeting.heureDebut?.slice(0, 5)} - {meeting.heureFin?.slice(0, 5)}
                  </div>
                  {meeting.enseignantName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {t("common.teacher")}: {meeting.enseignantName}
                    </div>
                  )}
                  {meeting.parentName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {t("common.parent")}: {meeting.parentName}
                    </div>
                  )}
                  {meeting.studentName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {t("common.student")}: {meeting.studentName}
                    </div>
                  )}
                  {meeting.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">
                      {meeting.notes}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(meeting)}
                    >
                      <Edit className="me-1 h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      <Trash2 className="me-1 h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? t("meetings.editMeeting") : t("meetings.newMeeting")}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? t("meetings.editInfo")
                : t("meetings.planDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("common.title")}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("meetings.meetingSubject")}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">{t("common.date")}</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="heureDebut">{t("common.start")}</Label>
                <Input
                  id="heureDebut"
                  type="time"
                  value={form.heureDebut}
                  onChange={(e) => setForm({ ...form, heureDebut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="heureFin">{t("common.end")}</Label>
                <Input
                  id="heureFin"
                  type="time"
                  value={form.heureFin}
                  onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="enseignantId">ID Enseignant</Label>
                <Input
                  id="enseignantId"
                  type="number"
                  value={form.enseignantId}
                  onChange={(e) => setForm({ ...form, enseignantId: e.target.value })}
                  placeholder="ID de l'enseignant"
                />
              </div>
              <div>
                <Label htmlFor="parentId">ID Parent</Label>
                <Input
                  id="parentId"
                  type="number"
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  placeholder="ID du parent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentId">ID Eleve</Label>
                <Input
                  id="studentId"
                  type="number"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="ID de l'eleve"
                />
              </div>
              <div>
                <Label>{t("common.status")}</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) => setForm({ ...form, statut: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANIFIE">{t("meetings.statuses.planned")}</SelectItem>
                    <SelectItem value="CONFIRME">{t("meetings.statuses.confirmed")}</SelectItem>
                    <SelectItem value="ANNULE">{t("meetings.statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("meetings.meetingNotes")}
                rows={3}
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
              disabled={createMeeting.isPending || updateMeeting.isPending}
            >
              {(createMeeting.isPending || updateMeeting.isPending) && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {editId ? t("common.update") : t("meetings.plan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
