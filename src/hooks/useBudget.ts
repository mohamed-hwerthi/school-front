import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  budgetsApi,
  exportComptableApi,
  type BudgetDTO,
  type BudgetRequest,
  type PrevisionDTO,
} from "@/api/budget.api";

const BUDGETS_KEY = "budgets";
const PREVISIONS_KEY = "previsions";

export function useBudgets(anneeScolaire?: string) {
  return useQuery<BudgetDTO[]>({
    queryKey: [BUDGETS_KEY, anneeScolaire],
    queryFn: () => budgetsApi.getAll(anneeScolaire),
  });
}

export function usePrevisions(anneeScolaire: string) {
  return useQuery<PrevisionDTO>({
    queryKey: [PREVISIONS_KEY, anneeScolaire],
    queryFn: () => budgetsApi.getPrevisions(anneeScolaire),
    enabled: !!anneeScolaire,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetRequest) => budgetsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: [PREVISIONS_KEY] });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetRequest }) =>
      budgetsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: [PREVISIONS_KEY] });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: [PREVISIONS_KEY] });
    },
  });
}

export function useExportComptable() {
  return useMutation({
    mutationFn: (anneeScolaire: string) => exportComptableApi.exportCSV(anneeScolaire),
  });
}
