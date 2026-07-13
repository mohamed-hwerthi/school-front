export interface TeacherEvaluation {
  id: string;
  teacherId: string;
  teacherName: string;
  evaluatorId: string | null;
  evaluatorName: string | null;
  anneeScolaire: string;
  trimestre: number;
  ponctualite: number;
  pedagogie: number;
  discipline: number;
  communication: number;
  implication: number;
  noteGlobale: number;
  commentaire: string;
  createdAt: string;
}

export interface TeacherEvaluationStats {
  teacherId: string;
  teacherName: string;
  avgPonctualite: number;
  avgPedagogie: number;
  avgDiscipline: number;
  avgCommunication: number;
  avgImplication: number;
  avgGlobale: number;
  totalEvaluations: number;
}
