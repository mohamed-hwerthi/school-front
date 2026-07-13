import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useImportFile, useDownloadTemplate } from "@/hooks/useImportExport";
import { notify } from "@/lib/toast";
import type { ImportType, ImportResult } from "@/types/import-export";

interface ImportDialogProps {
  type: ImportType;
  onComplete?: () => void;
  trigger?: React.ReactNode;
}

const TYPE_LABELS: Record<ImportType, string> = {
  students: "Eleves",
  teachers: "Enseignants",
  notes: "Notes",
};

export default function ImportDialog({ type, onComplete, trigger }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const importMutation = useImportFile(type);
  const templateMutation = useDownloadTemplate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
    } else {
      notify.error("Format de fichier non supporte. Utilisez CSV ou XLSX.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
    } else {
      notify.error("Format de fichier non supporte. Utilisez CSV ou XLSX.");
    }
  };

  const isValidFile = (f: File) => {
    return (
      f.name.endsWith(".csv") ||
      f.name.endsWith(".xlsx") ||
      f.name.endsWith(".xls")
    );
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const importResult = await importMutation.mutateAsync(file);
      setResult(importResult);

      if (importResult.errors.length === 0) {
        notify.success(
          `Import reussi: ${importResult.imported} enregistrement(s) importe(s).`
        );
      } else {
        notify.warning(
          `Import partiel: ${importResult.imported} importe(s), ${importResult.skipped} ignore(s).`
        );
      }

      onComplete?.();
    } catch (error) {
      notify.error("Erreur lors de l'import. Verifiez le format du fichier.");
    }
  };

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      await templateMutation.mutateAsync({ type, format });
      notify.success("Template telecharge.");
    } catch {
      notify.error("Erreur lors du telechargement du template.");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importer {TYPE_LABELS[type]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des {TYPE_LABELS[type]}</DialogTitle>
          <DialogDescription>
            Importez des donnees depuis un fichier CSV ou Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        {/* Template download */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm flex-1">
            Telechargez un template pour connaitre le format attendu
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadTemplate("csv")}
            disabled={templateMutation.isPending}
          >
            <Download className="mr-1 h-3 w-3" />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadTemplate("xlsx")}
            disabled={templateMutation.isPending}
          >
            <Download className="mr-1 h-3 w-3" />
            Excel
          </Button>
        </div>

        {/* Drag & Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-deposez un fichier ici, ou
              </p>
              <label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span>Parcourir</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Formats acceptes : CSV, XLSX
              </p>
            </div>
          )}
        </div>

        {/* Import button */}
        {file && !result && (
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">&#9696;</span>
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Lancer l'import
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-1">
                Total: {result.totalRows}
              </Badge>
              <Badge variant="default" className="gap-1 bg-green-600">
                <CheckCircle className="h-3 w-3" />
                Importes: {result.imported}
              </Badge>
              {result.skipped > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Ignores: {result.skipped}
                </Badge>
              )}
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Erreurs ({result.errors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Ligne</TableHead>
                        <TableHead className="w-28">Champ</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {err.rowNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {err.field}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {err.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
