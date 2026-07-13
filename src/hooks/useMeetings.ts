import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsApi, type MeetingRequest, type MeetingResponse } from "@/api/meetings.api";

const MEETINGS_KEY = "meetings";

export function useMeetings() {
  return useQuery<MeetingResponse[]>({
    queryKey: [MEETINGS_KEY],
    queryFn: () => meetingsApi.getAll(),
  });
}

export function useMeetingById(id: string) {
  return useQuery<MeetingResponse>({
    queryKey: [MEETINGS_KEY, id],
    queryFn: () => meetingsApi.getById(id),
    enabled: !!id,
  });
}

export function useMeetingsByTeacher(enseignantId: string) {
  return useQuery<MeetingResponse[]>({
    queryKey: [MEETINGS_KEY, "teacher", enseignantId],
    queryFn: () => meetingsApi.getByTeacher(enseignantId),
    enabled: !!enseignantId,
  });
}

export function useMeetingsByParent(parentId: string) {
  return useQuery<MeetingResponse[]>({
    queryKey: [MEETINGS_KEY, "parent", parentId],
    queryFn: () => meetingsApi.getByParent(parentId),
    enabled: !!parentId,
  });
}

export function useMeetingsByStudent(studentId: string) {
  return useQuery<MeetingResponse[]>({
    queryKey: [MEETINGS_KEY, "student", studentId],
    queryFn: () => meetingsApi.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MeetingRequest) => meetingsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY] });
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MeetingRequest }) =>
      meetingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY] });
    },
  });
}
