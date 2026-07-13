import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  AlertTriangle,
  Pencil,
  Filter,
} from "lucide-react";
import { STATUTS } from "@/types/student";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useImportJob, useStartStudentsImport } from "@/hooks/useImportJob";
import {
  validateRow,
  hasBlockingErrors,
  summarizeErrors,
  type ImportRow,
  type RowErrors,
  type CellError,
  type ValidationContext,
} from "@/lib/student-import-validation";
import type { ImportJobStrategy } from "@/api/import-jobs.api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override — if omitted, the dialog uses the robust endpoint internally. */
  onImport?: (students: ImportRow[]) => void;
}

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  prénom: "prenom",
  prenom: "prenom",
  nom: "nom",
  "nom arabe": "nomAr",
  "nom_ar": "nomAr",
  nomar: "nomAr",
  "prénom arabe": "prenomAr",
  "prenom arabe": "prenomAr",
  "prenom_ar": "prenomAr",
  prenomar: "prenomAr",
  classe: "classe",
  niveau: "niveau",
  sexe: "sexe",
  "date de naissance": "dateNaissance",
  datenaissance: "dateNaissance",
  date_naissance: "dateNaissance",
  "lieu de naissance": "lieuNaissance",
  lieunaissance: "lieuNaissance",
  lieu_naissance: "lieuNaissance",
  adresse: "adresse",
  matricule: "matricule",
  email: "email",
  statut: "statut",
  "nom parent": "nomParent",
  nomparent: "nomParent",
  nom_parent: "nomParent",
  "prénom parent": "prenomParent",
  "prenom parent": "prenomParent",
  prenomparent: "prenomParent",
  prenom_parent: "prenomParent",
  "téléphone parent": "telephoneParent",
  "telephone parent": "telephoneParent",
  telephoneparent: "telephoneParent",
  tel_parent: "telephoneParent",
  "email parent": "emailParent",
  emailparent: "emailParent",
  email_parent: "emailParent",
};

function mapColumns(raw: Record<string, unknown>): Partial<ImportRow> {
  const mapped: Partial<ImportRow> = {};
  for (const [key, value] of Object.entries(raw)) {
    const normalized = key.toLowerCase().trim();
    const field = COLUMN_MAP[normalized];
    if (field && value != null) {
      mapped[field] = String(value).trim() as never;
    }
  }
  return mapped;
}

function normalizeRow(raw: Partial<ImportRow>): ImportRow {
  // We DO NOT silently coerce here — the validator will flag invalid values.
  // Defaults are only applied for fields the validator does not own.
  return {
    nom: raw.nom ?? "",
    prenom: raw.prenom ?? "",
    nomAr: raw.nomAr ?? "",
    prenomAr: raw.prenomAr ?? "",
    classe: (raw.classe ?? "").toUpperCase(),
    niveau: raw.niveau ?? "",
    sexe: (raw.sexe as ImportRow["sexe"]) ?? ("" as never),
    dateNaissance: raw.dateNaissance ?? "",
    lieuNaissance: raw.lieuNaissance ?? "",
    adresse: raw.adresse ?? "",
    matricule: raw.matricule ?? "",
    email: raw.email ?? undefined,
    statut: (raw.statut as ImportRow["statut"]) ?? "Actif",
    estBloque: false,
    nomParent: raw.nomParent ?? "",
    prenomParent: raw.prenomParent ?? "",
    telephoneParent: raw.telephoneParent ?? "",
    emailParent: raw.emailParent ?? "",
  };
}

// Columns shown in the preview table
const PREVIEW_COLS: Array<{ key: keyof ImportRow; label: string; width: number; required?: boolean }> = [
  { key: "prenom", label: "Prénom", width: 120, required: true },
  { key: "nom", label: "Nom", width: 120, required: true },
  { key: "classe", label: "Classe", width: 80, required: true },
  { key: "niveau", label: "Niveau", width: 140, required: true },
  { key: "sexe", label: "Sexe", width: 60, required: true },
  { key: "dateNaissance", label: "Date naissance", width: 130 },
  { key: "matricule", label: "Matricule", width: 110 },
  { key: "email", label: "Email", width: 160 },
  { key: "statut", label: "Statut", width: 100 },
  { key: "telephoneParent", label: "Tél. parent", width: 130 },
  { key: "emailParent", label: "Email parent", width: 160 },
];

export function ExcelImportDialog({ open, onOpenChange, onImport }: ExcelImportDialogProps) {
  const { niveaux } = useNiveaux();
  const { user } = useAuth();
  const niveauNoms = useMemo(() => niveaux.map((n) => n.nom), [niveaux]);
  const startMutation = useStartStudentsImport();

  const [step, setStep] = useState<"upload" | "preview" | "confirm" | "running" | "result">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [strategy, setStrategy] = useState<ImportJobStrategy>("SKIP");
  const [jobId, setJobId] = useState<number | null>(null);

  // Filter toggle
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Inline edit
  const [editing, setEditing] = useState<{ row: number; field: keyof ImportRow } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Polled job — drives the running/result steps
  const { data: job } = useImportJob(jobId);
  // Move to "result" step automatically when the job finishes
  if (job && (job.status === "DONE" || job.status === "FAILED") && step === "running") {
    // setState during render is intentional (keeps polling cleanly bound to step)
    // but guarded so it only fires once
    queueMicrotask(() => setStep("result"));
  }

  // Re-validate every time rows change (covers initial parse + inline edits)
  const errorsByRow = useMemo<RowErrors[]>(() => {
    const ctx: ValidationContext = {
      niveauNoms,
      matriculesSeen: new Set(),
      emailsSeen: new Set(),
      parentEmailsSeen: new Set(),
    };
    return rows.map((r) => validateRow(r, ctx));
  }, [rows, niveauNoms]);

  const stats = useMemo(() => summarizeErrors(errorsByRow), [errorsByRow]);
  const hasAnyBlocker = stats.blocking > 0;

  const reset = () => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setShowOnlyErrors(false);
    setEditing(null);
    setStrategy("SKIP");
    setJobId(null);
  };

  const downloadTemplate = () => {
    const headers = [
      "Nom", "Prénom", "Nom arabe", "Prénom arabe",
      "Classe", "Niveau", "Sexe", "Date de naissance",
      "Lieu de naissance", "Adresse", "Matricule", "Email", "Statut",
      "Nom parent", "Prénom parent", "Téléphone parent", "Email parent",
    ];
    const example = [
      "Ben Salah", "Amine", "بن صالح", "أمين",
      "1A", niveauNoms[0] ?? "1ère année", "M", "2015-09-01",
      "Tunis", "Avenue Habib Bourguiba", "M2025001", "amine@example.com", "Actif",
      "Ben Salah", "Mohamed", "20 100 100", "parent@example.com",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));

    const refRows: (string | null)[][] = [["Niveaux valides", "Sexes valides", "Statuts valides"]];
    const niveauxList = niveauNoms.length > 0 ? niveauNoms : ["1ère année", "2ème année"];
    const sexesList = ["M", "F"];
    const maxLen = Math.max(niveauxList.length, sexesList.length, STATUTS.length);
    for (let i = 0; i < maxLen; i++) {
      refRows.push([niveauxList[i] ?? "", sexesList[i] ?? "", STATUTS[i] ?? ""]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet(refRows);
    wsRef["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Élèves");
    XLSX.utils.book_append_sheet(wb, wsRef, "Valeurs valides");
    XLSX.writeFile(wb, "modele-eleves.xlsx");
  };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]);
      const parsed = rawRows.map((r) => normalizeRow(mapColumns(r)));
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const updateCell = (rowIdx: number, field: keyof ImportRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      const updated = { ...next[rowIdx] } as ImportRow;
      // sexe is the only union-typed field that needs special handling
      if (field === "sexe") {
        updated.sexe = value as ImportRow["sexe"];
      } else if (field === "statut") {
        updated.statut = value as ImportRow["statut"];
      } else if (field === "estBloque") {
        // not editable in preview
      } else {
        (updated[field] as unknown as string) = value;
      }
      next[rowIdx] = updated;
      return next;
    });
  };

  const startEdit = (rowIdx: number, field: keyof ImportRow) => {
    setEditing({ row: rowIdx, field });
    const v = rows[rowIdx][field];
    setEditingValue(v == null ? "" : String(v));
  };

  const commitEdit = () => {
    if (!editing) return;
    updateCell(editing.row, editing.field, editingValue);
    setEditing(null);
  };

  const removeRow = (rowIdx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  const cleanRows = useMemo(
    () => rows.filter((_, i) => !hasBlockingErrors(errorsByRow[i])),
    [rows, errorsByRow]
  );

  const goToConfirm = () => {
    if (cleanRows.length === 0) return;
    if (onImport) {
      // Legacy parent handler — bypass the wizard entirely
      onImport(cleanRows);
      onOpenChange(false);
      reset();
      return;
    }
    setStep("confirm");
  };

  const launchImport = () => {
    setStep("running");
    startMutation.mutate(
      {
        rows: cleanRows,
        strategy,
        createdBy: user ? `${user.firstName} ${user.lastName} <${user.email}>` : undefined,
      },
      {
        onSuccess: (createdJob) => {
          setJobId(createdJob.id);
          notify.success("Import lancé en arrière-plan");
        },
        onError: (err) => {
          notify.error(err instanceof Error ? err.message : "Erreur de lancement");
          setStep("confirm");
        },
      }
    );
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  // Visible rows after the "errors only" toggle
  const visibleRowIndexes = useMemo(() => {
    if (!showOnlyErrors) return rows.map((_, i) => i);
    return rows
      .map((_, i) => i)
      .filter((i) => Object.keys(errorsByRow[i] ?? {}).length > 0);
  }, [rows, errorsByRow, showOnlyErrors]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Importer des élèves depuis Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Uploadez un fichier Excel (.xlsx, .xls) — le contenu sera validé avant import."}
            {step === "preview" && `${rows.length} ligne(s) analysée(s) · cliquez sur une cellule rouge pour la corriger.`}
            {step === "confirm" && "Choisissez la stratégie en cas de doublon, puis confirmez."}
            {step === "running" && "L'import s'exécute en arrière-plan."}
            {step === "result" && "Bilan de l'import."}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 -mt-2 mb-1">
          {(["upload", "preview", "confirm", "running", "result"] as const).map((s, i, arr) => {
            const currentIdx = arr.indexOf(step);
            const passed = i < currentIdx;
            const active = i === currentIdx;
            const labels = { upload: "1. Fichier", preview: "2. Vérif.", confirm: "3. Confirm.", running: "4. Import", result: "5. Bilan" };
            return (
              <div key={s} className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : passed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {labels[s]}
                </span>
                {i < arr.length - 1 && <span className="text-muted-foreground/40">›</span>}
              </div>
            );
          })}
        </div>

        {/* ── STEP UPLOAD ──────────────────────────────────── */}
        {step === "upload" && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground mb-1">Glissez-déposez votre fichier ici</p>
            <p className="text-sm text-muted-foreground mb-4">ou</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <label>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" />
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <span>Parcourir les fichiers</span>
                </Button>
              </label>
              <Button type="button" variant="secondary" onClick={downloadTemplate} className="gap-1.5">
                <Download className="h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Colonnes attendues : Nom, Prénom, Nom arabe, Prénom arabe, Classe, Niveau, Sexe, Date de naissance, Lieu de naissance, Adresse, Matricule, Email, Statut, Nom parent, Prénom parent, Téléphone parent, Email parent
            </p>
          </div>
        )}

        {/* ── STEP PREVIEW ─────────────────────────────────── */}
        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            {/* Stats bar */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {stats.clean} valide(s)
              </span>
              {stats.warning > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.warning} avertissement(s)
                </span>
              )}
              {stats.blocking > 0 && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {stats.blocking} bloquant(s)
                </span>
              )}
              <span className="text-muted-foreground ms-auto text-xs truncate max-w-[40%]">
                {fileName}
              </span>
              <Button
                variant={showOnlyErrors ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyErrors((v) => !v)}
                className="gap-1.5 h-7"
              >
                <Filter className="h-3.5 w-3.5" />
                {showOnlyErrors ? "Tout afficher" : "Erreurs uniquement"}
              </Button>
            </div>

            {hasAnyBlocker && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>{stats.blocking}</strong> ligne(s) seront ignorée(s) à cause d'erreurs bloquantes.
                  Cliquez sur une cellule rouge pour la corriger, ou sur la croix pour supprimer la ligne.
                </div>
              </div>
            )}

            {/* Editable preview table */}
            <TooltipProvider delayDuration={150}>
              <div className="flex-1 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2 text-start font-semibold text-muted-foreground w-10">#</th>
                      {PREVIEW_COLS.map((c) => (
                        <th
                          key={String(c.key)}
                          className="py-2 px-2 text-start font-semibold text-muted-foreground"
                          style={{ minWidth: c.width }}
                        >
                          {c.label}
                          {c.required && <span className="text-red-500 ms-0.5">*</span>}
                        </th>
                      ))}
                      <th className="py-2 px-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRowIndexes.length === 0 ? (
                      <tr>
                        <td colSpan={PREVIEW_COLS.length + 2} className="py-8 text-center text-muted-foreground">
                          {showOnlyErrors ? "Aucune ligne en erreur 🎉" : "Aucune donnée"}
                        </td>
                      </tr>
                    ) : (
                      visibleRowIndexes.map((rowIdx) => {
                        const row = rows[rowIdx];
                        const errs = errorsByRow[rowIdx];
                        const blocking = hasBlockingErrors(errs);
                        return (
                          <tr
                            key={rowIdx}
                            className={`border-t border-border/50 hover:bg-muted/20 ${
                              blocking ? "bg-red-50/40" : ""
                            }`}
                          >
                            <td className="py-1 px-2 text-muted-foreground tabular-nums">{rowIdx + 1}</td>
                            {PREVIEW_COLS.map((c) => (
                              <Cell
                                key={String(c.key)}
                                value={row[c.key] as string | undefined}
                                error={errs[c.key]}
                                isEditing={editing?.row === rowIdx && editing.field === c.key}
                                editingValue={editingValue}
                                onEditValueChange={setEditingValue}
                                onCommit={commitEdit}
                                onCancel={() => setEditing(null)}
                                onStartEdit={() => startEdit(rowIdx, c.key)}
                              />
                            ))}
                            <td className="py-1 px-2">
                              <button
                                onClick={() => removeRow(rowIdx)}
                                className="text-muted-foreground hover:text-red-600 transition-colors"
                                title="Supprimer la ligne"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* ── STEP CONFIRM ─────────────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Récapitulatif de l'import
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📄 Fichier : <strong className="text-foreground">{fileName}</strong></li>
                <li>✅ {cleanRows.length} ligne(s) valides à importer</li>
                {stats.warning > 0 && (
                  <li className="text-amber-700">⚠ {stats.warning} ligne(s) avec avertissement (importées quand même)</li>
                )}
                {stats.blocking > 0 && (
                  <li className="text-red-700">❌ {stats.blocking} ligne(s) bloquantes (ignorées)</li>
                )}
              </ul>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Si un email existe déjà côté serveur, que faire ?
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {(["SKIP", "UPDATE"] as ImportJobStrategy[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrategy(s)}
                    className={`text-start rounded-lg border-2 p-3 transition-colors ${
                      strategy === s
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        strategy === s ? "border-primary bg-primary" : "border-muted-foreground"
                      }`} />
                      <span className="font-semibold text-sm">
                        {s === "SKIP" ? "Ignorer (recommandé)" : "Écraser"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ms-6">
                      {s === "SKIP"
                        ? "Garde l'élève existant, n'importe pas la ligne. Aucun risque de perte de données."
                        : "Met à jour l'élève existant avec les valeurs du fichier. ⚠ Attention : remplace les données actuelles."}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP RUNNING ─────────────────────────────────── */}
        {step === "running" && (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="font-semibold">Import en cours…</span>
            </div>
            {job && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Statut : <strong className="text-foreground">{job.status}</strong></span>
                  <span>{job.processed} / {job.totalRows}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${job.totalRows > 0 ? (job.processed / job.totalRows) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Vous pouvez fermer cette fenêtre — l'import continue en arrière-plan.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP RESULT ──────────────────────────────────── */}
        {step === "result" && job && (
          <div className="flex-1 overflow-auto space-y-4">
            <div
              className={`rounded-lg border p-4 ${
                job.status === "DONE"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  job.status === "DONE" ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {job.status === "DONE" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">
                  {job.status === "DONE"
                    ? `${job.successCount} élève(s) importé(s) avec succès`
                    : "Import échoué"}
                </span>
              </div>
              <div className="text-xs mt-1 ms-7 opacity-80">
                {job.skippedCount > 0 && <span>{job.skippedCount} ignoré(s) (déjà existant). </span>}
                {job.errorCount > 0 && <span>{job.errorCount} en échec. </span>}
                <span className="block mt-0.5">Job #{job.id} — {job.createdBy ?? "anonyme"}</span>
              </div>
            </div>

            {job.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Détail des erreurs ({job.errors.length})
                </p>
                <div className="max-h-[300px] overflow-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2 text-start font-semibold text-muted-foreground w-12">Ligne</th>
                        <th className="py-1.5 px-2 text-start font-semibold text-muted-foreground w-24">Type</th>
                        <th className="py-1.5 px-2 text-start font-semibold text-muted-foreground w-24">Champ</th>
                        <th className="py-1.5 px-2 text-start font-semibold text-muted-foreground">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.errors.map((e, i) => (
                        <tr key={i} className="border-t border-border/40">
                          <td className="py-1 px-2 tabular-nums">{e.row}</td>
                          <td className="py-1 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                e.code === "DUPLICATE"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {e.code}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-muted-foreground">{e.field ?? "—"}</td>
                          <td className="py-1 px-2">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          {step === "preview" && (
            <Button variant="outline" onClick={reset} className="me-auto gap-1.5">
              <X className="h-3.5 w-3.5" />
              Changer de fichier
            </Button>
          )}
          {step === "confirm" && (
            <Button variant="outline" onClick={() => setStep("preview")} className="me-auto">
              ← Retour à la prévisualisation
            </Button>
          )}
          {(step === "upload" || step === "preview" || step === "confirm") && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
          )}
          {step === "preview" && (
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={goToConfirm}
              disabled={cleanRows.length === 0}
              title={
                cleanRows.length === 0
                  ? "Aucune ligne importable"
                  : `Continuer avec ${cleanRows.length} élève(s)`
              }
            >
              Continuer ({cleanRows.length})
            </Button>
          )}
          {step === "confirm" && (
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={launchImport}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Lancement…" : "Lancer l'import"}
            </Button>
          )}
          {step === "running" && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Fermer (l'import continue)
            </Button>
          )}
          {step === "result" && (
            <>
              <Button variant="outline" onClick={reset}>
                Importer un autre fichier
              </Button>
              <Button onClick={() => handleClose(false)}>
                Fermer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Cell sub-component (render + inline edit + tooltip) ──── */

interface CellProps {
  value: string | undefined;
  error: CellError | undefined;
  isEditing: boolean;
  editingValue: string;
  onEditValueChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
}

function Cell({
  value, error, isEditing, editingValue, onEditValueChange, onCommit, onCancel, onStartEdit,
}: CellProps) {
  const display = value ?? "";
  const tone = error
    ? error.severity === "blocker"
      ? "bg-red-100 text-red-900 hover:bg-red-200"
      : "bg-amber-50 text-amber-900 hover:bg-amber-100"
    : "hover:bg-muted/50";

  if (isEditing) {
    return (
      <td className="p-0">
        <Input
          autoFocus
          value={editingValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommit();
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-xs border-2 border-primary rounded-none"
        />
      </td>
    );
  }

  const cellInner = (
    <button
      type="button"
      onClick={onStartEdit}
      className={`block w-full h-full py-1 px-2 text-start truncate cursor-pointer transition-colors ${tone}`}
    >
      <span className="inline-flex items-center gap-1">
        {error && (
          <AlertCircle
            className={`h-3 w-3 shrink-0 ${error.severity === "blocker" ? "text-red-600" : "text-amber-600"}`}
          />
        )}
        <span className="truncate">{display || <span className="opacity-40 italic">vide</span>}</span>
        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 ms-auto" />
      </span>
    </button>
  );

  return (
    <td className="p-0 group">
      {error ? (
        <Tooltip>
          <TooltipTrigger asChild>{cellInner}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <span className={error.severity === "blocker" ? "text-red-300" : "text-amber-300"}>
              {error.severity === "blocker" ? "❌ Bloquant" : "⚠ Avertissement"}
            </span>
            <p className="mt-0.5">{error.message}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        cellInner
      )}
    </td>
  );
}
