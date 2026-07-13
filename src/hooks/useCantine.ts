import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi, abonnementsCantineApi, pointagesRepasApi } from "@/api/cantine.api";
import type {
  Menu,
  CreateMenuRequest,
  AbonnementCantine,
  CreateAbonnementRequest,
  PointageRepas,
  PointageBatchRequest,
  CantineStats,
} from "@/types/cantine";

const MENUS_KEY = "cantine-menus";
const ABONNEMENTS_KEY = "cantine-abonnements";
const POINTAGES_KEY = "cantine-pointages";

// ---- Menus ----

export function useMenus() {
  return useQuery<Menu[]>({
    queryKey: [MENUS_KEY],
    queryFn: menusApi.getAll,
  });
}

export function useMenuSemaine(semaine: number) {
  return useQuery<Menu[]>({
    queryKey: [MENUS_KEY, "semaine", semaine],
    queryFn: () => menusApi.getMenuSemaine(semaine),
    enabled: semaine > 0,
  });
}

export function useMenuByDateRange(start: string, end: string) {
  return useQuery<Menu[]>({
    queryKey: [MENUS_KEY, "range", start, end],
    queryFn: () => menusApi.getMenuByDateRange(start, end),
    enabled: !!start && !!end,
  });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuRequest) => menusApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENUS_KEY] });
    },
  });
}

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateMenuRequest }) =>
      menusApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENUS_KEY] });
    },
  });
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menusApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENUS_KEY] });
    },
  });
}

export function useUploadMenuImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      menusApi.uploadImage(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENUS_KEY] });
    },
  });
}

// ---- Abonnements Cantine ----

export function useAbonnementsCantine() {
  return useQuery<AbonnementCantine[]>({
    queryKey: [ABONNEMENTS_KEY],
    queryFn: abonnementsCantineApi.getAll,
  });
}

export function useAbonnementsActifs() {
  return useQuery<AbonnementCantine[]>({
    queryKey: [ABONNEMENTS_KEY, "actifs"],
    queryFn: abonnementsCantineApi.getActifs,
  });
}

export function useCreateAbonnement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAbonnementRequest) => abonnementsCantineApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABONNEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [POINTAGES_KEY] });
    },
  });
}

export function useUpdateAbonnement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAbonnementRequest }) =>
      abonnementsCantineApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABONNEMENTS_KEY] });
    },
  });
}

export function useDeactivateAbonnement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => abonnementsCantineApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABONNEMENTS_KEY] });
    },
  });
}

export function useDeleteAbonnement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => abonnementsCantineApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ABONNEMENTS_KEY] });
    },
  });
}

// ---- Pointages Repas ----

export function usePointagesRepas(date: string, typeRepas?: string) {
  return useQuery<PointageRepas[]>({
    queryKey: [POINTAGES_KEY, date, typeRepas],
    queryFn: () => pointagesRepasApi.getByDate(date, typeRepas),
    enabled: !!date,
  });
}

export function usePointerRepas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PointageBatchRequest) => pointagesRepasApi.pointer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [POINTAGES_KEY] });
    },
  });
}

export function useCantineStats() {
  return useQuery<CantineStats>({
    queryKey: [POINTAGES_KEY, "stats"],
    queryFn: pointagesRepasApi.getStats,
  });
}
