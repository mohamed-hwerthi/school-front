import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useExportData } from "@/hooks/useImportExport";
import { notify } from "@/lib/toast";
import type { ExportType, ExportFormat, ExportFilters } from "@/types/import-export";

interface ExportButtonProps {
  type: ExportType;
  filters?: ExportFilters;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ExportButton({
  type,
  filters = {},
  label,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const exportMutation = useExportData();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      await exportMutation.mutateAsync({ type, format, filters });
      notify.success(
        `Export ${format.toUpperCase()} telecharge avec succes.`
      );
    } catch {
      notify.error("Erreur lors de l'export. Veuillez reessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <>
              <span className="animate-spin mr-2">&#9696;</span>
              Export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {label || "Exporter"}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exporter en Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
