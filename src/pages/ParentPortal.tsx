import { useState } from "react";
import {
  Loader2,
  Users,
  BookOpen,
  UserX,
  FileText,
  Clock,
  TrendingUp,
  Megaphone,
  Download,
  AlertCircle,
  PenTool,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useChildren,
  useChildNotes,
  useChildAbsences,
  useChildBulletin,
  useChildEmploiDuTemps,
  useParentAnnonces,
  useChildPaiements,
} from "@/hooks/useParentPortal";
import { resolveFileUrl, extractOriginalName } from "@/api/storage.api";
import type { Child, AnnonceType, DestinatairesType } from "@/types/notification";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { CURRENCY } from "@/config/currency";
import { formatDate, formatNumber } from "@/lib/format-locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { DevoirsTab } from "@/components/parent/DevoirsTab";
import { PaiementsTab } from "@/components/parent/PaiementsTab";

/** jourSemaine 1..7 → clé de common.days. */
const JOUR_KEYS = [
  "",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TYPE_COLORS: Record<AnnonceType, string> = {
  GENERAL: "bg-blue-100 text-blue-700",
  URGENT: "bg-red-100 text-red-700 border-red-300",
  EVENEMENT: "bg-purple-100 text-purple-700",
  REUNION: "bg-emerald-100 text-emerald-700",
};

const DEST_KEYS: Record<DestinatairesType, string> = {
  TOUS: "announcements.recipientTypes.all",
  PARENTS: "announcements.recipientTypes.parents",
  ENSEIGNANTS: "announcements.recipientTypes.teachers",
  ELEVES: "announcements.recipientTypes.students",
  CLASSE: "announcements.recipientTypes.class",
  NIVEAU: "announcements.recipientTypes.level",
};

const TYPE_KEYS: Record<AnnonceType, string> = {
  GENERAL: "announcements.announcementTypes.general",
  URGENT: "announcements.announcementTypes.urgent",
  EVENEMENT: "announcements.announcementTypes.event",
  REUNION: "announcements.announcementTypes.meeting",
};

/**
 * Une barre d'onglets de telephone tient 5 cibles au doigt, pas 7 : les
 * quatre consultes au quotidien restent visibles, le reste passe dans « Plus ».
 * Sur grand ecran, tout est affiche d'un coup.
 */
const MAIN_TABS = [
  { value: "devoirs", labelKey: "parentPortal.tabs.homework", icon: PenTool },
  { value: "notes", labelKey: "parentPortal.tabs.grades", icon: BookOpen },
  { value: "absences", labelKey: "parentPortal.tabs.absences", icon: UserX },
  { value: "emploi", labelKey: "parentPortal.tabs.schedule", icon: Clock },
] as const;

const MORE_TABS = [
  { value: "bulletin", labelKey: "parentPortal.tabs.report", icon: FileText },
  { value: "paiements", labelKey: "parentPortal.tabs.payments", icon: Wallet },
  { value: "annonces", labelKey: "parentPortal.tabs.announcements", icon: Megaphone },
] as const;

const ALL_TABS = [...MAIN_TABS, ...MORE_TABS];

/**
 * Dates et montants suivent la langue choisie : `useLanguage` fournit `lang`,
 * que chaque composant passe a ces aides.
 */
function fmtMoney(n: number | null | undefined, lang: SupportedLanguage): string {
  return `${formatNumber(n, lang)} ${CURRENCY}`;
}

function fmtDate(d: string | null | undefined, lang: SupportedLanguage): string {
  return formatDate(d, lang);
}

/** "08:30:00" → "08:30" ; renvoie "—" si l'heure est absente. */
function fmtHeure(h?: string): string {
  return h ? h.slice(0, 5) : "—";
}

function initials(child: Child): string {
  return `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`;
}

function EmptyState({
  icon: Icon,
  children,
}: {
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <div className="py-10 text-center text-muted-foreground">
      <Icon className="mx-auto mb-3 h-10 w-10" />
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/**
 * Selecteur d'enfant : pastilles defilant horizontalement, dimensionnees pour
 * le pouce. Masque quand le parent n'a qu'un seul enfant.
 */
function ChildSwitcher({
  children,
  selectedId,
  onSelect,
}: {
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (children.length < 2) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div className="flex gap-2">
        {children.map((child) => {
          const active = child.id === selectedId;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              aria-pressed={active}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                }`}
              >
                {initials(child)}
              </span>
              <span className="whitespace-nowrap font-medium">
                {child.firstName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrimestreSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-11 w-full sm:w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">{t("common.trimester1")}</SelectItem>
        <SelectItem value="2">{t("common.trimester2")}</SelectItem>
        <SelectItem value="3">{t("common.trimester3")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function NotesTab({ studentId }: { studentId: string }) {
  const { t } = useLanguage();
  const [trimestre, setTrimestre] = useState(1);
  const { data: notes = [], isLoading } = useChildNotes(studentId, trimestre);

  const noteVariant = (v: number) =>
    v >= 15 ? "default" : v >= 10 ? "secondary" : "destructive";

  return (
    <div className="space-y-4">
      <TrimestreSelect value={trimestre} onChange={setTrimestre} />

      {isLoading ? (
        <Spinner />
      ) : notes.length === 0 ? (
        <EmptyState icon={BookOpen}>{t("parentPortal.grades.empty")}</EmptyState>
      ) : (
        <>
          {/* Mobile : une carte par note — un tableau deborderait de l'ecran. */}
          <div className="space-y-2 md:hidden">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-medium">{note.examenName}</p>
                  <Badge variant={noteVariant(note.valeur)} className="shrink-0">
                    {note.valeur?.toFixed(2) ?? "-"} / 20
                  </Badge>
                </div>
                {note.observation && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {note.observation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("parentPortal.grades.exam")}</TableHead>
                  <TableHead className="text-center">{t("parentPortal.grades.grade")}</TableHead>
                  <TableHead>{t("parentPortal.grades.observation")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.examenName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={noteVariant(note.valeur)}>
                        {note.valeur?.toFixed(2) ?? "-"} / 20
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {note.observation || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function AbsencesTab({ studentId }: { studentId: string }) {
  const { t, currentLang } = useLanguage();
  const { data: absences = [], isLoading } = useChildAbsences(studentId);

  const stats = {
    total: absences.length,
    absences: absences.filter((a) => a.type === "ABSENCE").length,
    retards: absences.filter((a) => a.type === "RETARD").length,
    justifiees: absences.filter((a) => a.justifie).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: t("parentPortal.absencesTab.total"), value: stats.total, tone: "" },
          { label: t("parentPortal.absencesTab.absences"), value: stats.absences, tone: "text-red-600" },
          { label: t("parentPortal.absencesTab.late"), value: stats.retards, tone: "text-orange-600" },
          { label: t("parentPortal.absencesTab.justified"), value: stats.justifiees, tone: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : absences.length === 0 ? (
        <EmptyState icon={UserX}>{t("parentPortal.noAbsence")}</EmptyState>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {absences.slice(0, 50).map((absence) => (
              <div key={absence.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{fmtDate(absence.date, currentLang)}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={absence.type === "ABSENCE" ? "destructive" : "secondary"}
                    >
                      {absence.type}
                    </Badge>
                    <Badge
                      className={
                        absence.justifie
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {absence.justifie
                        ? t("parentPortal.absencesTab.justifiedYes")
                        : t("parentPortal.absencesTab.justifiedNo")}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {absence.seance || t("parentPortal.absencesTab.noSession")}
                  {absence.motif ? ` · ${absence.motif}` : ""}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("parentPortal.absencesTab.session")}</TableHead>
                  <TableHead>{t("parentPortal.absencesTab.isJustified")}</TableHead>
                  <TableHead>{t("parentPortal.absencesTab.reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.slice(0, 50).map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell>{fmtDate(absence.date, currentLang)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={absence.type === "ABSENCE" ? "destructive" : "secondary"}
                      >
                        {absence.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{absence.seance || "-"}</TableCell>
                    <TableCell>
                      {absence.justifie ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {t("common.yes")}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">{t("common.no")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {absence.motif || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function BulletinTab({ studentId }: { studentId: string }) {
  const { t } = useLanguage();
  const [trimestre, setTrimestre] = useState(1);
  const { data: bulletin, isLoading } = useChildBulletin(studentId, trimestre);

  return (
    <div className="space-y-4">
      <TrimestreSelect value={trimestre} onChange={setTrimestre} />

      {isLoading ? (
        <Spinner />
      ) : !bulletin ? (
        <EmptyState icon={FileText}>{t("parentPortal.report.unavailable")}</EmptyState>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              {
                label: t("parentPortal.report.generalAverage"),
                value: bulletin.moyenneGenerale?.toFixed(2) ?? "-",
                tone: "text-primary",
              },
              {
                label: t("parentPortal.report.classAverage"),
                value: bulletin.moyenneClasse?.toFixed(2) ?? "-",
                tone: "",
              },
              {
                label: `${t("parentPortal.report.rank")} / ${bulletin.totalEleves ?? "-"}`,
                value: bulletin.rang ?? "-",
                tone: "",
              },
              { label: t("common.class"), value: bulletin.classe || "-", tone: "" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border p-3 text-center">
                <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("parentPortal.report.reportOf", { name: bulletin.studentName })}
              </CardTitle>
              <CardDescription>
                {t("common.trimester")} {bulletin.trimestre} - {bulletin.niveau}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("parentPortal.report.printHint")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmploiDuTempsTab({ studentId }: { studentId: string }) {
  const { t } = useLanguage();
  const { data: emploi = [], isLoading } = useChildEmploiDuTemps(studentId);

  const byJour = emploi.reduce<Record<number, typeof emploi>>((acc, e) => {
    (acc[e.jourSemaine] ??= []).push(e);
    return acc;
  }, {});

  if (isLoading) return <Spinner />;
  if (emploi.length === 0) {
    return <EmptyState icon={Clock}>{t("parentPortal.scheduleUnavailable")}</EmptyState>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(byJour)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([jour, seances]) => (
          <div key={jour}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {JOUR_KEYS[Number(jour)] ? t(`common.days.${JOUR_KEYS[Number(jour)]}`) : jour}
            </h3>
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-3">
              {seances.map((seance) => (
                <div
                  key={seance.id}
                  className="flex items-start gap-3 rounded-xl border p-3"
                >
                  {/* Horaire en colonne fixe : la grille reste alignee. */}
                  <div className="w-14 shrink-0 text-sm font-semibold text-primary">
                    <div>{fmtHeure(seance.heureDebut)}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {fmtHeure(seance.heureFin)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {seance.moduleNom || t("parentPortal.scheduleTab.noSubject")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[seance.enseignantNom, seance.salle && `Salle ${seance.salle}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function KpiHeader({ studentId }: { studentId: string }) {
  const { t, currentLang } = useLanguage();
  const { data: notes = [] } = useChildNotes(studentId, 1);
  const { data: absences = [] } = useChildAbsences(studentId);
  const { data: paiements } = useChildPaiements(studentId);

  const moyenne =
    notes.length > 0
      ? notes.reduce((s, n) => s + (Number(n.valeur) || 0), 0) / notes.length
      : null;
  const absCount = absences.filter((a) => a.type === "ABSENCE").length;

  const kpis = [
    {
      icon: TrendingUp,
      tone: "text-emerald-600",
      value: moyenne != null ? moyenne.toFixed(2) : "—",
      label: t("parentPortal.kpi.averageT1"),
    },
    {
      icon: UserX,
      tone: "text-red-600",
      value: absCount,
      label: t("parentPortal.kpi.absences"),
    },
    {
      icon: Wallet,
      tone: "text-amber-600",
      value: paiements?.nbEnRetard ?? 0,
      label: t("parentPortal.kpi.unsettledPayments"),
    },
    {
      icon: Wallet,
      tone: "text-primary",
      value: fmtMoney(paiements?.reste, currentLang),
      label: t("parentPortal.kpi.remainingDue"),
      small: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
          <k.icon className={`mx-auto mb-1 h-5 w-5 ${k.tone}`} />
          <p className={`font-bold leading-tight ${k.small ? "text-base" : "text-xl"}`}>
            {k.value}
          </p>
          <p className="text-[11px] text-muted-foreground">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

function AnnoncesTab() {
  const { t, currentLang } = useLanguage();
  const { data: annonces = [], isLoading } = useParentAnnonces();

  if (isLoading) return <Spinner />;
  if (annonces.length === 0) {
    return (
      <EmptyState icon={Megaphone}>
        {t("announcements.parentAnnoncesEmpty")}
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {annonces.map((annonce) => (
        <Card
          key={annonce.id}
          className={annonce.type === "URGENT" ? "border-2 border-red-300" : ""}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{annonce.titre}</CardTitle>
              {annonce.type === "URGENT" && (
                <Badge className="shrink-0 bg-red-500 text-white">
                  {t(TYPE_KEYS[annonce.type])}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              {annonce.auteurName && `Par ${annonce.auteurName} - `}
              {formatDate(annonce.datePublication, currentLang, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {annonce.contenu}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={TYPE_COLORS[annonce.type]}>
                {t(TYPE_KEYS[annonce.type])}
              </Badge>
              {annonce.destinataires && (
                <Badge variant="outline" className="text-xs">
                  <Users className="me-1 h-3 w-3" />
                  {DEST_KEYS[annonce.destinataires]
                    ? t(DEST_KEYS[annonce.destinataires])
                    : annonce.destinataires}
                  {annonce.destinataires === "NIVEAU" && annonce.niveauNom && (
                    <span className="ms-1">· {annonce.niveauNom}</span>
                  )}
                </Badge>
              )}
            </div>
            {annonce.fichierUrl && (
              <a
                href={resolveFileUrl(annonce.fichierUrl)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <Download className="h-4 w-4" />
                {t("announcements.viewDocument")} ·{" "}
                {extractOriginalName(annonce.fichierUrl)}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ParentPortalPage() {
  const { t } = useLanguage();
  const { data: children = [], isLoading, isError, error } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("devoirs");
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_TABS.some((t) => t.value === tab);

  // Selection par id : l'enfant courant reste valide apres un refetch, et la
  // selection par defaut se fait sans setState pendant le rendu.
  const selectedChild =
    children.find((c) => c.id === selectedChildId) ?? children[0] ?? null;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    // Une erreur de chargement ne doit pas passer pour « aucun enfant » : le
    // parent doit voir qu'il s'agit d'une panne, pas d'un compte vide.
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-muted-foreground">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{t("parentPortal.loadError")}</p>
        <p className="text-sm">
          {error instanceof Error ? error.message : t("parentPortal.loadErrorHint")}
        </p>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-muted-foreground">
        <Users className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">{t("parentPortal.noChild")}</p>
        <p className="text-sm">{t("parentPortal.contactAdmin")}</p>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      {/* pb-24 sur mobile : degage la barre d'onglets fixe en bas. */}
      <div className="space-y-4 p-4 pb-24 sm:p-6 md:pb-6">
        {/* En-tete : l'enfant est l'information principale, pas le titre de page. */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials(selectedChild)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">
              {selectedChild.firstName} {selectedChild.lastName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {[
                selectedChild.niveau,
                selectedChild.classe,
                selectedChild.matricule && `#${selectedChild.matricule}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <ChildSwitcher
          children={children}
          selectedId={selectedChild.id}
          onSelect={setSelectedChildId}
        />

        <InstallAppBanner />

        <KpiHeader studentId={selectedChild.id} />

        {/* Desktop : onglets classiques au-dessus du contenu. */}
        <TabsList className="hidden w-full md:grid md:grid-cols-7">
          {ALL_TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="text-sm">
              <item.icon className="me-1 h-4 w-4" />
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="devoirs" className="mt-2">
          <DevoirsTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="notes" className="mt-2">
          <NotesTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="absences" className="mt-2">
          <AbsencesTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="bulletin" className="mt-2">
          <BulletinTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="emploi" className="mt-2">
          <EmploiDuTempsTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="paiements" className="mt-2">
          <PaiementsTab studentId={selectedChild.id} />
        </TabsContent>
        <TabsContent value="annonces" className="mt-2">
          <AnnoncesTab />
        </TabsContent>
      </div>

      {/* Mobile : barre d'onglets fixe en bas, comme une application native.
          pb-[env(safe-area-inset-bottom)] evite l'indicateur d'accueil iPhone. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          <TabsList className="col-span-4 grid h-auto grid-cols-4 gap-0 rounded-none bg-transparent p-0">
            {MAIN_TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="flex h-full min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-none px-0 py-2 text-[10px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <item.icon className="h-5 w-5" />
                <span className="leading-none">{t(item.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* « Plus » n'est pas un onglet : il ouvre le tiroir des onglets
              secondaires, tout en s'allumant quand l'un d'eux est actif. */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] ${
                  isMoreActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="leading-none">{t("parentPortal.more")}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
              <SheetHeader className="text-start">
                <SheetTitle>{t("parentPortal.more")}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 grid gap-1">
                {MORE_TABS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setTab(item.value);
                      setMoreOpen(false);
                    }}
                    className={`flex min-h-[52px] items-center gap-3 rounded-lg px-3 text-start text-sm ${
                      tab === item.value ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </Tabs>
  );
}
