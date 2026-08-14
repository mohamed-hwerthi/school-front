import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Triggered when the user clicks the search icon or presses Enter. */
  onSearch?: () => void;
}

/**
 * Search field with a clickable magnifier icon in front of the input.
 * Clicking the icon (or pressing Enter) calls `onSearch`, which must be
 * wired to the data-fetching hook — this keeps the refresh scoped to the
 * table/data section instead of reloading the whole page.
 */
export function SearchInput({
  className,
  onSearch,
  disabled,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Rechercher"
        disabled={disabled}
        tabIndex={-1}
        onClick={onSearch}
        className="absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Search className="h-4 w-4" />
      </button>
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background ps-10 pe-3 py-2 text-base transition-colors ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch?.();
        }}
        {...props}
      />
    </div>
  );
}