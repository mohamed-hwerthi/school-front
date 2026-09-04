import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, type ClasseDTO } from "@/api/classes.api";

const CLASSES_KEY = "classes";

export function useClasses(niveauId?: string) {
  return useQuery<ClasseDTO[]>({
    queryKey: [CLASSES_KEY, niveauId],
    queryFn: () => classesApi.getAll(niveauId),
  });
}

/** Capacité d'accueil d'une section — `null` la remet à « non plafonnée ». */
export function useSetClasseCapacite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, capacite }: { id: string; capacite: number | null }) =>
      classesApi.setCapacite(id, capacite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CLASSES_KEY] });
      qc.invalidateQueries({ queryKey: ["repartition"] });
    },
  });
}
