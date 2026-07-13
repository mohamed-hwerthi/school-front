import { useMemo, useState } from "react";
import { Calendar, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useCreneaux } from "@/hooks/useEmploiDuTemps";
import {
  useDisponibilites,
  useCreateDisponibilite,
  useDeleteDisponibilite,
  useUpdateDisponibilite,
} from "@/hooks/useDisponibilites";
import type { DispoType, DisponibiliteDTO } from "@/api/disponibilites.api";
import { notify } from "@/lib/toast";

const DAYS = [
  { num: 1, label: "Lun" },
  { num: 2, label: "Mar" },
  { num: 3, label: "Mer" },
  { num: 4, label: "Jeu" },
  { num: 5, label: "Ven" },
  { num: 6, label: "Sam" },
];

const TYPE_CYCLE: (DispoType | null)[] = [null, "INDISPONIBLE", "PREFERE", "EVITER"];

const TYPE_STYLES: Record<DispoType, { bg: string; label: string; emoji: string }> = {
  INDISPONIBLE: { bg: "bg-red-100 hover:bg-red-200 text-red-700 border-red-300", label: "Indisponible", emoji: "🚫" },
  PREFERE: { bg: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300", label: "Préféré", emoji: "★" },
  EVITER: { bg: "bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300", label: "À éviter", emoji: "⚠" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  enseignantId: string;
  enseignantName: string;
}

export default function DisponibiliteGrid({ open, onClose, enseignantId, enseignantName }: Props) {
  const qc = useQueryClient();
  const { data: creneaux = [], isLoading: loadingCreneaux } = useCreneaux();
  const { data: dispos = [], isLoading: loadingDispos } = useDisponibilites(enseignantId);
  const createDispo = useCreateDisponibilite();
  const updateDispo = useUpdateDisponibilite();
  const deleteDispo = useDeleteDisponibilite();

  // Track which cells have an in-flight mutation so we can disable rapid double-clicks
  // (cell key = "jour-creneau"). Race conditions on the same cell are the root cause of
  // the "déjà existe" error: two creates fire before the first refetch completes.
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());
  const cellKey = (jour: number, creneauId: string) => `${jour}-${creneauId}`;
  const markPending = (key: string, on: boolean) => {
    setPendingCells((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const courseCreneaux = useMemo(
    () => creneaux.filter((c) => c.type === "COURS"),
    [creneaux]
  );

  const dispoMap = useMemo(() => {
    const m = new Map<string, DisponibiliteDTO>();
    for (const d of dispos) {
      m.set(cellKey(d.jourSemaine, d.creneauId), d);
    }
    return m;
  }, [dispos]);

  const cycleType = (jourSemaine: number, creneauId: string, current: DisponibiliteDTO | undefined) => {
    const key = cellKey(jourSemaine, creneauId);
    if (pendingCells.has(key)) return; // ignore rapid re-clicks on same cell

    const currentType = current?.type ?? null;
    const idx = TYPE_CYCLE.indexOf(currentType);
    const nextType = TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];

    markPending(key, true);
    const onSettled = () => markPending(key, false);

    if (nextType === null && current) {
      deleteDispo.mutate(current.id, {
        onError: () => notify.error("Erreur lors de la suppression"),
        onSettled,
      });
      return;
    }

    if (nextType !== null) {
      if (current) {
        updateDispo.mutate(
          { id: current.id, data: { enseignantId, jourSemaine, creneauId, type: nextType } },
          { onError: () => notify.error("Erreur lors de la mise à jour"), onSettled }
        );
      } else {
        createDispo.mutate(
          { enseignantId, jourSemaine, creneauId, type: nextType },
          {
            onError: (e) => {
              // Likely a stale cache: a record exists server-side but our local view
              // shows the cell as empty. Refresh to reconcile.
              if (e?.message?.toLowerCase().includes("existe")) {
                qc.invalidateQueries({ queryKey: ["disponibilites"] });
                notify.warning("Donnée rafraîchie — réessayez votre clic");
              } else {
                notify.error(e.message || "Erreur lors de l'ajout");
              }
            },
            onSettled,
          }
        );
      }
    }
  };

  const handleClearAll = async () => {
    if (dispos.length === 0) return;
    if (!confirm(`Effacer les ${dispos.length} disponibilité(s) saisie(s) pour ${enseignantName} ?`)) {
      return;
    }
    try {
      await Promise.all(dispos.map((d) => deleteDispo.mutateAsync(d.id)));
      notify.success("Disponibilités effacées");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Erreur lors de l'effacement");
    }
  };

  const isLoading = loadingCreneaux || loadingDispos;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Disponibilités — {enseignantName}
          </DialogTitle>
          <DialogDescription>
            Cliquez sur une cellule pour cycler entre : libre → 🚫 indisponible → ★ préféré → ⚠ à éviter → libre.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin me-2" />
            Chargement...
          </div>
        ) : courseCreneaux.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucun créneau de cours configuré. Configurez d'abord les créneaux dans la page Emploi du temps.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-border bg-muted/30 text-start font-semibold w-32">
                    Créneau
                  </th>
                  {DAYS.map((d) => (
                    <th
                      key={d.num}
                      className="p-2 border border-border bg-muted/30 text-center font-semibold"
                    >
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseCreneaux.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2 border border-border bg-muted/10 font-medium">
                      <div>{c.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.heureDebut.slice(0, 5)}–{c.heureFin.slice(0, 5)}
                      </div>
                    </td>
                    {DAYS.map((d) => {
                      const key = cellKey(d.num, c.id);
                      const dispo = dispoMap.get(key);
                      const style = dispo ? TYPE_STYLES[dispo.type] : null;
                      const isPending = pendingCells.has(key);
                      return (
                        <td key={d.num} className="border border-border p-0">
                          <button
                            onClick={() => cycleType(d.num, c.id, dispo)}
                            disabled={isPending}
                            className={`w-full h-12 flex items-center justify-center text-xs font-medium transition-colors border relative ${
                              style
                                ? style.bg
                                : "bg-card hover:bg-muted/40 text-muted-foreground border-transparent"
                            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
                            title={style?.label ?? "Libre — cliquer pour modifier"}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : style ? (
                              `${style.emoji}`
                            ) : (
                              ""
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap gap-3 mt-4 text-xs items-center">
              {(Object.keys(TYPE_STYLES) as DispoType[]).map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <span className={`inline-block h-3 w-3 rounded ${TYPE_STYLES[t].bg.split(" ")[0]}`} />
                  <span>
                    {TYPE_STYLES[t].emoji} {TYPE_STYLES[t].label}
                  </span>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleClearAll}
                disabled={dispos.length === 0}
              >
                <Trash2 className="h-3.5 w-3.5 me-1.5" />
                Tout effacer ({dispos.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
