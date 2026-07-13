import { useState } from "react";
import {
  Loader2,
  Users,
  BookOpen,
  UserX,
  FileText,
  Clock,
  GraduationCap,
  Receipt,
  TrendingUp,
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
} from "@/hooks/useParentPortal";
import { useFacturesByEleve } from "@/hooks/useFactures";
import type { Child } from "@/types/notification";
import { useLanguage } from "@/hooks/useLanguage";
import { CURRENCY } from "@/config/currency";

const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function ChildSelector({
  children,
  selected,
  onSelect,
}: {
  children: Child[];
  selected: Child | null;
  onSelect: (child: Child) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => (
        <Card
          key={child.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selected?.id === child.id
              ? "border-primary border-2 bg-primary/5"
              : "hover:border-primary/50"
          }`}
          onClick={() => onSelect(child)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {child.firstName.charAt(0)}
                {child.lastName.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-base">
                  {child.firstName} {child.lastName}
                </CardTitle>
                <CardDescription className="text-xs">
                  {child.matricule && `#${child.matricule} - `}
                  {child.niveau || ""}
                  {child.classe ? ` / ${child.classe}` : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function NotesTab({ studentId, classeId }: { studentId: string; classeId: string }) {
  const [trimestre, setTrimestre] = useState(1);
  const { data: notes = [], isLoading } = useChildNotes(studentId, trimestre);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={String(trimestre)}
          onValueChange={(v) => setTrimestre(Number(v))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Trimestre 1</SelectItem>
            <SelectItem value="2">Trimestre 2</SelectItem>
            <SelectItem value="3">Trimestre 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-10 w-10" />
          <p>Aucune note pour ce trimestre</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Examen</TableHead>
              <TableHead className="text-center">Note</TableHead>
              <TableHead>Observation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.examenName}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      note.valeur >= 15
                        ? "default"
                        : note.valeur >= 10
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {note.valeur?.toFixed(2) ?? "-"} / 20
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {note.observation || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function AbsencesTab({ studentId }: { studentId: string }) {
  const { data: absences = [], isLoading } = useChildAbsences(studentId);

  const stats = {
    total: absences.length,
    absences: absences.filter((a) => a.type === "ABSENCE").length,
    retards: absences.filter((a) => a.type === "RETARD").length,
    justifiees: absences.filter((a) => a.justifie).length,
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absences}</p>
            <p className="text-xs text-muted-foreground">Absences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.retards}</p>
            <p className="text-xs text-muted-foreground">Retards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.justifiees}</p>
            <p className="text-xs text-muted-foreground">Justifiees</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : absences.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <UserX className="mx-auto mb-3 h-10 w-10" />
          <p>Aucune absence enregistree</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Seance</TableHead>
              <TableHead>Justifiee</TableHead>
              <TableHead>Motif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.slice(0, 50).map((absence) => (
              <TableRow key={absence.id}>
                <TableCell>
                  {new Date(absence.date).toLocaleDateString("fr-FR")}
                </TableCell>
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
                    <Badge className="bg-emerald-100 text-emerald-700">Oui</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">Non</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {absence.motif || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function BulletinTab({
  studentId,
  classeId,
}: {
  studentId: string;
  classeId: string;
}) {
  const [trimestre, setTrimestre] = useState(1);
  const { data: bulletin, isLoading } = useChildBulletin(
    studentId,
    classeId,
    trimestre
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={String(trimestre)}
          onValueChange={(v) => setTrimestre(Number(v))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Trimestre 1</SelectItem>
            <SelectItem value="2">Trimestre 2</SelectItem>
            <SelectItem value="3">Trimestre 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !bulletin ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto mb-3 h-10 w-10" />
          <p>Bulletin non disponible pour ce trimestre</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">
                  {bulletin.moyenneGenerale?.toFixed(2) ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">Moyenne generale</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">
                  {bulletin.moyenneClasse?.toFixed(2) ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">Moyenne classe</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {bulletin.rang ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rang / {bulletin.totalEleves ?? "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{bulletin.classe || "-"}</p>
                <p className="text-xs text-muted-foreground">Classe</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Bulletin de {bulletin.studentName}
              </CardTitle>
              <CardDescription>
                Trimestre {bulletin.trimestre} - {bulletin.niveau}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les details complets du bulletin sont disponibles dans la version imprimable.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmploiDuTempsTab({ studentId }: { studentId: string }) {
  const { data: emploi = [], isLoading } = useChildEmploiDuTemps(studentId);

  // Group by jour
  const byJour = emploi.reduce<Record<number, typeof emploi>>((acc, e) => {
    if (!acc[e.jourSemaine]) acc[e.jourSemaine] = [];
    acc[e.jourSemaine].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : emploi.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="mx-auto mb-3 h-10 w-10" />
          <p>Emploi du temps non disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byJour)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([jour, creneaux]) => (
              <Card key={jour}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {JOURS[Number(jour)] || `Jour ${jour}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {creneaux
                      .sort((a, b) => a.creneauId - b.creneauId)
                      .map((creneau) => (
                        <div
                          key={creneau.id}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="font-medium">
                            Creneau #{creneau.creneauId}
                          </p>
                          {creneau.salle && (
                            <p className="text-muted-foreground">
                              Salle: {creneau.salle}
                            </p>
                          )}
                          {creneau.moduleId && (
                            <p className="text-muted-foreground">
                              Module #{creneau.moduleId}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

function fmtMoney(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + ` ${CURRENCY}`;
}

function KpiHeader({ studentId }: { studentId: string }) {
  const { data: notes = [] } = useChildNotes(studentId, 1);
  const { data: absences = [] } = useChildAbsences(studentId);
  const { data: factures = [] } = useFacturesByEleve(studentId);

  const moyenne = notes.length > 0
    ? notes.reduce((s, n) => s + (Number(n.valeur) || 0), 0) / notes.length
    : null;
  const absCount = absences.filter((a) => a.type === "ABSENCE").length;
  const impayes = factures.filter((f) => f.statut === "NON_PAYEE" || f.statut === "PARTIELLEMENT_PAYEE");
  const totalImpaye = impayes.reduce((s, f) => s + (Number(f.montantNet) || Number(f.montantTotal) || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-xl font-bold">{moyenne != null ? moyenne.toFixed(2) : "—"}</p>
          <p className="text-[11px] text-muted-foreground">Moyenne T1</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <UserX className="h-5 w-5 mx-auto mb-1 text-red-600" />
          <p className="text-xl font-bold">{absCount}</p>
          <p className="text-[11px] text-muted-foreground">Absences</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <Receipt className="h-5 w-5 mx-auto mb-1 text-amber-600" />
          <p className="text-xl font-bold">{impayes.length}</p>
          <p className="text-[11px] text-muted-foreground">Factures impayées</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <Receipt className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-base font-bold leading-tight">{fmtMoney(totalImpaye)}</p>
          <p className="text-[11px] text-muted-foreground">Restant à payer</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FacturesTab({ studentId }: { studentId: string }) {
  const { data: factures = [], isLoading } = useFacturesByEleve(studentId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (factures.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Receipt className="mx-auto mb-3 h-10 w-10" />
        <p>Aucune facture émise.</p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Émise le</TableHead>
          <TableHead>Échéance</TableHead>
          <TableHead className="text-end">Montant</TableHead>
          <TableHead className="text-center">Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {factures.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="font-mono text-xs">{f.numero}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {f.dateEmission ? new Date(f.dateEmission).toLocaleDateString("fr-FR") : "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString("fr-FR") : "—"}
            </TableCell>
            <TableCell className="text-end font-medium">
              {fmtMoney(f.montantNet ?? f.montantTotal)}
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={
                  f.statut === "PAYEE"
                    ? "default"
                    : f.statut === "ANNULEE"
                    ? "secondary"
                    : "destructive"
                }
              >
                {f.statut === "PAYEE"
                  ? "Payée"
                  : f.statut === "PARTIELLEMENT_PAYEE"
                  ? "Partielle"
                  : f.statut === "ANNULEE"
                  ? "Annulée"
                  : "Impayée"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ParentPortalPage() {
  const { t } = useLanguage();
  const { data: children = [], isLoading } = useChildren();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Auto-select first child
  if (!selectedChild && children.length > 0) {
    setSelectedChild(children[0]);
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const classeId = selectedChild?.classe ? Number(selectedChild.classe) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          {t("nav.parentPortal")}
        </h1>
        <p className="text-muted-foreground">
          Suivez la scolarite de vos enfants
        </p>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">{t("parentPortal.noChild")}</p>
          <p className="text-sm">
            Contactez l'administration pour lier votre compte a vos enfants.
          </p>
        </div>
      ) : (
        <>
          {/* Children selector */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("parentPortal.myChildren")}
            </h2>
            <ChildSelector
              children={children}
              selected={selectedChild}
              onSelect={setSelectedChild}
            />
          </div>

          {/* KPI summary for the selected child */}
          {selectedChild && <KpiHeader studentId={selectedChild.id} />}

          {/* Content tabs */}
          {selectedChild && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedChild.firstName} {selectedChild.lastName}
                </CardTitle>
                <CardDescription>
                  {selectedChild.niveau || ""}
                  {selectedChild.classe ? ` - Classe ${selectedChild.classe}` : ""}
                  {selectedChild.matricule ? ` - #${selectedChild.matricule}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="notes" className="text-xs sm:text-sm">
                      <BookOpen className="me-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="absences" className="text-xs sm:text-sm">
                      <UserX className="me-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Absences
                    </TabsTrigger>
                    <TabsTrigger value="bulletin" className="text-xs sm:text-sm">
                      <FileText className="me-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Bulletin
                    </TabsTrigger>
                    <TabsTrigger value="emploi" className="text-xs sm:text-sm">
                      <Clock className="me-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Emploi
                    </TabsTrigger>
                    <TabsTrigger value="factures" className="text-xs sm:text-sm">
                      <Receipt className="me-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Factures
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="notes" className="mt-4">
                    <NotesTab
                      studentId={selectedChild.id}
                      classeId={classeId}
                    />
                  </TabsContent>

                  <TabsContent value="absences" className="mt-4">
                    <AbsencesTab studentId={selectedChild.id} />
                  </TabsContent>

                  <TabsContent value="bulletin" className="mt-4">
                    <BulletinTab
                      studentId={selectedChild.id}
                      classeId={classeId}
                    />
                  </TabsContent>

                  <TabsContent value="emploi" className="mt-4">
                    <EmploiDuTempsTab studentId={selectedChild.id} />
                  </TabsContent>

                  <TabsContent value="factures" className="mt-4">
                    <FacturesTab studentId={selectedChild.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
