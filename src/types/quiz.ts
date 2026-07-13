export type StatutQuiz = 'BROUILLON' | 'PUBLIE' | 'EN_COURS' | 'TERMINE';
export type TypeQuestion = 'QCM' | 'VRAI_FAUX' | 'TEXTE_LIBRE' | 'REPONSE_COURTE';
export type StatutTentative = 'EN_COURS' | 'SOUMISE' | 'CORRIGEE';

export interface Quiz {
  id: string;
  titre: string;
  description: string | null;
  moduleId: string | null;
  classeId: string | null;
  enseignantId: string | null;
  dureeMinutes: number;
  noteTotale: number;
  melangerQuestions: boolean;
  melangerReponses: boolean;
  afficherResultats: boolean;
  tentativesMax: number;
  dateDebut: string | null;
  dateFin: string | null;
  statut: StatutQuiz;
  totalQuestions: number;
  totalTentatives: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizDetail extends Quiz {
  questions: QuestionDTO[];
}

export interface CreateQuizRequest {
  titre: string;
  description?: string;
  moduleId?: string;
  classeId?: string;
  enseignantId?: string;
  dureeMinutes?: number;
  noteTotale?: number;
  melangerQuestions?: boolean;
  melangerReponses?: boolean;
  afficherResultats?: boolean;
  tentativesMax?: number;
  dateDebut?: string;
  dateFin?: string;
  statut?: StatutQuiz;
}

export interface ChoixReponseDTO {
  id?: string;
  texte: string;
  correct: boolean;
  ordre: number;
}

export interface QuestionDTO {
  id: string;
  quizId: string;
  texte: string;
  typeQuestion: TypeQuestion;
  points: number;
  ordre: number;
  explication: string | null;
  imageUrl: string | null;
  obligatoire: boolean;
  choix: ChoixReponseDTO[];
}

export interface CreateQuestionRequest {
  texte: string;
  typeQuestion: TypeQuestion;
  points?: number;
  ordre: number;
  explication?: string;
  imageUrl?: string;
  obligatoire?: boolean;
  choix?: ChoixReponseDTO[];
}

export interface Tentative {
  id: string;
  quizId: string;
  quizTitre: string;
  eleveId: string;
  dateDebut: string;
  dateFin: string | null;
  score: number | null;
  scorePourcentage: number | null;
  statut: StatutTentative;
  tempsPasseSecondes: number | null;
  reponses?: ReponseEleveDTO[];
  createdAt: string;
}

export interface CreateTentativeRequest {
  quizId: string;
  eleveId: string;
}

export interface ReponseEleveDTO {
  id: string;
  tentativeId: string;
  questionId: string;
  questionTexte: string;
  choixId: string | null;
  reponseTexte: string | null;
  correct: boolean | null;
  pointsObtenus: number;
}

export interface ReponseItem {
  questionId: string;
  choixId?: string;
  reponseTexte?: string;
}

export interface SubmitReponseRequest {
  tentativeId: string;
  reponses: ReponseItem[];
}

export interface QuizStats {
  totalTentatives: number;
  moyenneScore: number;
  tauxReussite: number;
  distributionNotes: Record<string, number>;
}
