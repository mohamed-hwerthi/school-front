import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notesApi,
  type NoteDTO,
  type NoteRequest,
  type MoyenneDTO,
  type BaremeDTO,
  type CompetenceDTO,
  type EvaluationCompetenceDTO,
} from "@/api/notes.api";

const NOTES_KEY = "notes";
const BAREMES_KEY = "baremes";
const COMPETENCES_KEY = "competences";
const EVAL_COMP_KEY = "evaluations-competences";

export function useNotesByExamen(examenId: string, trimestre: number) {
  return useQuery<NoteDTO[]>({
    queryKey: [NOTES_KEY, "examen", examenId, trimestre],
    queryFn: () => notesApi.getByExamen(examenId, trimestre),
    enabled: !!examenId && trimestre > 0,
  });
}

export function useNotesByStudent(studentId: string, trimestre: number) {
  return useQuery<NoteDTO[]>({
    queryKey: [NOTES_KEY, "student", studentId, trimestre],
    queryFn: () => notesApi.getByStudent(studentId, trimestre),
    enabled: !!studentId && trimestre > 0,
  });
}

export function useMoyennes(classeId: string, trimestre: number) {
  return useQuery<MoyenneDTO[]>({
    queryKey: [NOTES_KEY, "moyennes", classeId, trimestre],
    queryFn: () => notesApi.getMoyennes(classeId, trimestre),
    enabled: !!classeId && trimestre > 0,
  });
}

export function useUpsertNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes: NoteRequest[]) => notesApi.upsertBulk(notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTES_KEY] });
      // Les ExamenDTO embarquent nbNotes/nbEleves : l'onglet Aperçu et les
      // colonnes "Saisies" de l'onglet Examens doivent se rafraîchir aussi.
      qc.invalidateQueries({ queryKey: ["examens"] });
    },
  });
}

// Baremes
export function useBaremes() {
  return useQuery<BaremeDTO[]>({
    queryKey: [BAREMES_KEY],
    queryFn: () => notesApi.getBaremes(),
  });
}

export function useCreateBareme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BaremeDTO) => notesApi.createBareme(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BAREMES_KEY] }),
  });
}

export function useUpdateBareme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: BaremeDTO }) =>
      notesApi.updateBareme(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BAREMES_KEY] }),
  });
}

// Competences
export function useCompetences(moduleId?: string) {
  return useQuery<CompetenceDTO[]>({
    queryKey: [COMPETENCES_KEY, moduleId],
    queryFn: () => notesApi.getCompetences(moduleId),
  });
}

export function useCreateCompetence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CompetenceDTO) => notesApi.createCompetence(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COMPETENCES_KEY] }),
  });
}

export function useDeleteCompetence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteCompetence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COMPETENCES_KEY] }),
  });
}

// Evaluations competences
export function useEvaluationsCompetences(examenId: string, eleveId?: string) {
  return useQuery<EvaluationCompetenceDTO[]>({
    queryKey: [EVAL_COMP_KEY, examenId, eleveId],
    queryFn: () => notesApi.getEvaluationsCompetences(examenId, eleveId),
    enabled: !!examenId,
  });
}

export function useCreateEvaluationCompetence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: EvaluationCompetenceDTO) =>
      notesApi.createEvaluationCompetence(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVAL_COMP_KEY] }),
  });
}
