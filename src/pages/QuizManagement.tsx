import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { quizSchema, questionSchema } from "@/lib/quiz-schema";
import {
  ClipboardList,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  ListPlus,
  CheckCircle,
  XCircle,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useQuizzes,
  useCreateQuiz,
  useUpdateQuiz,
  usePublishQuiz,
  useDeleteQuiz,
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useTentativesByQuiz,
  useQuizStats,
} from "@/hooks/useQuiz";
import { useClasses } from "@/hooks/useClasses";
import { useModules } from "@/hooks/useModules";
import { useNiveaux } from "@/hooks/useNiveaux";
import { useAllStudents } from "@/hooks/useStudents";
import { toast } from "sonner";
import type {
  Quiz,
  CreateQuizRequest,
  QuestionDTO,
  CreateQuestionRequest,
  ChoixReponseDTO,
  StatutQuiz,
  TypeQuestion,
  Tentative,
} from "@/types/quiz";

const STATUT_COLORS: Record<StatutQuiz, string> = {
  BROUILLON: "bg-gray-100 text-gray-700",
  PUBLIE: "bg-emerald-100 text-emerald-700",
  EN_COURS: "bg-blue-100 text-blue-700",
  TERMINE: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<StatutQuiz, string> = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publie",
  EN_COURS: "En cours",
  TERMINE: "Termine",
};

const TYPE_QUESTION_LABELS: Record<TypeQuestion, string> = {
  QCM: "QCM",
  VRAI_FAUX: "Vrai/Faux",
  TEXTE_LIBRE: "Texte libre",
  REPONSE_COURTE: "Reponse courte",
};

const ITEMS_PER_PAGE = 8;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const QUIZ_TABS = ["quizzes", "builder", "results"] as const;

export default function QuizManagementPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    (QUIZ_TABS as readonly string[]).includes(initialTab ?? "") ? (initialTab as string) : "quizzes"
  );
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "quizzes" }, { replace: true });
    }
  }, []);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && (QUIZ_TABS as readonly string[]).includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Quiz form
  const [quizFormOpen, setQuizFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<CreateQuizRequest>({
    titre: "",
    dureeMinutes: 60,
    noteTotale: 20,
    tentativesMax: 1,
    statut: "BROUILLON",
  });

  // Quiz builder
  const [selectedQuizId, setSelectedQuizId] = useState<string | undefined>();
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDTO | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateQuestionRequest>({
    texte: "",
    typeQuestion: "QCM",
    points: 1,
    ordre: 1,
    choix: [],
  });
  const [quizErrors, setQuizErrors] = useState<FormErrors>({});
  const [questionErrors, setQuestionErrors] = useState<FormErrors>({});

  // Results
  const [selectedResultQuizId, setSelectedResultQuizId] = useState<string | undefined>();
  const [tentativesPage, setTentativesPage] = useState(0);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<QuestionDTO | null>(null);

  // Data
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(selectedQuizId);
  const { data: tentatives = [], isLoading: tentativesLoading } = useTentativesByQuiz(selectedResultQuizId);
  const { data: quizStats } = useQuizStats(selectedResultQuizId);
  const { data: allStudents = [] } = useAllStudents();
  const studentsById = useMemo(
    () => new Map(allStudents.map((s) => [s.id, s])),
    [allStudents]
  );
  const tentativesTotalPages = Math.max(1, Math.ceil(tentatives.length / ITEMS_PER_PAGE));
  const paginatedTentatives = tentatives.slice(
    tentativesPage * ITEMS_PER_PAGE,
    (tentativesPage + 1) * ITEMS_PER_PAGE
  );
  const { niveaux } = useNiveaux();
  const [quizNiveauId, setQuizNiveauId] = useState<string | undefined>();
  const { data: allClasses = [] } = useClasses();
  const { data: allModules = [] } = useModules();
  const quizClasses = useMemo(
    () => (quizNiveauId ? allClasses.filter((c) => c.niveauId === quizNiveauId) : allClasses),
    [allClasses, quizNiveauId]
  );
  const quizModules = useMemo(
    () => (quizNiveauId ? allModules.filter((m) => m.niveauId === quizNiveauId) : allModules),
    [allModules, quizNiveauId]
  );

  // Re-validate on change once errors are showing
  useEffect(() => {
    if (Object.keys(quizErrors).length === 0) return;
    const result = validate(quizSchema, quizForm);
    setQuizErrors(result.ok ? {} : result.errors);
  }, [quizForm]);

  useEffect(() => {
    setTentativesPage(0);
  }, [selectedResultQuizId]);

  // Mutations
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const publishQuiz = usePublishQuiz();
  const deleteQuiz = useDeleteQuiz();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    if (!search) return quizzes;
    const q = search.toLowerCase();
    return quizzes.filter(
      (qz) =>
        qz.titre.toLowerCase().includes(q) ||
        qz.statut.toLowerCase().includes(q)
    );
  }, [quizzes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE));
  const paginatedQuizzes = filteredQuizzes.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const stats = [
    { label: t("quiz.totalQuiz"), value: quizzes.length, icon: ClipboardList, color: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("common.published"), value: quizzes.filter((q) => q.statut === "PUBLIE" || q.statut === "EN_COURS").length, icon: Send, color: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("quiz.totalQuestions"), value: quizzes.reduce((a, q) => a + q.totalQuestions, 0), icon: ListPlus, color: "bg-purple-50", textColor: "text-purple-700" },
  ];

  const openCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ titre: "", dureeMinutes: 60, noteTotale: 20, tentativesMax: 1, statut: "BROUILLON" });
    setQuizNiveauId(undefined);
    setQuizFormOpen(true);
  };

  const openEditQuiz = (q: Quiz) => {
    setEditingQuiz(q);
    setQuizForm({
      titre: q.titre,
      description: q.description ?? undefined,
      moduleId: q.moduleId ?? undefined,
      classeId: q.classeId ?? undefined,
      enseignantId: q.enseignantId ?? undefined,
      dureeMinutes: q.dureeMinutes,
      noteTotale: q.noteTotale,
      melangerQuestions: q.melangerQuestions,
      melangerReponses: q.melangerReponses,
      afficherResultats: q.afficherResultats,
      tentativesMax: q.tentativesMax,
      dateDebut: q.dateDebut ?? undefined,
      dateFin: q.dateFin ?? undefined,
      statut: q.statut,
    });
    const niveauFromClasse = q.classeId ? allClasses.find((c) => c.id === q.classeId)?.niveauId : undefined;
    const niveauFromModule = q.moduleId ? allModules.find((m) => m.id === q.moduleId)?.niveauId : undefined;
    setQuizNiveauId(niveauFromClasse ?? niveauFromModule);
    setQuizFormOpen(true);
  };

  const onApiError = (setter: (e: FormErrors) => void) => (err: Error & { response?: { status?: number; data?: { message?: string } } }) => {
    setter({ _root: err.response?.data?.message ?? "Erreur lors de l'enregistrement" });
  };

  const handleSaveQuiz = () => {
    const result = validate(quizSchema, quizForm);
    if (!result.ok) { setQuizErrors(result.errors); return; }
    setQuizErrors({});
    if (editingQuiz) {
      updateQuiz.mutate({ id: editingQuiz.id, data: quizForm }, {
        onSuccess: () => setQuizFormOpen(false),
        onError: onApiError(setQuizErrors),
      });
    } else {
      createQuiz.mutate(quizForm, {
        onSuccess: () => setQuizFormOpen(false),
        onError: onApiError(setQuizErrors),
      });
    }
  };

  const handleDeleteQuiz = () => {
    if (!deleteTarget) return;
    deleteQuiz.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Quiz supprime avec succes");
        setDeleteTarget(null);
      },
      onError: (err: Error & { response?: { data?: { message?: string } } }) =>
        toast.error(err.response?.data?.message ?? "Erreur lors de la suppression"),
    });
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    const nextOrdre = questions.length + 1;
    setQuestionForm({
      texte: "",
      typeQuestion: "QCM",
      points: 1,
      ordre: nextOrdre,
      choix: [
        { texte: "", correct: false, ordre: 1 },
        { texte: "", correct: false, ordre: 2 },
      ],
    });
    setQuestionFormOpen(true);
  };

  const openEditQuestion = (q: QuestionDTO) => {
    setEditingQuestion(q);
    setQuestionForm({
      texte: q.texte,
      typeQuestion: q.typeQuestion,
      points: q.points,
      ordre: q.ordre,
      explication: q.explication ?? undefined,
      imageUrl: q.imageUrl ?? undefined,
      obligatoire: q.obligatoire,
      choix: q.choix.map((c) => ({ ...c })),
    });
    setQuestionFormOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!selectedQuizId) return;
    const result = validate(questionSchema, questionForm);
    if (!result.ok) { setQuestionErrors(result.errors); return; }
    setQuestionErrors({});
    if (editingQuestion) {
      updateQuestion.mutate({ quizId: selectedQuizId, questionId: editingQuestion.id, data: questionForm }, {
        onSuccess: () => setQuestionFormOpen(false),
        onError: onApiError(setQuestionErrors),
      });
    } else {
      createQuestion.mutate({ quizId: selectedQuizId, data: questionForm }, {
        onSuccess: () => setQuestionFormOpen(false),
        onError: onApiError(setQuestionErrors),
      });
    }
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionTarget || !selectedQuizId) return;
    deleteQuestion.mutate({ quizId: selectedQuizId, questionId: deleteQuestionTarget.id }, {
      onSuccess: () => setDeleteQuestionTarget(null),
    });
  };

  const addChoix = () => {
    const choix = questionForm.choix ?? [];
    setQuestionForm({
      ...questionForm,
      choix: [...choix, { texte: "", correct: false, ordre: choix.length + 1 }],
    });
  };

  const removeChoix = (idx: number) => {
    const choix = (questionForm.choix ?? []).filter((_, i) => i !== idx).map((c, i) => ({ ...c, ordre: i + 1 }));
    setQuestionForm({ ...questionForm, choix });
  };

  const updateChoix = (idx: number, field: keyof ChoixReponseDTO, value: string | boolean | number) => {
    const choix = [...(questionForm.choix ?? [])];
    choix[idx] = { ...choix[idx], [field]: value };
    // For VRAI_FAUX, only one can be correct
    if (field === "correct" && value === true && questionForm.typeQuestion === "VRAI_FAUX") {
      choix.forEach((c, i) => { if (i !== idx) c.correct = false; });
    }
    setQuestionForm({ ...questionForm, choix });
  };

  const isLoading = quizzesLoading;
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">{t("quiz.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("quiz.subtitle")}</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={openCreateQuiz}>
          <Plus className="h-4 w-4" />
          {t("quiz.newQuiz")}
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(0); setSearchParams({ tab: v }, { replace: true }); }}>
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
          <TabsList>
            <TabsTrigger value="quizzes">Quiz</TabsTrigger>
            <TabsTrigger value="builder">Constructeur</TabsTrigger>
            <TabsTrigger value="results">Resultats</TabsTrigger>
          </TabsList>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {activeTab === "quizzes" && (
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} placeholder="Rechercher..." className="ps-9" />
              </div>
            )}
            {activeTab === "builder" && (
              <Select value={selectedQuizId ?? ""} onValueChange={(v) => setSelectedQuizId(v || undefined)}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selectionner un quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>{q.titre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeTab === "results" && (
              <Select value={selectedResultQuizId ?? ""} onValueChange={(v) => setSelectedResultQuizId(v || undefined)}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selectionner un quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>{q.titre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {search && activeTab === "quizzes" && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCurrentPage(0); }} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                Reinitialiser
              </Button>
            )}
          </div>
        </motion.div>

        {/* Quizzes Table */}
        <TabsContent value="quizzes">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Titre</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Duree</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Questions</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Tentatives</th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun quiz trouve</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedQuizzes.map((quiz) => (
                      <tr key={quiz.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{quiz.titre}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{quiz.dureeMinutes} min</td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{quiz.totalQuestions}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{quiz.totalTentatives}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[quiz.statut]}`}>
                            {STATUT_LABELS[quiz.statut]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="hidden sm:flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditQuiz(quiz)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {quiz.statut === "BROUILLON" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={() => publishQuiz.mutate(quiz.id)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => { setSelectedResultQuizId(quiz.id); setActiveTab("results"); setSearchParams({ tab: "results" }, { replace: true }); }}>
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(quiz)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditQuiz(quiz)}>
                                <Edit className="h-4 w-4 me-2" /> Modifier
                              </DropdownMenuItem>
                              {quiz.statut === "BROUILLON" && (
                                <DropdownMenuItem onClick={() => publishQuiz.mutate(quiz.id)}>
                                  <Send className="h-4 w-4 me-2" /> Publier
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { setSelectedResultQuizId(quiz.id); setActiveTab("results"); setSearchParams({ tab: "results" }, { replace: true }); }}>
                                <BarChart3 className="h-4 w-4 me-2" /> Resultats
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(quiz)} className="text-red-600">
                                <Trash2 className="h-4 w-4 me-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Page {currentPage + 1} sur {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Quiz Builder */}
        <TabsContent value="builder">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            {!selectedQuizId ? (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm py-16 text-center text-muted-foreground">
                <ListPlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selectionnez un quiz pour gerer ses questions</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Questions ({questions.length})
                  </h2>
                  <Button size="sm" className="gap-1.5" onClick={openCreateQuestion}>
                    <Plus className="h-4 w-4" />
                    Ajouter une question
                  </Button>
                </div>
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-card shadow-sm py-16 text-center text-muted-foreground">
                    <ListPlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucune question</p>
                    <p className="text-sm mt-1">Commencez a ajouter des questions a ce quiz</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground shrink-0">
                              {q.ordre}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{q.texte}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{TYPE_QUESTION_LABELS[q.typeQuestion]}</Badge>
                                <span className="text-xs text-muted-foreground">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                              </div>
                              {(q.typeQuestion === "QCM" || q.typeQuestion === "VRAI_FAUX") && q.choix.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {q.choix.map((c) => (
                                    <div key={c.id ?? c.ordre} className="flex items-center gap-2 text-sm">
                                      {c.correct ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <XCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                      )}
                                      <span className={c.correct ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                                        {c.texte}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditQuestion(q)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteQuestionTarget(q)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            {!selectedResultQuizId ? (
              <div className="rounded-xl border border-border/50 bg-card shadow-sm py-16 text-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selectionnez un quiz pour voir les resultats</p>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                {quizStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Tentatives</p>
                      <p className="mt-1 font-heading text-2xl font-bold">{quizStats.totalTentatives}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Moyenne</p>
                      <p className="mt-1 font-heading text-2xl font-bold">{quizStats.moyenneScore?.toFixed(1) ?? "-"}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Taux de reussite</p>
                      <p className="mt-1 font-heading text-2xl font-bold">{quizStats.tauxReussite?.toFixed(0) ?? 0}%</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground">Distribution</p>
                      <div className="mt-1 flex items-end gap-1 h-8">
                        {quizStats.distributionNotes && Object.entries(quizStats.distributionNotes).map(([range, count]) => (
                          <div key={range} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${Math.max(4, (Number(count) / Math.max(quizStats.totalTentatives, 1)) * 32)}px` }} title={`${range}: ${count}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tentatives table */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                  {tentativesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Élève</th>
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Score</th>
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Pourcentage</th>
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">Temps</th>
                            <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tentatives.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-16 text-center text-muted-foreground">
                                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Aucune tentative</p>
                              </td>
                            </tr>
                          ) : (
                            paginatedTentatives.map((t) => {
                              const student = studentsById.get(t.eleveId);
                              return (
                              <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="py-3 px-4 font-medium text-foreground">
                                  {student ? (
                                    <div className="flex flex-col">
                                      <span>{student.prenom} {student.nom}</span>
                                      {student.email && (
                                        <span className="text-xs text-muted-foreground">{student.email}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span>#{t.eleveId}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                                  {new Date(t.dateDebut).toLocaleDateString("fr-FR")}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">{t.score != null ? t.score : "-"}</td>
                                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                                  {t.scorePourcentage != null ? `${t.scorePourcentage}%` : "-"}
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                                  {t.tempsPasseSecondes != null ? `${Math.floor(t.tempsPasseSecondes / 60)}m ${t.tempsPasseSecondes % 60}s` : "-"}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={
                                    t.statut === "CORRIGEE" ? "bg-emerald-100 text-emerald-700" :
                                    t.statut === "SOUMISE" ? "bg-blue-100 text-blue-700" :
                                    "bg-orange-100 text-orange-700"
                                  }>
                                    {t.statut === "CORRIGEE" ? "Corrigee" : t.statut === "SOUMISE" ? "Soumise" : "En cours"}
                                  </Badge>
                                </td>
                              </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {tentativesTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                      <p className="text-xs text-muted-foreground">Page {tentativesPage + 1} sur {tentativesTotalPages}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={tentativesPage === 0} onClick={() => setTentativesPage((p) => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={tentativesPage >= tentativesTotalPages - 1} onClick={() => setTentativesPage((p) => p + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Quiz Dialog */}
      <Dialog open={quizFormOpen} onOpenChange={setQuizFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Modifier le quiz" : "Nouveau quiz"}</DialogTitle>
            <DialogDescription>
              {editingQuiz ? "Modifiez les parametres du quiz." : "Configurez les parametres du nouveau quiz."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {quizErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{quizErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="quizTitre">Titre *</Label>
              <Input id="quizTitre" value={quizForm.titre} onChange={(e) => setQuizForm({ ...quizForm, titre: e.target.value })} placeholder="Titre du quiz" aria-invalid={!!quizErrors.titre} className={quizErrors.titre ? "border-red-500" : ""} />
              {quizErrors.titre && <p className="text-xs text-red-600">{quizErrors.titre}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quizDesc">Description</Label>
              <Textarea id="quizDesc" value={quizForm.description ?? ""} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} placeholder="Description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dureeMin">Durée (min) *</Label>
                <Input id="dureeMin" type="number" value={quizForm.dureeMinutes ?? 60} onChange={(e) => setQuizForm({ ...quizForm, dureeMinutes: Number(e.target.value) })} aria-invalid={!!quizErrors.dureeMinutes} className={quizErrors.dureeMinutes ? "border-red-500" : ""} />
                {quizErrors.dureeMinutes && <p className="text-xs text-red-600">{quizErrors.dureeMinutes}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="noteTotale">Note totale *</Label>
                <Input id="noteTotale" type="number" value={quizForm.noteTotale ?? 20} onChange={(e) => setQuizForm({ ...quizForm, noteTotale: Number(e.target.value) })} aria-invalid={!!quizErrors.noteTotale} className={quizErrors.noteTotale ? "border-red-500" : ""} />
                {quizErrors.noteTotale && <p className="text-xs text-red-600">{quizErrors.noteTotale}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tentativesMax">Tentatives max</Label>
                <Input id="tentativesMax" type="number" value={quizForm.tentativesMax ?? 1} onChange={(e) => setQuizForm({ ...quizForm, tentativesMax: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quizNiveau">Niveau</Label>
                <Select
                  value={quizNiveauId ?? "none"}
                  onValueChange={(v) => {
                    const nid = v === "none" ? undefined : v;
                    setQuizNiveauId(nid);
                    setQuizForm({ ...quizForm, classeId: undefined, moduleId: undefined });
                  }}
                >
                  <SelectTrigger id="quizNiveau"><SelectValue placeholder="Selectionner un niveau" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="classeId">Classe</Label>
                <Select
                  value={quizForm.classeId ?? "none"}
                  onValueChange={(v) => setQuizForm({ ...quizForm, classeId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger id="classeId"><SelectValue placeholder="Selectionner une classe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {quizClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="moduleIdQuiz">Matière</Label>
                <Select
                  value={quizForm.moduleId ?? "none"}
                  onValueChange={(v) => setQuizForm({ ...quizForm, moduleId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger id="moduleIdQuiz"><SelectValue placeholder="Selectionner une matière" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {quizModules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}{!quizNiveauId && m.niveauName ? ` (${m.niveauName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={quizForm.statut} onValueChange={(v) => setQuizForm({ ...quizForm, statut: v as StatutQuiz })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUT_LABELS) as StatutQuiz[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="melangerQ" checked={quizForm.melangerQuestions ?? false} onChange={(e) => setQuizForm({ ...quizForm, melangerQuestions: e.target.checked })} className="h-4 w-4 rounded border-border" />
                <Label htmlFor="melangerQ">Melanger les questions</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="melangerR" checked={quizForm.melangerReponses ?? false} onChange={(e) => setQuizForm({ ...quizForm, melangerReponses: e.target.checked })} className="h-4 w-4 rounded border-border" />
                <Label htmlFor="melangerR">Melanger les reponses</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="afficherRes" checked={quizForm.afficherResultats ?? true} onChange={(e) => setQuizForm({ ...quizForm, afficherResultats: e.target.checked })} className="h-4 w-4 rounded border-border" />
                <Label htmlFor="afficherRes">Afficher les resultats</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveQuiz} disabled={createQuiz.isPending || updateQuiz.isPending}>
              {(createQuiz.isPending || updateQuiz.isPending) ? "Enregistrement..." : (editingQuiz ? "Modifier" : "Creer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Question Dialog */}
      <Dialog open={questionFormOpen} onOpenChange={setQuestionFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Modifier la question" : "Ajouter une question"}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? "Modifiez la question et ses choix." : "Definissez la question et ses choix de reponse."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {questionErrors._root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{questionErrors._root}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="qTexte">Question *</Label>
              <Textarea id="qTexte" value={questionForm.texte} onChange={(e) => setQuestionForm({ ...questionForm, texte: e.target.value })} placeholder="Texte de la question..." rows={3} aria-invalid={!!questionErrors.texte} className={questionErrors.texte ? "border-red-500" : ""} />
              {questionErrors.texte && <p className="text-xs text-red-600">{questionErrors.texte}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={questionForm.typeQuestion} onValueChange={(v) => {
                  const tp = v as TypeQuestion;
                  let choix = questionForm.choix ?? [];
                  if (tp === "VRAI_FAUX") {
                    choix = [
                      { texte: "Vrai", correct: false, ordre: 1 },
                      { texte: "Faux", correct: false, ordre: 2 },
                    ];
                  } else if (tp === "TEXTE_LIBRE" || tp === "REPONSE_COURTE") {
                    choix = [];
                  }
                  setQuestionForm({ ...questionForm, typeQuestion: tp, choix });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_QUESTION_LABELS) as TypeQuestion[]).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_QUESTION_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qPoints">Points</Label>
                <Input id="qPoints" type="number" step="0.5" value={questionForm.points ?? 1} onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qOrdre">Ordre</Label>
                <Input id="qOrdre" type="number" value={questionForm.ordre} onChange={(e) => setQuestionForm({ ...questionForm, ordre: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qExplic">Explication (optionnel)</Label>
              <Textarea id="qExplic" value={questionForm.explication ?? ""} onChange={(e) => setQuestionForm({ ...questionForm, explication: e.target.value || undefined })} placeholder="Explication de la reponse correcte..." rows={2} />
            </div>

            {/* Choices for QCM and VRAI_FAUX */}
            {(questionForm.typeQuestion === "QCM" || questionForm.typeQuestion === "VRAI_FAUX") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Choix de reponse</Label>
                  {questionForm.typeQuestion === "QCM" && (
                    <Button variant="outline" size="sm" onClick={addChoix} className="gap-1">
                      <Plus className="h-3 w-3" /> Choix
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {(questionForm.choix ?? []).map((choix, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type={questionForm.typeQuestion === "QCM" ? "checkbox" : "radio"}
                        name="correct-choice"
                        checked={choix.correct}
                        onChange={(e) => updateChoix(idx, "correct", e.target.checked)}
                        className="h-4 w-4 shrink-0"
                      />
                      <Input
                        value={choix.texte}
                        onChange={(e) => updateChoix(idx, "texte", e.target.value)}
                        placeholder={`Choix ${idx + 1}`}
                        disabled={questionForm.typeQuestion === "VRAI_FAUX"}
                        className="flex-1"
                      />
                      {questionForm.typeQuestion === "QCM" && (questionForm.choix ?? []).length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 shrink-0" onClick={() => removeChoix(idx)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button onClick={handleSaveQuestion} disabled={createQuestion.isPending || updateQuestion.isPending}>
              {(createQuestion.isPending || updateQuestion.isPending) ? "Enregistrement..." : (editingQuestion ? "Modifier" : "Ajouter")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le quiz</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer "{deleteTarget?.titre}" ? Toutes les questions et tentatives seront supprimees.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteQuiz} disabled={deleteQuiz.isPending}>
              {deleteQuiz.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation */}
      <Dialog open={!!deleteQuestionTarget} onOpenChange={(open) => !open && setDeleteQuestionTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la question</DialogTitle>
            <DialogDescription>Etes-vous sur de vouloir supprimer cette question ?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteQuestion} disabled={deleteQuestion.isPending}>
              {deleteQuestion.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
