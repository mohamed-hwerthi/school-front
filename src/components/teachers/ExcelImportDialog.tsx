import { useCallback, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Trash2,
} from "lucide-react";
import type { Teacher } from "@/types/teacher";
import { SPECIALITES, STATUTS_ENSEIGNANT } from "@/types/teacher";

type ImportRow = Omit<Teacher, "id" | "dateEmbauche">;
type FieldKey = keyof ImportRow;
type CellErrors = Partial<Record<FieldKey, string>>;
type RawRow = { [K in FieldKey]: string };

interface EditableRow {
  id: string;
  raw: RawRow;
  errors: CellErrors;
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (teachers: ImportRow[]) => void;
}

const COLUMN_MAP: Record<string, FieldKey> = {
  prénom: "prenom",
  prenom: "prenom",
  nom: "nom",
  spécialité: "specialite",
  specialite: "specialite",
  matière: "specialite",
  matiere: "specialite",
  sexe: "sexe",
  "date de naissance": "dateNaissance",
  datenaissance: "dateNaissance",
  date_naissance: "dateNaissance",
  "date naissance": "dateNaissance",
  téléphone: "telephone",
  telephone: "telephone",
  tel: "telephone",
  email: "email",
  "e-mail": "email",
  statut: "statut",
};

const FIELD_ORDER: FieldKey[] = [
  "prenom",
  "nom",
  "specialite",
  "sexe",
  "dateNaissance",
  "telephone",
  "email",
  "statut",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  prenom: "Prénom *",
  nom: "Nom *",
  specialite: "Spécialité",
  sexe: "Sexe",
  dateNaissance: "Date naissance",
  telephone: "Téléphone",
  email: "Email",
  statut: "Statut",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?216)?\s?\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function emptyRow(): RawRow {
  return {
    prenom: "",
    nom: "",
    specialite: "",
    sexe: "",
    dateNaissance: "",
    telephone: "",
    email: "",
    statut: "",
  };
}

function excelDateToIso(value: unknown): string {
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d && d.y && d.m && d.d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  return String(value ?? "").trim();
}

function mapColumns(rawObj: Record<string, unknown>): RawRow {
  const out = emptyRow();
  for (const [key, value] of Object.entries(rawObj)) {
    const normalized = key.toLowerCase().trim();
    const field = COLUMN_MAP[normalized];
    if (field == null || value == null) continue;
    if (field === "dateNaissance") {
      out[field] = excelDateToIso(value);
    } else {
      out[field] = String(value).trim();
    }
  }
  return out;
}

function validateCell(field: FieldKey, value: string): string | undefined {
  if (field === "prenom" || field === "nom") {
    if (!value) return "Obligatoire";
    return undefined;
  }
  if (!value) return undefined;
  if (field === "email" && !EMAIL_RE.test(value)) return "Email invalide";
  if (field === "telephone" && !PHONE_RE.test(value))
    return "Format invalide (8 chiffres, ex: 20 100 200)";
  if (field === "dateNaissance") {
    if (!DATE_RE.test(value)) return "Format attendu : AAAA-MM-JJ";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Date invalide";
    const age = new Date().getFullYear() - d.getFullYear();
    if (age < 18 || age > 80) return `Âge incohérent (${age} ans)`;
  }
  if (field === "sexe" && value !== "M" && value !== "F")
    return "Doit être M ou F";
  if (
    field === "statut" &&
    !STATUTS_ENSEIGNANT.includes(value as (typeof STATUTS_ENSEIGNANT)[number])
  )
    return `Doit être : ${STATUTS_ENSEIGNANT.join(" / ")}`;
  if (field === "specialite" && !SPECIALITES.includes(value))
    return "Spécialité non reconnue";
  return undefined;
}

function validateAllCells(raw: RawRow): CellErrors {
  const errors: CellErrors = {};
  for (const f of FIELD_ORDER) {
    const err = validateCell(f, raw[f]);
    if (err) errors[f] = err;
  }
  return errors;
}

function applyDuplicateMarks(rows: EditableRow[]): EditableRow[] {
  const emailCount = new Map<string, number>();
  const phoneCount = new Map<string, number>();
  for (const r of rows) {
    const e = r.raw.email.trim().toLowerCase();
    const p = r.raw.telephone.replace(/[\s-]/g, "");
    if (e) emailCount.set(e, (emailCount.get(e) ?? 0) + 1);
    if (p) phoneCount.set(p, (phoneCount.get(p) ?? 0) + 1);
  }
  return rows.map((r) => {
    const errors = { ...r.errors };
    const e = r.raw.email.trim().toLowerCase();
    const p = r.raw.telephone.replace(/[\s-]/g, "");
    if (e && (emailCount.get(e) ?? 0) > 1)
      errors.email = "Doublon dans le fichier";
    if (p && (phoneCount.get(p) ?? 0) > 1)
      errors.telephone = "Doublon dans le fichier";
    return { ...r, errors };
  });
}

function rowToImport(raw: RawRow): ImportRow {
  return {
    prenom: raw.prenom,
    nom: raw.nom,
    specialite: SPECIALITES.includes(raw.specialite) ? raw.specialite : "",
    sexe: raw.sexe === "F" ? "F" : "M",
    dateNaissance: DATE_RE.test(raw.dateNaissance) ? raw.dateNaissance : "",
    telephone: PHONE_RE.test(raw.telephone) ? raw.telephone : "",
    email: EMAIL_RE.test(raw.email) ? raw.email : "",
    statut: STATUTS_ENSEIGNANT.includes(
      raw.statut as (typeof STATUTS_ENSEIGNANT)[number]
    )
      ? (raw.statut as Teacher["statut"])
      : "Actif",
  };
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImport,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [errorsOnly, setErrorsOnly] = useState(false);

  const reset = () => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setErrorsOnly(false);
  };

  const downloadTemplate = () => {
    const headers = [
      "Prénom",
      "Nom",
      "Spécialité",
      "Sexe",
      "Date de naissance",
      "Téléphone",
      "Email",
      "Statut",
    ];
    const example = [
      "Hedi",
      "Ben Amor",
      SPECIALITES[0] ?? "Mathématiques",
      "M",
      "1985-04-12",
      "20 100 200",
      "hedi.benamor@school.tn",
      "Actif",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));

    const refRows: (string | null)[][] = [
      ["Spécialités valides", "Sexes valides", "Statuts valides"],
    ];
    const maxLen = Math.max(SPECIALITES.length, 2, STATUTS_ENSEIGNANT.length);
    for (let i = 0; i < maxLen; i++) {
      refRows.push([
        SPECIALITES[i] ?? "",
        i === 0 ? "M" : i === 1 ? "F" : "",
        STATUTS_ENSEIGNANT[i] ?? "",
      ]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet(refRows);
    wsRef["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 16 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enseignants");
    XLSX.utils.book_append_sheet(wb, wsRef, "Valeurs valides");
    XLSX.writeFile(wb, "modele-enseignants.xlsx");
  };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        wb.Sheets[sheetName]
      );
      const built: EditableRow[] = rawRows.map((rawObj, i) => {
        const raw = mapColumns(rawObj);
        return { id: i, raw, errors: validateAllCells(raw) };
      });
      setRows(applyDuplicateMarks(built));
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

  const updateCell = (rowId: string, field: FieldKey, value: string) => {
    setRows((prev) => {
      const next = prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              raw: { ...r.raw, [field]: value },
              errors: { ...r.errors },
            }
          : r
      );
      const target = next.find((r) => r.id === rowId);
      if (target) target.errors = validateAllCells(target.raw);
      return applyDuplicateMarks(next);
    });
  };

  const removeRow = (rowId: string) => {
    setRows((prev) =>
      applyDuplicateMarks(prev.filter((r) => r.id !== rowId))
    );
  };

  const visibleRows = useMemo(
    () =>
      errorsOnly
        ? rows.filter((r) => Object.keys(r.errors).length > 0)
        : rows,
    [rows, errorsOnly]
  );

  const totals = useMemo(() => {
    let importable = 0;
    let withWarnings = 0;
    let blocked = 0;
    for (const r of rows) {
      const blocking = !!r.errors.prenom || !!r.errors.nom;
      const hasOther = Object.keys(r.errors).some(
        (k) => k !== "prenom" && k !== "nom"
      );
      if (blocking) blocked++;
      else {
        importable++;
        if (hasOther) withWarnings++;
      }
    }
    return { importable, withWarnings, blocked, total: rows.length };
  }, [rows]);

  const handleConfirmImport = () => {
    const importable = rows
      .filter((r) => !r.errors.prenom && !r.errors.nom)
      .map((r) => rowToImport(r.raw));
    onImport(importable);
    onOpenChange(false);
    reset();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const renderCell = (row: EditableRow, field: FieldKey) => {
    const err = row.errors[field];
    const value = row.raw[field];
    const cellInput = (
      <input
        type="text"
        value={value}
        onChange={(e) => updateCell(row.id, field, e.target.value)}
        className={`w-full bg-transparent px-2 py-1 text-xs outline-none rounded border ${
          err
            ? "border-red-300 bg-red-50/60 focus:border-red-500"
            : "border-transparent focus:border-primary/40 focus:bg-background"
        }`}
        placeholder={field === "sexe" ? "M / F" : ""}
      />
    );
    if (!err) return cellInput;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {cellInput}
            <AlertCircle className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-red-500 pointer-events-none" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span className="text-xs">{err}</span>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Importer depuis Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Uploadez un fichier Excel (.xlsx, .xls) contenant les données des enseignants"
              : `${totals.total} ligne(s) lues — ${totals.importable} importables, ${totals.withWarnings} avec avertissements, ${totals.blocked} bloquées`}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground mb-1">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">ou</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  asChild
                >
                  <span>Parcourir les fichiers</span>
                </Button>
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={downloadTemplate}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Colonnes attendues : Prénom, Nom, Spécialité, Sexe, Date de
              naissance, Téléphone, Email, Statut
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Seuls <span className="font-medium">Prénom</span> et{" "}
              <span className="font-medium">Nom</span> sont obligatoires. Les
              autres champs sont validés et corrigeables après import.
            </p>
          </div>
        )}

        {step === "preview" && (
          <TooltipProvider delayDuration={200}>
            <div className="flex-1 overflow-hidden flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {totals.importable} prête(s)
                </span>
                {totals.withWarnings > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    {totals.withWarnings} avec avertissement(s)
                  </span>
                )}
                {totals.blocked > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600">
                    <X className="h-4 w-4" />
                    {totals.blocked} bloquée(s)
                  </span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Switch
                    id="errors-only"
                    checked={errorsOnly}
                    onCheckedChange={setErrorsOnly}
                  />
                  <Label
                    htmlFor="errors-only"
                    className="text-xs cursor-pointer"
                  >
                    Voir uniquement les erreurs
                  </Label>
                </div>
                <span className="text-muted-foreground text-xs">
                  Fichier : {fileName}
                </span>
              </div>

              <div className="flex-1 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2 text-left font-semibold text-muted-foreground w-10">
                        #
                      </th>
                      {FIELD_ORDER.map((f) => (
                        <th
                          key={f}
                          className="py-2 px-2 text-left font-semibold text-muted-foreground"
                        >
                          {FIELD_LABELS[f]}
                        </th>
                      ))}
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-border/50 hover:bg-muted/10"
                      >
                        <td className="py-1 px-2 text-muted-foreground align-middle">
                          {row.id + 1}
                        </td>
                        {FIELD_ORDER.map((f) => (
                          <td key={f} className="py-1 px-1 align-middle">
                            {renderCell(row, f)}
                          </td>
                        ))}
                        <td className="px-1 align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-600"
                            onClick={() => removeRow(row.id)}
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {visibleRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={FIELD_ORDER.length + 2}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {errorsOnly
                            ? "Aucune ligne avec erreur."
                            : "Aucune ligne."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cliquez sur une cellule pour la corriger. Les valeurs invalides
                seront vidées à l'import (sauf Prénom et Nom qui sont
                obligatoires).
              </p>
            </div>
          </TooltipProvider>
        )}

        <DialogFooter className="mt-2">
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={reset}
              className="mr-auto gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Changer de fichier
            </Button>
          )}
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          {step === "preview" && totals.importable > 0 && (
            <Button
              className="bg-gradient-primary shadow-btn"
              onClick={handleConfirmImport}
            >
              Importer {totals.importable} enseignant
              {totals.importable > 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
