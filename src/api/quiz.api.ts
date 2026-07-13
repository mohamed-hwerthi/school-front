import api from "./axios";
import type {
  Quiz,
  QuizDetail,
  CreateQuizRequest,
  QuestionDTO,
  CreateQuestionRequest,
  Tentative,
  CreateTentativeRequest,
  SubmitReponseRequest,
  QuizStats,
} from "@/types/quiz";

const QUIZ_BASE = "/quiz";
const TENTATIVES_BASE = "/tentatives";

export const quizApi = {
  // Quiz CRUD
  getAll: async (classeId?: string, statut?: string): Promise<Quiz[]> => {
    const params = new URLSearchParams();
    if (classeId) params.set("classeId", String(classeId));
    if (statut) params.set("statut", statut);
    const qs = params.toString();
    const res = await api.get<Quiz[]>(`${QUIZ_BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getById: async (id: string): Promise<Quiz> => {
    const res = await api.get<Quiz>(`${QUIZ_BASE}/${id}`);
    return res.data;
  },

  getDetail: async (id: string): Promise<QuizDetail> => {
    const res = await api.get<QuizDetail>(`${QUIZ_BASE}/${id}/detail`);
    return res.data;
  },

  create: async (data: CreateQuizRequest): Promise<Quiz> => {
    const res = await api.post<Quiz>(QUIZ_BASE, data);
    return res.data;
  },

  update: async (id: string, data: CreateQuizRequest): Promise<Quiz> => {
    const res = await api.put<Quiz>(`${QUIZ_BASE}/${id}`, data);
    return res.data;
  },

  publish: async (id: string): Promise<Quiz> => {
    const res = await api.put<Quiz>(`${QUIZ_BASE}/${id}/publish`);
    return res.data;
  },

  delete: (id: string) => api.delete(`${QUIZ_BASE}/${id}`),

  // Questions
  getQuestions: async (quizId: string): Promise<QuestionDTO[]> => {
    const res = await api.get<QuestionDTO[]>(`${QUIZ_BASE}/${quizId}/questions`);
    return res.data;
  },

  createQuestion: async (quizId: string, data: CreateQuestionRequest): Promise<QuestionDTO> => {
    const res = await api.post<QuestionDTO>(`${QUIZ_BASE}/${quizId}/questions`, data);
    return res.data;
  },

  updateQuestion: async (quizId: string, questionId: string, data: CreateQuestionRequest): Promise<QuestionDTO> => {
    const res = await api.put<QuestionDTO>(`${QUIZ_BASE}/${quizId}/questions/${questionId}`, data);
    return res.data;
  },

  deleteQuestion: (quizId: string, questionId: string) =>
    api.delete(`${QUIZ_BASE}/${quizId}/questions/${questionId}`),

  reorderQuestions: async (quizId: string, questionIds: string[]): Promise<QuestionDTO[]> => {
    const res = await api.put<QuestionDTO[]>(`${QUIZ_BASE}/${quizId}/questions/reorder`, questionIds);
    return res.data;
  },

  // Tentatives
  getTentativesByQuiz: async (quizId: string): Promise<Tentative[]> => {
    const res = await api.get<Tentative[]>(`${TENTATIVES_BASE}/quiz/${quizId}`);
    return res.data;
  },

  getTentativesByEleve: async (eleveId: string): Promise<Tentative[]> => {
    const res = await api.get<Tentative[]>(`${TENTATIVES_BASE}/eleve/${eleveId}`);
    return res.data;
  },

  getTentativeById: async (id: string): Promise<Tentative> => {
    const res = await api.get<Tentative>(`${TENTATIVES_BASE}/${id}`);
    return res.data;
  },

  startTentative: async (data: CreateTentativeRequest): Promise<Tentative> => {
    const res = await api.post<Tentative>(`${TENTATIVES_BASE}/start`, data);
    return res.data;
  },

  submitTentative: async (data: SubmitReponseRequest): Promise<Tentative> => {
    const res = await api.post<Tentative>(`${TENTATIVES_BASE}/submit`, data);
    return res.data;
  },

  getQuizStats: async (quizId: string): Promise<QuizStats> => {
    const res = await api.get<QuizStats>(`${TENTATIVES_BASE}/stats/${quizId}`);
    return res.data;
  },
};
