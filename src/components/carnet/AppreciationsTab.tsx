import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useCarnetSelection } from "./CarnetSelectionContext";
import { Save, MessageSquare, GraduationCap, Users } from "lucide-react";
import { notify } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useClasses } from "@/hooks/useClasses";
import { useDomaines } from "@/hooks/useDomaines";
import { useBulletins } from "@/hooks/useBulletins";
import {
  useRecommandations,
  useUpsertRecommandations,
  useObservations,
  useUpsertObservations,
} from "@/hooks/useAppreciations";
import { studentsApi } from "@/api/students.api";
import type { RecommandationRequest, ObservationRequest } from "@/api/appreciations.api";

const TRIMESTRES = [
  { value: 1, label: "Trimestre 1" },
  { value: 2, label: "Trimestre 2" },
  { value: 3, label: "Trimestre 3" },
];

const RECO_SUGGESTIONS = [
  "نتائج ممتازة واصل يا بطل",
  "نتائج جيدة",
  "نتائج مقبولة يمكن بذل مجهود أكبر",
  "نتائج ضعيفة يجب بذل مجهود أكبر",
];

function recoFromMoyenne(moyenne: number | null | undefined): string {
  if (moyenne == null) return "";
  if (moyenne >= 16) return RECO_SUGGESTIONS[0];
  if (moyenne >= 12) return RECO_SUGGESTIONS[1];
  if (moyenne >= 10) return RECO_SUGGESTIONS[2];
  return RECO_SUGGESTIONS[3];
}

type ViewMode = "recommandations" | "observations";

interface LocalReco {
  studentId: string;
  studentName: string;
  texte: string;
}

interface LocalObs {
  studentId: string;
  studentName: string;
  comportement: string;
  certificatType: string;
}

export default function AppreciationsTab() {
  const { niveaux } = useNiveaux();
  const { niveauId, classeId, trimestre, setNiveauId, setClasseId, setTrimestre, goToTab } = useCarnetSelection();
  const [domaineId, setDomaineId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("recommandations");

  const { data: classes = [] } = useClasses(niveauId || undefined);
  const { data: domaines = [] } = useDomaines(niveauId || undefined);

  // Get students for selected classe
  const selectedClasse = classes.find((c) => c.id === classeId);
  const classeName = selectedClasse?.fullName ?? "";
  const { data: studentsPage } = useQuery({
    queryKey: ["students", "by-classe", classeName],
    queryFn: () => studentsApi.getAll({ classe: classeName, size: 200 }),
    enabled: !!classeName,
  });
  const students = studentsPage?.content ?? [];
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  // Recommendations & observations data
  const { data: existingRecos = [] } = useRecommandations(studentIds, trimestre);
  const { data: existingObs = [] } = useObservations(studentIds, trimestre);
  const upsertRecos = useUpsertRecommandations();
  const upsertObs = useUpsertObservations();

  // Bulletins to derive moyennes (used for auto-fill)
  const { data: bulletins = [] } = useBulletins(classeId, trimestre, "etatique");

  // Map studentId -> moyenne du domaine sélectionné
  const moyenneDomaineByStudent = useMemo(() => {
    const map = new Map<string, number>();
    if (!domaineId) return map;
    bulletins.forEach((b) => {
      const d = b.domaines.find((dd) => dd.domaineId === domaineId);
      if (d) map.set(b.studentId, d.moyenneDomaine);
    });
    return map;
  }, [bulletins, domaineId]);


  // Local state for editing
  const [localRecos, setLocalRecos] = useState<LocalReco[]>([]);
  const [localObs, setLocalObs] = useState<LocalObs[]>([]);

  // Filter recommendations for selected domaine
  const filteredRecos = useMemo(
    () => existingRecos.filter((r) => r.domaineId === domaineId),
    [existingRecos, domaineId]
  );

  // Merge students + existing recommendations for selected domaine.
  // Si aucune reco saisie pour un élève, on pré-remplit avec la phrase arabe
  // déduite de sa moyenne dans le domaine (excellent / bon / passable / faible).
  useEffect(() => {
    if (!domaineId || !trimestre || students.length === 0) {
      setLocalRecos([]);
      return;
    }
    const recoMap = new Map(filteredRecos.map((r) => [r.studentId, r]));
    setLocalRecos(
      students.map((s) => {
        const existing = recoMap.get(s.id)?.texte ?? "";
        const auto = recoFromMoyenne(moyenneDomaineByStudent.get(s.id));
        return {
          studentId: s.id,
          studentName: `${s.prenom} ${s.nom}`,
          texte: existing || auto,
        };
      })
    );
  }, [students, filteredRecos, domaineId, trimestre, moyenneDomaineByStudent]);

  // Merge students + existing observations
  useEffect(() => {
    if (!trimestre || students.length === 0) {
      setLocalObs([]);
      return;
    }
    const obsMap = new Map(existingObs.map((o) => [o.studentId, o]));
    setLocalObs(
      students.map((s) => ({
        studentId: s.id,
        studentName: `${s.prenom} ${s.nom}`,
        comportement: obsMap.get(s.id)?.comportement ?? "",
        certificatType: obsMap.get(s.id)?.certificatType ?? "",
      }))
    );
  }, [students, existingObs, trimestre]);

  const handleRecoChange = (studentId: string, texte: string) => {
    setLocalRecos((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, texte } : r))
    );
  };

  const applyRecoSuggestion = (suggestion: string) => {
    setLocalRecos((prev) =>
      prev.map((r) => (r.texte ? r : { ...r, texte: suggestion }))
    );
  };

  const applyAutoRecoFromMoyenne = () => {
    setLocalRecos((prev) =>
      prev.map((r) => {
        if (r.texte) return r;
        const moy = moyenneDomaineByStudent.get(r.studentId);
        const auto = recoFromMoyenne(moy);
        return auto ? { ...r, texte: auto } : r;
      })
    );
  };

  const handleSaveRecos = () => {
    const items: RecommandationRequest[] = localRecos
      .filter((r) => r.texte)
      .map((r) => ({
        studentId: r.studentId,
        domaineId,
        trimestre,
        texte: r.texte,
      }));
    if (items.length === 0) {
      notify.error("Aucune recommandation à sauvegarder");
      return;
    }
    upsertRecos.mutate(items, {
      onSuccess: () => {
        notify.success("Recommandations sauvegardées");
        // Étape suivante naturelle : générer les carnets avec les recos.
        goToTab("carnets");
      },
      onError: () => notify.error("Erreur lors de la sauvegarde"),
    });
  };

  const handleObsChange = (
    studentId: string,
    field: "comportement" | "certificatType",
    value: string
  ) => {
    setLocalObs((prev) =>
      prev.map((o) =>
        o.studentId === studentId ? { ...o, [field]: value } : o
      )
    );
  };

  const handleSaveObs = () => {
    const items: ObservationRequest[] = localObs
      .filter((o) => o.comportement || o.certificatType)
      .map((o) => ({
        studentId: o.studentId,
        trimestre,
        comportement: o.comportement || undefined,
        certificatType: o.certificatType || undefined,
      }));
    if (items.length === 0) {
      notify.error("Aucune observation à sauvegarder");
      return;
    }
    upsertObs.mutate(items, {
      onSuccess: () => {
        notify.success("Observations sauvegardées");
        goToTab("carnets");
      },
      onError: () => notify.error("Erreur lors de la sauvegarde"),
    });
  };

  const ready = trimestre > 0 && classeId && students.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <Select
            value={trimestre ? String(trimestre) : ""}
            onValueChange={(v) => setTrimestre(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              {TRIMESTRES.map((t) => (
                <SelectItem key={t.value} value={String(t.value)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={niveauId ? String(niveauId) : ""}
            onValueChange={(v) => {
              setNiveauId(v);
              setClasseId("");
              setDomaineId("");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <GraduationCap className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={classeId ? String(classeId) : ""}
            onValueChange={(v) => setClasseId(v)}
            disabled={!niveauId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Default state — choose a niveau/classe */}
      {!ready && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-xl border border-border/50 bg-card shadow-sm"
        >
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                <GraduationCap className="h-4 w-4" />
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Choisissez une classe
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1.5">
              Sélectionnez un niveau puis une classe dans les filtres ci-dessus pour
              afficher et saisir les appréciations, recommandations et certificats.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {[
                { label: "Niveau", desc: "1ère, 2ème, 3ème...", icon: GraduationCap },
                { label: "Classe", desc: "1A, 1B, 2A...", icon: Users },
                { label: "Trimestre", desc: "1, 2 ou 3", icon: Save },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="rounded-xl border border-border/40 bg-muted/30 p-4 text-center"
                >
                  <s.icon className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mode switch */}
      {ready && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit"
        >
          <button
            onClick={() => setViewMode("recommandations")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              viewMode === "recommandations"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Recommandations par domaine
          </button>
          <button
            onClick={() => setViewMode("observations")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              viewMode === "observations"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Observations & Certificats
          </button>
        </motion.div>
      )}

      {/* ═══ RECOMMANDATIONS MODE ═══ */}
      {ready && viewMode === "recommandations" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          {/* Domaine selector */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Domaine</Label>
              <Select
                value={domaineId ? String(domaineId) : ""}
                onValueChange={(v) => setDomaineId(v)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Sélectionner un domaine" />
                </SelectTrigger>
                <SelectContent>
                  {domaines.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {domaineId && (
              <>
                <div className="sm:ms-auto flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="text-xs h-7 gap-1.5"
                    onClick={applyAutoRecoFromMoyenne}
                    title="Remplir automatiquement les vides selon la moyenne de chaque élève dans ce domaine"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Auto selon moyenne
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Remplir tous les vides :
                  </span>
                  {RECO_SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => applyRecoSuggestion(s)}
                    >
                      {s.slice(0, 20)}...
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reco grid */}
          {domaineId && (
            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-8">
                        #
                      </th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-48">
                        Élève
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground w-24">
                        Moy. domaine
                      </th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                        Recommandation (توصيات المدرس)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {localRecos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-16 text-center text-muted-foreground"
                        >
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">
                            Aucun élève dans cette classe
                          </p>
                        </td>
                      </tr>
                    ) : (
                      localRecos.map((r, idx) => {
                        const moy = moyenneDomaineByStudent.get(r.studentId);
                        const moyColor =
                          moy == null
                            ? "text-muted-foreground"
                            : moy >= 16
                            ? "text-emerald-600"
                            : moy >= 12
                            ? "text-green-600"
                            : moy >= 10
                            ? "text-foreground"
                            : moy >= 8
                            ? "text-orange-600"
                            : "text-red-600";
                        return (
                          <tr
                            key={r.studentId}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-2 px-4 text-muted-foreground text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-4 font-medium text-foreground">
                              {r.studentName}
                            </td>
                            <td className={`py-2 px-4 text-center font-semibold tabular-nums ${moyColor}`}>
                              {moy != null ? moy.toFixed(2) : "—"}
                            </td>
                            <td className="py-2 px-4">
                              <Input
                                value={r.texte}
                                onChange={(e) =>
                                  handleRecoChange(r.studentId, e.target.value)
                                }
                                placeholder="Saisir la recommandation..."
                                dir="rtl"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {localRecos.length > 0 && (
                <div className="border-t border-border px-4 py-3 flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleSaveRecos}
                    disabled={upsertRecos.isPending}
                  >
                    <Save className="h-4 w-4" />
                    Sauvegarder les recommandations
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ OBSERVATIONS MODE ═══ */}
      {ready && viewMode === "observations" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-8">
                      #
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground w-44">
                      Élève
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                      Comportement (ملاحظات السلوك)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localObs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                          Aucun élève dans cette classe
                        </p>
                      </td>
                    </tr>
                  ) : (
                    localObs.map((o, idx) => (
                      <tr
                        key={o.studentId}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-4 text-muted-foreground text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 font-medium text-foreground">
                          {o.studentName}
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={o.comportement}
                            onChange={(e) =>
                              handleObsChange(
                                o.studentId,
                                "comportement",
                                e.target.value
                              )
                            }
                            placeholder="Observation sur le comportement..."
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {localObs.length > 0 && (
              <div className="border-t border-border px-4 py-3 flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSaveObs}
                  disabled={upsertObs.isPending}
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder les observations
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
