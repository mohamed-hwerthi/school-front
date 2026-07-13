import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  XCircle,
  ClipboardList,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useQuizzes,
  useQuizDetail,
  useStartTentative,
  useSubmitTentative,
  useTentativeDetail,
} from "@/hooks/useQuiz";
import type {
  Quiz,
  QuizDetail,
  QuestionDTO,
  Tentative,
  ReponseItem,
  StatutQuiz,
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

type PageView = "list" | "exam" | "result";

export default function QuizPassationPage() {
  const [view, setView] = useState<PageView>("list");
  const [eleveId, setEleveId] = useState<number>(1);
  const [selectedQuizId, setSelectedQuizId] = useState<number | undefined>();
  const [tentativeId, setTentativeId] = useState<number | undefined>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, ReponseItem>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Data
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes(undefined, "PUBLIE");
  const { data: quizDetail } = useQuizDetail(selectedQuizId);
  const { data: tentativeResult } = useTentativeDetail(tentativeId);

  // Mutations
  const startTentative = useStartTentative();
  const submitTentative = useSubmitTentative();

  // Timer
  useEffect(() => {
    if (view !== "exam" || !quizDetail) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, quizDetail]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const questions = useMemo(() => {
    if (!quizDetail) return [];
    return quizDetail.questions.sort((a, b) => a.ordre - b.ordre);
  }, [quizDetail]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuizId(quiz.id);
    startTentative.mutate(
      { quizId: quiz.id, eleveId },
      {
        onSuccess: (t) => {
          setTentativeId(t.id);
          setAnswers({});
          setCurrentQuestionIndex(0);
          setTimeLeft(quiz.dureeMinutes * 60);
          setView("exam");
        },
      }
    );
  };

  const handleAnswerChange = (questionId: string, answer: Partial<ReponseItem>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, ...prev[questionId], ...answer },
    }));
  };

  const handleSubmit = () => {
    if (!tentativeId) return;

    const reponses = Object.values(answers).map((a) => ({
      questionId: a.questionId,
      choixId: a.choixId,
      reponseTexte: a.reponseTexte,
    }));

    submitTentative.mutate(
      { tentativeId, reponses },
      {
        onSuccess: (result) => {
          setConfirmSubmitOpen(false);
          setView("result");
        },
      }
    );
  };

  const handleAutoSubmit = useCallback(() => {
    if (!tentativeId) return;

    const reponses = Object.values(answers).map((a) => ({
      questionId: a.questionId,
      choixId: a.choixId,
      reponseTexte: a.reponseTexte,
    }));

    submitTentative.mutate(
      { tentativeId, reponses },
      {
        onSuccess: () => {
          setView("result");
        },
      }
    );
  }, [tentativeId, answers, submitTentative]);

  const answeredCount = Object.keys(answers).length;

  if (quizzesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Results View ──
  if (view === "result" && tentativeResult) {
    const passed = tentativeResult.scorePourcentage != null && tentativeResult.scorePourcentage >= 50;
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="rounded-xl border border-border/50 bg-card p-8 shadow-sm text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full mx-auto ${passed ? "bg-emerald-100" : "bg-red-100"}`}>
            {passed ? <Trophy className="h-8 w-8 text-emerald-600" /> : <AlertTriangle className="h-8 w-8 text-red-600" />}
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">
            {passed ? "Felicitations !" : "Examen termine"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {passed ? "Vous avez reussi cet examen." : "Vous pouvez reessayer si des tentatives sont disponibles."}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="mt-1 font-heading text-2xl font-bold">{tentativeResult.score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Pourcentage</p>
              <p className="mt-1 font-heading text-2xl font-bold">{tentativeResult.scorePourcentage?.toFixed(0) ?? 0}%</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Temps</p>
              <p className="mt-1 font-heading text-2xl font-bold">
                {tentativeResult.tempsPasseSecondes ? `${Math.floor(tentativeResult.tempsPasseSecondes / 60)}m` : "-"}
              </p>
            </div>
          </div>

          {/* Show answers if afficherResultats */}
          {tentativeResult.reponses && tentativeResult.reponses.length > 0 && (
            <div className="mt-6 text-start space-y-3">
              <h3 className="font-semibold text-foreground">Detail des reponses</h3>
              {tentativeResult.reponses.map((r, idx) => (
                <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                  <div className="mt-0.5">
                    {r.correct ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : r.correct === false ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.questionTexte}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.reponseTexte ?? `Choix #${r.choixId ?? "-"}`} - {r.pointsObtenus} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button className="mt-6" onClick={() => { setView("list"); setTentativeId(undefined); setSelectedQuizId(undefined); }}>
            Retour a la liste
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Exam View ──
  if (view === "exam" && quizDetail && currentQuestion) {
    const isTimeCritical = timeLeft < 60;

    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
        {/* Timer Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">{quizDetail.titre}</h2>
            <p className="text-xs text-muted-foreground">Question {currentQuestionIndex + 1} / {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold ${isTimeCritical ? "bg-red-100 text-red-700 animate-pulse" : "bg-blue-50 text-blue-700"}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </motion.div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isAnswered
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-3">
                {currentQuestion.typeQuestion === "QCM" ? "QCM" :
                 currentQuestion.typeQuestion === "VRAI_FAUX" ? "Vrai/Faux" :
                 currentQuestion.typeQuestion === "TEXTE_LIBRE" ? "Texte libre" : "Reponse courte"}
              </Badge>
              <p className="text-lg font-medium text-foreground">{currentQuestion.texte}</p>
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">{currentQuestion.points} pts</span>
          </div>

          <div className="mt-6 space-y-3">
            {/* QCM / VRAI_FAUX */}
            {(currentQuestion.typeQuestion === "QCM" || currentQuestion.typeQuestion === "VRAI_FAUX") && (
              currentQuestion.choix.map((choix) => {
                const isSelected = answers[currentQuestion.id]?.choixId === choix.id;
                return (
                  <button
                    key={choix.id}
                    onClick={() => handleAnswerChange(currentQuestion.id, { choixId: choix.id })}
                    className={`w-full flex items-center gap-3 rounded-lg border p-4 text-start transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm">{choix.texte}</span>
                  </button>
                );
              })
            )}

            {/* TEXTE_LIBRE */}
            {currentQuestion.typeQuestion === "TEXTE_LIBRE" && (
              <Textarea
                value={answers[currentQuestion.id]?.reponseTexte ?? ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, { reponseTexte: e.target.value })}
                placeholder="Redigez votre reponse..."
                rows={6}
                className="w-full"
              />
            )}

            {/* REPONSE_COURTE */}
            {currentQuestion.typeQuestion === "REPONSE_COURTE" && (
              <Input
                value={answers[currentQuestion.id]?.reponseTexte ?? ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, { reponseTexte: e.target.value })}
                placeholder="Votre reponse..."
                className="w-full"
              />
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((i) => i - 1)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Precedente
          </Button>

          <p className="text-sm text-muted-foreground">
            {answeredCount} / {questions.length} repondue{answeredCount !== 1 ? "s" : ""}
          </p>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex((i) => i + 1)}
              className="gap-1.5"
            >
              Suivante
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              Soumettre
            </Button>
          )}
        </div>

        {/* Submit Confirmation */}
        <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmer la soumission</DialogTitle>
              <DialogDescription>
                Vous avez repondu a {answeredCount} question{answeredCount !== 1 ? "s" : ""} sur {questions.length}.
                {answeredCount < questions.length && " Certaines questions n'ont pas de reponse."}
                {" "}Voulez-vous soumettre vos reponses ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2">
              <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={submitTentative.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {submitTentative.isPending ? "Soumission..." : "Soumettre"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Passer un examen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Selectionnez un quiz pour commencer</p>
      </motion.div>

      {/* Eleve ID Input */}
      <div className="flex items-center gap-3">
        <Label htmlFor="eleveIdInput" className="whitespace-nowrap">Votre ID Eleve:</Label>
        <Input
          id="eleveIdInput"
          type="number"
          value={eleveId}
          onChange={(e) => setEleveId(e.target.value)}
          className="w-32"
        />
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border/50 bg-card shadow-sm py-16 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun quiz disponible</p>
          </div>
        ) : (
          quizzes.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{quiz.titre}</h3>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quiz.description}</p>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[quiz.statut]}`}>
                  {STATUT_LABELS[quiz.statut]}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {quiz.dureeMinutes} min
                </div>
                <div>{quiz.totalQuestions} question{quiz.totalQuestions !== 1 ? "s" : ""}</div>
                <div>{quiz.tentativesMax} tentative{quiz.tentativesMax !== 1 ? "s" : ""}</div>
              </div>
              <Button
                className="mt-4 w-full gap-1.5"
                onClick={() => handleStartQuiz(quiz)}
                disabled={startTentative.isPending}
              >
                {startTentative.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4" />
                )}
                Commencer
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
