import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAllStudents } from "@/hooks/useStudents";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Custom filter on top of the niveau/classe filters. */
  filter?: (student: { id: string; prenom: string; nom: string; classe?: string; niveau?: string }) => boolean;
  className?: string;
}

/**
 * Sélecteur d'élèves MULTI-choix réutilisable (case à cocher) avec champ de
 * recherche tapé-au-clavier et filtres Niveau → Classe. La popover reste
 * ouverte pendant la sélection ; chaque élève sélectionné apparaît en badge
 * supprimable sous le bouton déclencheur.
 */
export default function StudentMultiCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Sélectionner des élèves",
  filter,
  className,
}: Props) {
  const { data: students = [] } = useAllStudents();
  const [open, setOpen] = useState(false);
  const [niveauFilter, setNiveauFilter] = useState<string>("all");
  const [classeFilter, setClasseFilter] = useState<string>("all");

  const niveaux = useMemo(
    () =>
      Array.from(
        new Set(students.map((s) => s.niveau).filter((v): v is string => !!v))
      ).sort(),
    [students]
  );
  const classes = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((s) => niveauFilter === "all" || s.niveau === niveauFilter)
            .map((s) => s.classe)
            .filter((v): v is string => !!v)
        )
      ).sort(),
    [students, niveauFilter]
  );

  const list = useMemo(
    () =>
      students
        .filter((s) => (niveauFilter === "all" ? true : s.niveau === niveauFilter))
        .filter((s) => (classeFilter === "all" ? true : s.classe === classeFilter))
        .filter((s) => (filter ? filter(s) : true)),
    [students, niveauFilter, classeFilter, filter]
  );

  useEffect(() => {
    if (classeFilter !== "all" && !classes.includes(classeFilter)) {
      setClasseFilter("all");
    }
  }, [classes, classeFilter]);

  const selectedIds = new Set(value.map((v) => String(v)));
  const selectedStudents = students.filter((s) => selectedIds.has(String(s.id)));

  const toggle = (id: string) => {
    const key = String(id);
    onChange(selectedIds.has(key) ? value.filter((v) => String(v) !== key) : [...value, key]);
  };

  const selectAllVisible = () => {
    const visible = list.map((s) => String(s.id));
    const merged = Array.from(new Set([...value, ...visible]));
    onChange(merged);
  };

  const clearAll = () => onChange([]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Niveau</Label>
          <Select
            value={niveauFilter}
            onValueChange={(v) => {
              setNiveauFilter(v);
              setClasseFilter("all");
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {niveaux.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Classe</Label>
          <Select
            value={classeFilter}
            onValueChange={setClasseFilter}
            disabled={disabled || classes.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>
                {value.length === 0
                  ? placeholder
                  : `${value.length} élève${value.length > 1 ? "s" : ""} sélectionné${value.length > 1 ? "s" : ""}`}
              </span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums ms-2 shrink-0">
              {list.length}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ms-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search) => {
              const s = list.find((st) => String(st.id) === itemValue);
              if (!s) return 0;
              const haystack = `${s.prenom} ${s.nom} ${s.matricule ?? ""} ${s.classe ?? ""}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Rechercher (nom, matricule)..." />
            <CommandList>
              <CommandEmpty>Aucun élève trouvé.</CommandEmpty>
              <CommandGroup>
                {list.map((s) => {
                  const isSelected = selectedIds.has(String(s.id));
                  return (
                    <CommandItem
                      key={s.id}
                      value={String(s.id)}
                      onSelect={() => toggle(String(s.id))}
                    >
                      <Check
                        className={cn(
                          "me-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {s.prenom} {s.nom}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {[s.matricule, s.classe].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-xs font-medium text-primary hover:underline"
              >
                Tout sélectionner ({list.length})
              </button>
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-muted-foreground hover:underline"
                >
                  Effacer
                </button>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedStudents.map((s) => (
            <Badge key={s.id} variant="secondary" className="gap-1 ps-2 pe-1.5 py-1 text-xs font-normal">
              {s.prenom} {s.nom}
              <button
                type="button"
                onClick={() => toggle(String(s.id))}
                className="rounded-full hover:bg-muted p-0.5"
                aria-label={`Retirer ${s.prenom} ${s.nom}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}