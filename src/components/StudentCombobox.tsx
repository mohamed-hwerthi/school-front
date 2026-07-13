import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Custom filter on top of the niveau/classe filters. */
  filter?: (student: { id: string; prenom: string; nom: string; classe?: string; niveau?: string }) => boolean;
  /** Display labels for the niveau + classe selects shown above. Defaults to true. */
  showScopeFilters?: boolean;
  className?: string;
}

/**
 * Sélecteur d'élève réutilisable avec champ de recherche tapé-au-clavier.
 * Au-dessus du combobox, deux selects en cascade (Niveau → Classe) qui
 * réduisent le nombre d'élèves chargés dans la liste — utile sur les
 * écoles de 200+ élèves où le combobox brut devient illisible.
 */
export default function StudentCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Sélectionner un élève",
  filter,
  showScopeFilters = true,
  className,
}: Props) {
  const { data: students = [] } = useAllStudents();
  const [open, setOpen] = useState(false);
  const [niveauFilter, setNiveauFilter] = useState<string>("all");
  const [classeFilter, setClasseFilter] = useState<string>("all");

  // Distinct niveaux & classes from loaded students. On garde un tri stable
  // pour l'UI : "1ere", "2eme"… puis classes "1A", "1B", etc.
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

  // Liste réellement affichée dans le combobox : intersection des filtres.
  const list = useMemo(
    () =>
      students
        .filter((s) => (niveauFilter === "all" ? true : s.niveau === niveauFilter))
        .filter((s) => (classeFilter === "all" ? true : s.classe === classeFilter))
        .filter((s) => (filter ? filter(s) : true)),
    [students, niveauFilter, classeFilter, filter]
  );

  // Garde-fou : si la classe sélectionnée n'est plus valide après changement
  // de niveau, on la repasse à "all".
  if (classeFilter !== "all" && !classes.includes(classeFilter)) {
    setClasseFilter("all");
  }

  const selected = students.find((s) => String(s.id) === String(value));
  const label = selected
    ? `${selected.prenom} ${selected.nom}${selected.matricule ? ` · ${selected.matricule}` : ""}${selected.classe ? ` (${selected.classe})` : ""}`
    : placeholder;

  return (
    <div className={cn("space-y-2", className)}>
      {showScopeFilters && (
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
      )}

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
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {label}
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
                {list.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={String(s.id)}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "me-2 h-4 w-4",
                        String(s.id) === String(value) ? "opacity-100" : "opacity-0"
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
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
