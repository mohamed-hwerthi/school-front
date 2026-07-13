import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  GraduationCap,
  School,
  Eye,
  Edit,
  Download,
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { useCarnetSelection } from "./CarnetSelectionContext";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import { useExamensRaw } from "@/hooks/useExamens";
import { notesApi } from "@/api/notes.api";
import type { ExamenDTO } from "@/api/examens.api";

type TrimestreStatus = "empty" | "partial" | "complete" | "none";

interface TrimestreStat {
  trimestre: 1 | 2 | 3;
  status: TrimestreStatus;
  nbNotes: number;
  nbEleves: number;
  examenIds: string[];
}

interface ModuleRow {
  id: string;
  name: string;
  domaineName: string | null;
  perTrimestre: Record<1 | 2 | 3, TrimestreStat>;
  totalNotes: number;
  totalExpected: number;
}

function computeStatus(nbNotes: number, nbEleves: number): TrimestreStatus {
  if (nbEleves === 0) return "none";
  if (nbNotes === 0) return "empty";
  if (nbNotes >= nbEleves) return "complete";
  return "partial";
}

function StatusBadge({ stat }: { stat: TrimestreStat }) {
  if (stat.status === "none") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
        <Circle className="h-3 w-3" />
        —
      </span>
    );
  }
  if (stat.status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        {stat.nbNotes}/{stat.nbEleves}
      </span>
    );
  }
  if (stat.status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        {stat.nbNotes}/{stat.nbEleves}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
      <Circle className="h-3 w-3" />
      0/{stat.nbEleves}
    </span>
  );
}

export default function ApercuTab() {
  const { niveaux } = useNiveaux();
  const {
    niveauId,
    setNiveauId,
    classeId,
    setClasseId,
    trimestre,
    setTrimestre,
    setModuleId,
    setExamenId,
    goToTab,
  } = useCarnetSelection();
  // Si l'utilisateur n'a pas encore touché au sélecteur trimestre du Carnet,
  // le contexte le préselectionne sur la valeur courante ; ici on retombe
  // sur T1 si vraiment rien n'est défini.
  const activeTrim = (trimestre === 1 || trimestre === 2 || trimestre === 3
    ? trimestre
    : 1) as 1 | 2 | 3;

  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: modules = [], isLoading: modulesLoading } = useModules(
    niveauId || undefined
  );
  const hasClasse = !!classeId;
  const { data: examens = [], isLoading: examensLoading } = useExamensRaw(
    undefined,
    classeId || undefined,
    undefined,
    hasClasse
  );

  const [search, setSearch] = useState("");
  const [version, setVersion] = useState<"etatique" | "privee">("etatique");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const selectedClasse = classes.find((c) => c.id === classeId);

  const rows: ModuleRow[] = useMemo(() => {
    return modules
      .filter((m) =>
        version === "etatique" ? m.versionEtatique : m.versionPrivee
      )
      .filter((m) =>
        search.trim() === ""
          ? true
          : m.name.toLowerCase().includes(search.toLowerCase())
      )
      .map((m) => {
        const ex = examens.filter((e) =>
          e.moduleId === m.id &&
          (version === "etatique" ? e.versionEtatique : e.versionPrivee)
        );
        const buildStat = (trim: 1 | 2 | 3): TrimestreStat => {
          const list = ex.filter((e) => e.trimestre === trim);
          const nbNotes = list.reduce((s, e) => s + e.nbNotes, 0);
          // nbEleves est le même pour tous les examens d'une même classe ;
          // on prend le max pour éviter d'additionner les doublons.
          const nbEleves = list.reduce((s, e) => Math.max(s, e.nbEleves), 0);
          return {
            trimestre: trim,
            status: list.length === 0 ? "none" : computeStatus(nbNotes, nbEleves),
            nbNotes,
            nbEleves,
            examenIds: list.map((e) => e.id),
          };
        };
        const perTrimestre = {
          1: buildStat(1),
          2: buildStat(2),
          3: buildStat(3),
        } as Record<1 | 2 | 3, TrimestreStat>;
        const totalNotes = perTrimestre[1].nbNotes + perTrimestre[2].nbNotes + perTrimestre[3].nbNotes;
        const totalExpected = perTrimestre[1].nbEleves + perTrimestre[2].nbEleves + perTrimestre[3].nbEleves;
        const displayName =
          version === "privee" && m.nameVp && m.nameVp.trim() !== ""
            ? m.nameVp
            : m.name;
        return {
          id: m.id,
          name: displayName,
          domaineName: m.domaineName,
          perTrimestre,
          totalNotes,
          totalExpected,
        };
      });
  }, [modules, examens, search, version]);

  const handleEdit = (row: ModuleRow) => {
    const hasExamen = (t: 1 | 2 | 3) => row.perTrimestre[t].examenIds.length > 0;
    // Priorité 1 : le trimestre actuellement sélectionné dans le filtre
    // (généralement le trimestre courant) s'il a un examen pour cette matière.
    // Sinon on tombe sur le premier trimestre incomplet ayant un examen.
    const targetTrim: 1 | 2 | 3 = hasExamen(activeTrim)
      ? activeTrim
      : (([1, 2, 3] as const).find(
          (t) =>
            hasExamen(t) &&
            (row.perTrimestre[t].status === "empty" ||
              row.perTrimestre[t].status === "partial")
        ) ?? ([1, 2, 3] as const).find(hasExamen) ?? 1);
    const examenIds = row.perTrimestre[targetTrim].examenIds;
    setModuleId(row.id);
    setTrimestre(targetTrim);
    // setModuleId/setTrimestre vident examenId — on l'écrase après pour
    // ouvrir la grille de saisie directement sur le bon examen.
    if (examenIds.length > 0) {
      setExamenId(examenIds[0]);
    }
    goToTab("notes");
  };

  const handleView = (row: ModuleRow) => {
    setModuleId(row.id);
    goToTab("moyennes");
  };

  const handleDownload = async (row: ModuleRow, moduleExamens: ExamenDTO[]) => {
    if (!selectedClasse) {
      notify.error("Aucune classe sélectionnée");
      return;
    }
    setDownloadingId(row.id);
    try {
      // Charge les notes de chaque examen (peut faire plusieurs appels en parallèle)
      const allNotes = await Promise.all(
        moduleExamens.map((e) =>
          notesApi.getByExamen(e.id, e.trimestre).then((notes) =>
            notes.map((n) => ({
              ...n,
              examenName: e.name,
              trimestre: e.trimestre,
            }))
          )
        )
      );
      const flat = allNotes.flat();

      const wb = XLSX.utils.book_new();

      // Onglet récapitulatif
      const summary = [
        ["Matière", row.name],
        ["Classe", selectedClasse.fullName],
        ["Examens", moduleExamens.length],
        ["Notes saisies", row.totalNotes],
        ["Notes attendues", row.totalExpected],
        [],
        ["Trimestre", "Saisies", "Attendues", "Statut"],
        ...(([1, 2, 3] as const).map((t) => {
          const s = row.perTrimestre[t];
          return [
            `T${t}`,
            s.nbNotes,
            s.nbEleves,
            s.status === "complete"
              ? "Complète"
              : s.status === "partial"
              ? "Partielle"
              : s.status === "empty"
              ? "Vide"
              : "—",
          ];
        })),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Récapitulatif");

      // Un onglet par trimestre
      ([1, 2, 3] as const).forEach((t) => {
        const rowsT = flat.filter((n) => n.trimestre === t);
        if (rowsT.length === 0) return;
        const data = [
          ["Élève", "Examen", "Note /20", "Statut", "Observation"],
          ...rowsT.map((n) => [
            n.studentName,
            n.examenName,
            n.valeur ?? "",
            n.statut,
            n.observation ?? "",
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, `Trimestre ${t}`);
      });

      const safeName = row.name.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40);
      const fileName = `notes_${safeName}_${selectedClasse.fullName}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify.success(`Export téléchargé : ${fileName}`);
    } catch {
      notify.error("Erreur lors de l'export Excel");
    } finally {
      setDownloadingId(null);
    }
  };

  const loading = modulesLoading || (hasClasse && examensLoading);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <Select value={niveauId || ""} onValueChange={(v) => setNiveauId(v)}>
          <SelectTrigger className="w-[180px]">
            <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            {niveaux.map((n) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={classeId || ""}
          onValueChange={(v) => setClasseId(v)}
          disabled={!niveauId}
        >
          <SelectTrigger className="w-[160px]">
            <School className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(activeTrim)}
          onValueChange={(v) => setTrimestre(Number(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Trimestre 1</SelectItem>
            <SelectItem value="2">Trimestre 2</SelectItem>
            <SelectItem value="3">Trimestre 3</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={version}
          onValueChange={(v) => setVersion(v as "etatique" | "privee")}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="etatique">Version Étatique</SelectItem>
            <SelectItem value="privee">Version Privée</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Rechercher une matière..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[280px]"
        />
      </motion.div>

      {/* Empty state */}
      {!hasClasse && (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            Choisissez un niveau et une classe pour voir l'aperçu des matières
          </p>
        </div>
      )}

      {/* Loading */}
      {hasClasse && loading && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/50 bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Table */}
      {hasClasse && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {rows.length} matière(s) {selectedClasse ? `· ${selectedClasse.fullName}` : ""} · Trimestre {activeTrim} · {version === "etatique" ? "Étatique" : "Privée"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                    Matière
                  </th>
                  <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                    Domaine
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">Statut T{activeTrim}</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground">Progression T{activeTrim}</th>
                  <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune matière</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const moduleExamens = examens.filter((e) => e.moduleId === row.id);
                    const trimStat = row.perTrimestre[activeTrim];
                    const pct = trimStat.nbEleves > 0
                      ? Math.round((trimStat.nbNotes / trimStat.nbEleves) * 100)
                      : 0;
                    return (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-3 px-4 font-medium text-foreground">{row.name}</td>
                        <td className="py-3 px-4">
                          {row.domaineName ? (
                            <Badge variant="outline" className="text-xs">{row.domaineName}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center"><StatusBadge stat={trimStat} /></td>
                        <td className="py-3 px-4 text-center">
                          <div
                            className="inline-flex flex-col items-center gap-1"
                            title={`${trimStat.nbNotes} notes saisies sur ${trimStat.nbEleves} attendues pour le trimestre ${activeTrim}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium tabular-nums">
                                {pct}%
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {trimStat.nbNotes}/{trimStat.nbEleves} notes
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Voir les moyennes"
                              onClick={() => handleView(row)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Éditer les notes"
                              onClick={() => handleEdit(row)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Télécharger en Excel"
                              disabled={row.totalNotes === 0 || downloadingId === row.id}
                              onClick={() => handleDownload(row, moduleExamens)}
                            >
                              {downloadingId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
