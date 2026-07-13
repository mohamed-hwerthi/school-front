import { useQuery } from "@tanstack/react-query";
import { classesApi, type ClasseDTO } from "@/api/classes.api";

const CLASSES_KEY = "classes";

export function useClasses(niveauId?: string) {
  return useQuery<ClasseDTO[]>({
    queryKey: [CLASSES_KEY, niveauId],
    queryFn: () => classesApi.getAll(niveauId),
  });
}
