import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { niveauxApi, type NiveauDTO } from "@/api/niveaux.api";
import type { Niveau } from "@/types/niveau";

const NIVEAUX_KEY = "niveaux";

function fromApi(dto: NiveauDTO): Niveau {
  return {
    id: dto.id,
    nom: dto.name,
    sections: dto.sections,
  };
}

/**
 * All niveaux list.
 */
export function useNiveaux() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Niveau[]>({
    queryKey: [NIVEAUX_KEY],
    queryFn: async () => {
      const res = await niveauxApi.getAll();
      return res.map(fromApi);
    },
  });

  const niveaux = data ?? [];

  const getClassesForNiveau = (nom: string): string[] => {
    const niveau = niveaux.find((n) => n.nom === nom);
    if (!niveau) return [];
    const prefix = niveau.nom.match(/^(\d+)/)?.[1] || "";
    return niveau.sections.map((s) => `${prefix}${s}`);
  };

  return { niveaux, isLoading, getClassesForNiveau };
}

/**
 * Create niveau mutation.
 */
export function useCreateNiveau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => niveauxApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NIVEAUX_KEY] });
    },
  });
}

/**
 * Delete niveau mutation.
 */
export function useDeleteNiveau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => niveauxApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NIVEAUX_KEY] });
    },
  });
}

/**
 * Add classe/section to a niveau.
 */
export function useAddClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ niveauId, letter }: { niveauId: string; letter: string }) =>
      niveauxApi.addClasse(niveauId, letter),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NIVEAUX_KEY] });
    },
  });
}

/**
 * Remove classe/section from a niveau.
 */
export function useRemoveClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ niveauId, letter }: { niveauId: string; letter: string }) =>
      niveauxApi.removeClasse(niveauId, letter),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NIVEAUX_KEY] });
    },
  });
}
