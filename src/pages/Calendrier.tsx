import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { type FormErrors } from "@/lib/validate";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  BookOpen,
  Megaphone,
  Sun,
  Info,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  CalendarDays,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnnonces } from "@/hooks/useAnnonces";
import { useExamensRaw } from "@/hooks/useExamens";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useEvenements,
  useCreateEvenement,
  useUpdateEvenement,
  useDeleteEvenement,
} from "@/hooks/useEvenements";
import type { EvenementType } from "@/types/evenement";
import { notify } from "@/lib/toast";

/* ── Types ──────────────────────────────────────────────── */

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  label: string;
  type: "holiday" | "exam" | "annonce" | "custom";
  customId?: string;
  customType?: EvenementType;
  description?: string;
  lieu?: string;
  dateFin?: string;
}

/* ── Tunisian school holidays 2025-2026 ─────────────────── */

const SCHOOL_HOLIDAYS: CalendarEvent[] = [
  { date: "2025-09-15", label: "Rentree scolaire", type: "holiday" },
  ...daysInRange("2025-10-27", "2025-11-02").map((d) => ({ date: d, label: "Vacances d'automne", type: "holiday" as const })),
  { date: "2025-09-05", label: "Mouled Ennabi", type: "holiday" },
  ...daysInRange("2025-12-22", "2026-01-04").map((d) => ({ date: d, label: "Vacances d'hiver", type: "holiday" as const })),
  { date: "2026-01-14", label: "Fete de la Revolution", type: "holiday" },
  ...daysInRange("2026-03-16", "2026-03-22").map((d) => ({ date: d, label: "Vacances de printemps", type: "holiday" as const })),
  { date: "2026-03-20", label: "Fete de l'Independance", type: "holiday" },
  { date: "2026-04-09", label: "Journee des Martyrs", type: "holiday" },
  { date: "2026-05-01", label: "Fete du Travail", type: "holiday" },
  { date: "2026-07-25", label: "Fete de la Republique", type: "holiday" },
  { date: "2026-06-30", label: "Fin de l'annee scolaire", type: "holiday" },
  ...daysInRange("2026-03-20", "2026-03-22").map((d) => ({ date: d, label: "Aid El-Fitr (approx.)", type: "holiday" as const })),
  ...daysInRange("2026-05-27", "2026-05-29").map((d) => ({ date: d, label: "Aid El-Adha (approx.)", type: "holiday" as const })),
];

function daysInRange(start: string, end: string): string[] {
  const result: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    result.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/* ── Helpers ────────────────────────────────────────────── */

const MONTHS_FR = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const EVENT_COLORS: Record<CalendarEvent["type"], { dot: string; bg: string; text: string }> = {
  holiday: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  exam: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  annonce: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  custom: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
};

const EVENT_ICONS: Record<CalendarEvent["type"], React.ElementType> = {
  holiday: Sun,
  exam: BookOpen,
  annonce: Megaphone,
  custom: Sparkles,
};

const CUSTOM_TYPE_LABELS: Record<EvenementType, string> = {
  GENERAL: "Général",
  REUNION: "Réunion",
  SORTIE: "Sortie scolaire",
  EXAMEN: "Examen",
  FERIE: "Férié",
  AUTRE: "Autre",
};

interface FormState {
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  type: EvenementType;
  lieu: string;
}

const initialForm: FormState = {
  titre: "",
  description: "",
  dateDebut: "",
  dateFin: "",
  type: "GENERAL",
  lieu: "",
};

/* ── Component ──────────────────────────────────────────── */

export default function Calendrier() {
  const { t } = useLanguage();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: annonces = [] } = useAnnonces(false);
  const { data: examens = [] } = useExamensRaw();
  const { data: customEvents = [] } = useEvenements();
  const createEvent = useCreateEvenement();
  const updateEvent = useUpdateEvenement();
  const deleteEvent = useDeleteEvenement();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [...SCHOOL_HOLIDAYS];

    annonces.forEach((a) => {
      if (a.datePublication) {
        const dateStr = a.datePublication.split("T")[0];
        list.push({ date: dateStr, label: a.titre, type: "annonce" });
      }
    });

    customEvents.forEach((ev) => {
      const dates = ev.dateFin
        ? daysInRange(ev.dateDebut, ev.dateFin)
        : [ev.dateDebut];
      dates.forEach((d) => {
        list.push({
          date: d,
          label: ev.titre,
          type: "custom",
          customId: ev.id,
          customType: ev.type,
          description: ev.description,
          lieu: ev.lieu,
          dateFin: ev.dateFin,
        });
      });
    });

    return list;
  }, [annonces, customEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.date) ?? [];
      if (!existing.some((e) => e.label === ev.label && e.type === ev.type && e.customId === ev.customId)) {
        existing.push(ev);
      }
      map.set(ev.date, existing);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  const monthEvents = useMemo(() => {
    const prefix = `${year}-${pad(month + 1)}`;
    const result: CalendarEvent[] = [];
    const seen = new Set<string>();
    for (const ev of events) {
      if (ev.date.startsWith(prefix)) {
        const key = `${ev.date}|${ev.label}|${ev.customId ?? ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(ev);
        }
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [events, year, month]);

  const navigate = (direction: number) => {
    let newMonth = month + direction;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setSelectedDate(todayStr);
  };

  const handleOpenCreate = (prefillDate?: string) => {
    setEditingId(null);
    setFormErrors({});
    setForm({
      ...initialForm,
      dateDebut: prefillDate ?? todayStr,
    });
    setShowDialog(true);
  };

  const handleOpenEdit = (id: string) => {
    const ev = customEvents.find((e) => e.id === id);
    if (!ev) return;
    setEditingId(id);
    setFormErrors({});
    setForm({
      titre: ev.titre,
      description: ev.description ?? "",
      dateDebut: ev.dateDebut,
      dateFin: ev.dateFin ?? "",
      type: ev.type,
      lieu: ev.lieu ?? "",
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const errs: FormErrors = {};
    if (!form.titre.trim()) errs.titre = "Le titre est requis";
    if (!form.dateDebut) errs.dateDebut = "La date de début est requise";
    if (form.dateFin && form.dateFin < form.dateDebut) errs.dateFin = "La date de fin doit être après la date de début";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim() || undefined,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin || undefined,
      type: form.type,
      lieu: form.lieu.trim() || undefined,
    };

    if (editingId !== null) {
      updateEvent.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            notify.success("Événement modifié");
            setShowDialog(false);
            setEditingId(null);
            setForm(initialForm);
          },
          onError: () => notify.error("Erreur lors de la modification"),
        }
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          notify.success("Événement ajouté");
          setShowDialog(false);
          setForm(initialForm);
        },
        onError: () => notify.error("Erreur lors de la création"),
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setEditingId(null);
      setFormErrors({});
    }
  };

  const handleDeleteCustom = (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    deleteEvent.mutate(id, {
      onSuccess: () => notify.success("Événement supprimé"),
      onError: () => notify.error("Erreur lors de la suppression"),
    });
  };

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: toDateStr(year, month, d) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, dateStr: null });
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
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Calendrier Scolaire
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Annee scolaire 2025 / 2026 - Vacances, examens et evenements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t("common.today")}
          </Button>
          <Button size="sm" onClick={() => handleOpenCreate(selectedDate ?? undefined)}>
            <Plus className="me-1.5 h-4 w-4" />
            Nouvel événement
          </Button>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {(["holiday", "exam", "annonce", "custom"] as const).map((type) => {
          const Icon = EVENT_ICONS[type];
          const colors = EVENT_COLORS[type];
          const labels: Record<string, string> = {
            holiday: "Vacances / Jours feries",
            exam: "Examens",
            annonce: "Annonces",
            custom: "Événements",
          };
          return (
            <span key={type} className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${colors.bg} ${colors.text} font-medium`}>
              <Icon className="h-3.5 w-3.5" />
              {labels[type]}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-3 rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {MONTHS_FR[month]} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 border-b border-border/40">
            {DAYS_FR.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/20 bg-muted/10" />;
              }
              const dateStr = cell.dateStr!;
              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasHoliday = dayEvents.some((e) => e.type === "holiday");

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  onDoubleClick={() => handleOpenCreate(dateStr)}
                  className={`min-h-[80px] border-b border-r border-border/20 p-1.5 text-start transition-colors relative group
                    ${isToday ? "bg-primary/5" : ""}
                    ${isSelected ? "bg-primary/10 ring-2 ring-primary/30 ring-inset" : ""}
                    ${hasHoliday && !isSelected ? "bg-amber-50/50" : ""}
                    hover:bg-muted/40
                  `}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                    ${isToday ? "bg-primary text-white" : "text-foreground"}
                  `}>
                    {cell.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {Array.from(new Set(dayEvents.map((e) => e.type))).map((type) => (
                        <span key={type} className={`h-1.5 w-1.5 rounded-full ${EVENT_COLORS[type].dot}`} />
                      ))}
                    </div>
                  )}
                  {dayEvents.length > 0 && (
                    <p className="hidden md:block text-[10px] leading-tight text-muted-foreground truncate mt-0.5 max-w-full">
                      {dayEvents[0].label}
                    </p>
                  )}
                  {dayEvents.length > 1 && (
                    <span className="hidden md:block text-[9px] text-muted-foreground/60">
                      +{dayEvents.length - 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1 space-y-4"
        >
          {selectedDate && (
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3 gap-2">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleOpenCreate(selectedDate)}
                  title="Ajouter un événement ce jour"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Aucun evenement ce jour
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev, i) => {
                    const colors = EVENT_COLORS[ev.type];
                    const Icon = EVENT_ICONS[ev.type];
                    return (
                      <div key={`${ev.date}-${i}`} className={`flex items-start gap-2 rounded-lg p-2 ${colors.bg}`}>
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colors.text}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${colors.text}`}>{ev.label}</p>
                          {ev.type === "custom" && ev.customType && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {CUSTOM_TYPE_LABELS[ev.customType]}
                              {ev.lieu && ` • ${ev.lieu}`}
                            </p>
                          )}
                          {ev.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                          )}
                        </div>
                        {ev.type === "custom" && ev.customId && (
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => handleOpenEdit(ev.customId!)}
                              title="Modifier"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCustom(ev.customId!)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
              Evenements - {MONTHS_FR[month]}
            </h3>
            {monthEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("calendar.noEvent")}</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {monthEvents.map((ev, i) => {
                  const colors = EVENT_COLORS[ev.type];
                  const Icon = EVENT_ICONS[ev.type];
                  const dayNum = parseInt(ev.date.split("-")[2], 10);
                  return (
                    <button
                      key={`${ev.date}-${ev.label}-${i}`}
                      onClick={() => setSelectedDate(ev.date)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-start transition-colors hover:bg-muted/40
                        ${ev.date === selectedDate ? "ring-1 ring-primary/30" : ""}
                      `}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{ev.label}</p>
                        <p className="text-[10px] text-muted-foreground">{dayNum} {MONTHS_FR[month]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {examens.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-red-500" />
                Examens
              </h3>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {examens.slice(0, 10).map((ex) => (
                  <div key={ex.id} className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-red-700 truncate">{ex.name}</p>
                      <p className="text-[10px] text-red-500/70">{ex.moduleName} - {ex.classeName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create / edit event dialog */}
      <Dialog open={showDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {editingId !== null ? "Modifier l'événement" : "Nouvel événement"}
            </DialogTitle>
            <DialogDescription>
              {editingId !== null
                ? "Mettez à jour les informations de l'événement."
                : "Ajoutez un événement personnalisé au calendrier scolaire."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titre">Titre *</Label>
              <Input
                id="titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="ex : Conseil de classe 6ème A"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateDebut">Date de début *</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateFin">Date de fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as EvenementType })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CUSTOM_TYPE_LABELS) as EvenementType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CUSTOM_TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lieu" className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Lieu
              </Label>
              <Input
                id="lieu"
                value={form.lieu}
                onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                placeholder="ex : Salle des professeurs"
              />
            </div>

            <div>
              <Label htmlFor="description" className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Description
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Détails supplémentaires..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              {editingId !== null
                ? updateEvent.isPending ? "Modification..." : "Enregistrer"
                : createEvent.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
