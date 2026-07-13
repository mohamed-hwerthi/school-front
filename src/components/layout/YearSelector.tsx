import { useAnneeContext } from "@/hooks/useAnneeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Lock, CheckCircle2 } from "lucide-react";

export function YearSelector() {
  const { selectedAnnee, setSelectedAnnee, allAnnees, isLoading } = useAnneeContext();

  if (isLoading || !selectedAnnee) return null;

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedAnnee.id}
        onValueChange={(val) => {
          const annee = allAnnees.find((a) => a.id === val);
          if (annee) setSelectedAnnee(annee);
        }}
      >
        <SelectTrigger className="h-8 w-[140px] border-border/50 bg-muted/40 text-xs font-medium hover:bg-muted/60 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allAnnees.map((annee) => (
            <SelectItem key={annee.id} value={annee.id} className="text-xs">
              <div className="flex items-center gap-2">
                <span>{annee.label}</span>
                {annee.cloturee && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
                {annee.active && (
                  <Badge variant="outline" className="h-4 px-1 text-[9px] border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-2.5 w-2.5 me-0.5" />
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
