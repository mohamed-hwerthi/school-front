import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  User,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useTeachers } from "@/hooks/useTeachers";
import {
  useTeacherEvaluations,
  useCreateTeacherEvaluation,
  useUpdateTeacherEvaluation,
  useDeleteTeacherEvaluation,
  useTeacherEvaluationStats,
} from "@/hooks/useTeacherEvaluations";
import type { TeacherEvaluation } from "@/types/teacher-evaluation";
import { getSelectedAnneeScolaire } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

// CRITERIA is defined inside the component to access t()

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function TeacherEvaluationsPage() {
  const { t } = useLanguage();

  const CRITERIA = [
    { key: "ponctualite" as const, label: t("teacherEval.punctuality") },
    { key: "pedagogie" as const, label: t("teacherEval.pedagogy") },
    { key: "discipline" as const, label: t("teacherEval.disciplineScore") },
    { key: "communication" as const, label: t("teacherEval.communication") },
    { key: "implication" as const, label: t("teacherEval.involvement") },
  ];

  // 0 = "all teachers" (default view: list every teacher's evaluations)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | number>(0);
  const [anneeScolaire, setAnneeScolaire] = useState(getSelectedAnneeScolaire());
  const [activeTab, setActiveTab] = useState("evaluations");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    trimestre: 1,
    ponctualite: 3,
    pedagogie: 3,
    discipline: 3,
    communication: 3,
    implication: 3,
    evaluatorName: "",
    commentaire: "",
  });

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { teachers, isLoading: loadingTeachers } = useTeachers();
  // When no teacher is selected, fetch all evaluations for the current année.
  // When one is selected, scope to that teacher only.
  const { data: evaluations = [], isLoading: loadingEvaluations } =
    useTeacherEvaluations(
      selectedTeacherId
        ? { teacherId: selectedTeacherId, anneeScolaire }
        : { anneeScolaire }
    );

  // Group evaluations by teacher for the "all teachers" view
  const evaluationsByTeacher = teachers
    .map((tc) => ({
      teacher: tc,
      evals: evaluations.filter((e) => e.teacherId === tc.id),
    }))
    .filter((g) => g.evals.length > 0);
  const { data: stats } = useTeacherEvaluationStats(selectedTeacherId);
  const createMutation = useCreateTeacherEvaluation();
  const updateMutation = useUpdateTeacherEvaluation();
  const deleteMutation = useDeleteTeacherEvaluation();

  const radarData = stats
    ? [
        { subject: "Ponctualite", value: stats.avgPonctualite, fullMark: 5 },
        { subject: "Pedagogie", value: stats.avgPedagogie, fullMark: 5 },
        { subject: "Discipline", value: stats.avgDiscipline, fullMark: 5 },
        { subject: "Communication", value: stats.avgCommunication, fullMark: 5 },
        { subject: "Implication", value: stats.avgImplication, fullMark: 5 },
      ]
    : [];

  const openCreateForm = () => {
    setEditId(null);
    setFormData({
      trimestre: 1,
      ponctualite: 3,
      pedagogie: 3,
      discipline: 3,
      communication: 3,
      implication: 3,
      evaluatorName: "",
      commentaire: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (ev: TeacherEvaluation) => {
    setEditId(ev.id);
    setFormData({
      trimestre: ev.trimestre,
      ponctualite: ev.ponctualite ?? 3,
      pedagogie: ev.pedagogie ?? 3,
      discipline: ev.discipline ?? 3,
      communication: ev.communication ?? 3,
      implication: ev.implication ?? 3,
      evaluatorName: ev.evaluatorName ?? "",
      commentaire: ev.commentaire ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedTeacherId) return;
    const payload = {
      teacherId: selectedTeacherId,
      evaluatorId: null,
      evaluatorName: formData.evaluatorName || null,
      anneeScolaire,
      trimestre: formData.trimestre,
      ponctualite: formData.ponctualite,
      pedagogie: formData.pedagogie,
      discipline: formData.discipline,
      communication: formData.communication,
      implication: formData.implication,
      commentaire: formData.commentaire,
    };
    if (editId !== null) {
      updateMutation.mutate(
        { id: editId, data: payload },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  if (loadingTeachers) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            {t("teacherEval.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("teacherEval.title")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            placeholder={getSelectedAnneeScolaire()}
            className="w-32"
          />
          {selectedTeacherId && (
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-primary shadow-btn"
              onClick={openCreateForm}
            >
              <Plus className="h-4 w-4" />
              {t("teacherEval.evaluate")}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Teacher selector */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
      >
        <Label className="text-sm font-medium mb-2 block">
          {t("teacherEval.chooseTeacher")}
        </Label>
        <Select
          value={selectedTeacherId ? String(selectedTeacherId) : "all"}
          onValueChange={(v) => setSelectedTeacherId(v === "all" ? 0 : v)}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder={t("teacherEval.chooseTeacher")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les enseignants</SelectItem>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.prenom} {t.nom} - {t.specialite}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* All-teachers default view ─────────────────────────── */}
      {!selectedTeacherId && (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {loadingEvaluations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : evaluationsByTeacher.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card py-10 text-center text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune évaluation pour {anneeScolaire}</p>
              <p className="text-xs mt-1">
                Sélectionnez un enseignant pour ajouter une évaluation.
              </p>
            </div>
          ) : (
            evaluationsByTeacher.map(({ teacher, evals }) => {
              // Average across all evaluations for this teacher
              const avgGlobal =
                evals.reduce((s, e) => s + (e.noteGlobale ?? 0), 0) / evals.length;
              return (
                <div
                  key={teacher.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  title="Voir le détail"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shrink-0">
                        {teacher.prenom[0]}
                        {teacher.nom[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-bold text-foreground truncate">
                          {teacher.prenom} {teacher.nom}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {teacher.specialite}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">
                        {evals.length} évaluation{evals.length > 1 ? "s" : ""}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary">
                        {avgGlobal.toFixed(1)}/5
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-border/30">
                    {CRITERIA.map((c) => {
                      const avg =
                        evals.reduce((s, e) => s + (e[c.key] ?? 0), 0) /
                        evals.length;
                      return (
                        <div key={c.key} className="text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">
                            {c.label}
                          </p>
                          <div className="flex items-center justify-center gap-0.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold tabular-nums">
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Single-teacher detail view ─────────────────────────── */}
      {selectedTeacherId && selectedTeacher && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                  {selectedTeacher.prenom[0]}
                  {selectedTeacher.nom[0]}
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    {selectedTeacher.prenom} {selectedTeacher.nom}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedTeacher.specialite}
                  </p>
                </div>
              </div>
              <TabsList>
                <TabsTrigger value="evaluations" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {t("nav.evaluations")}
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {t("teacherEval.performance")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Evaluations Tab */}
            <TabsContent value="evaluations" className="space-y-3">
              {loadingEvaluations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : evaluations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("teacherEval.noEvaluation")}</p>
                  <p className="text-xs mt-1">
                    {t("teacherEval.evaluate")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluations.map((ev: TeacherEvaluation) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-border/50 bg-muted/10 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {t("common.trimester")} {ev.trimestre}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary">
                              {ev.noteGlobale}/5
                            </Badge>
                          </div>
                          {ev.evaluatorName && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {t("teacherEval.evaluator")}: {ev.evaluatorName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {ev.createdAt
                              ? new Date(ev.createdAt).toLocaleDateString("fr-FR")
                              : ""}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEditForm(ev)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={() => setDeleteId(ev.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {CRITERIA.map((c) => (
                          <div key={c.key} className="text-center">
                            <p className="text-[11px] text-muted-foreground mb-1">
                              {c.label}
                            </p>
                            <StarRating
                              value={ev[c.key] ?? 0}
                              readonly
                            />
                          </div>
                        ))}
                      </div>
                      {ev.commentaire && (
                        <p className="text-sm text-muted-foreground mt-3 italic border-t border-border/30 pt-2">
                          "{ev.commentaire}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              {stats && stats.totalEvaluations > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center">
                      <p className="font-heading text-2xl font-bold text-primary">
                        {stats.avgGlobale}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("teacherEval.performance")} /5
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {stats.totalEvaluations}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("nav.evaluations")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center col-span-2 md:col-span-1">
                      <p className="font-heading text-2xl font-bold text-emerald-600">
                        {stats.avgPedagogie}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("teacherEval.pedagogy")} /5
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
                      {t("teacherEval.performance")}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(220 15% 90%)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 5]}
                          tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                        />
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke="hsl(230 75% 57%)"
                          fill="hsl(230 75% 57%)"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {CRITERIA.map((c) => {
                      const key = `avg${c.key.charAt(0).toUpperCase() + c.key.slice(1)}` as keyof typeof stats;
                      const val = stats[key] as number;
                      return (
                        <div
                          key={c.key}
                          className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center"
                        >
                          <p className="text-[11px] text-muted-foreground mb-1">
                            {c.label}
                          </p>
                          <p className="font-heading text-xl font-bold text-foreground">
                            {val}
                          </p>
                          <div className="w-full bg-border/30 rounded-full h-1.5 mt-2">
                            <div
                              className="bg-primary rounded-full h-1.5 transition-all"
                              style={{ width: `${(val / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {t("common.noData")}
                  </p>
                  <p className="text-xs mt-1">
                    {t("teacherEval.evaluate")}
                  </p>
                </div>
              )}
            </TabsContent>
          </motion.div>
        </Tabs>
      )}

      {/* Create / Edit Evaluation Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId !== null
                ? t("teacherEval.editEvaluation") || "Modifier l'évaluation"
                : t("teacherEval.newEvaluation")}
            </DialogTitle>
            <DialogDescription>
              {t("teacherEval.title")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.trimester")}</Label>
                <Select
                  value={String(formData.trimestre)}
                  onValueChange={(v) =>
                    setFormData({ ...formData, trimestre: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("common.trimester1")}</SelectItem>
                    <SelectItem value="2">{t("common.trimester2")}</SelectItem>
                    <SelectItem value="3">{t("common.trimester3")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("teacherEval.evaluator")}</Label>
                <Input
                  value={formData.evaluatorName}
                  onChange={(e) =>
                    setFormData({ ...formData, evaluatorName: e.target.value })
                  }
                  placeholder={t("teacherEval.evaluatorName")}
                />
              </div>
            </div>

            {CRITERIA.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between py-1"
              >
                <Label className="text-sm">{c.label}</Label>
                <StarRating
                  value={formData[c.key]}
                  onChange={(v) => setFormData({ ...formData, [c.key]: v })}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Commentaire</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData({ ...formData, commentaire: e.target.value })
                }
                placeholder="Observations sur l'enseignant..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l'evaluation</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer cette evaluation ? Cette action
              est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId !== null)
                  deleteMutation.mutate(deleteId, {
                    onSuccess: () => setDeleteId(null),
                  });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
