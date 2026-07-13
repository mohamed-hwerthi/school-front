import { useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────── */

export interface Column<T> {
  /** Unique key used for React keys and data access. */
  key: string;
  /** Header label displayed in the table header. */
  header: string;
  /** Custom cell renderer. Falls back to `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Additional CSS class for the column header and cells. */
  className?: string;
}

interface PaginationConfig {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pagination?: PaginationConfig;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * Generic data table component with built-in search bar,
 * loading skeleton, empty state, and pagination.
 *
 * Uses the project's shadcn/ui `Table` primitives.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucune donnee trouvee",
  emptyDescription,
  onRowClick,
  pagination,
  searchPlaceholder = "Rechercher...",
  onSearch,
  className,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearch?.(value);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      {onSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading state */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Empty state */}
            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <EmptyState title={emptyMessage} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!loading &&
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : (row[col.key] as ReactNode) ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page + 1} sur {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
