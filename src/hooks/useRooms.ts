import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "@/api/rooms.api";
import type { Room } from "@/types/room";

const ROOMS_KEY = "rooms";

/**
 * All rooms list.
 */
export function useRooms() {
  return useQuery<Room[]>({
    queryKey: [ROOMS_KEY],
    queryFn: () => roomsApi.getAll(),
  });
}

/**
 * Single room by ID.
 */
export function useRoom(id: string) {
  return useQuery<Room>({
    queryKey: [ROOMS_KEY, id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create room mutation.
 */
export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Room, "id">) => roomsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}

/**
 * Update room mutation.
 */
export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Room, "id"> }) =>
      roomsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}

/**
 * Delete room mutation.
 */
export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}
