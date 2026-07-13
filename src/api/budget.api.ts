import api from "./axios";

// ─── Backend DTOs ────────────────────────────────────────

export interface BudgetDTO {
  id: string;
  anneeScolaire: string;
  label: string;
  type: "RECETTE" | "DEPENSE";
  categorie: string | null;
  montantPrevu: number;
  montantRealise: number;
  variance: number;
  mois: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRequest {
  anneeScolaire: string;
  label: string;
  type: "RECETTE" | "DEPENSE";
  categorie?: string | null;
  montantPrevu: number;
  montantRealise?: number;
  mois?: number | null;
}

export interface PrevisionDTO {
  anneeScolaire: string;
  totalRecettesPrevues: number;
  totalRecettesRealisees: number;
  totalDepensesPrevues: number;
  totalDepensesRealisees: number;
  soldePrevu: number;
  soldeRealise: number;
  variance: number;
  budgets: BudgetDTO[];
}

// ─── API calls ───────────────────────────────────────────

export const budgetsApi = {
  getAll: async (anneeScolaire?: string): Promise<BudgetDTO[]> => {
    const params = anneeScolaire ? `?anneeScolaire=${anneeScolaire}` : "";
    const res = await api.get<BudgetDTO[]>(`/budgets${params}`);
    return res.data;
  },

  getById: async (id: string): Promise<BudgetDTO> => {
    const res = await api.get<BudgetDTO>(`/budgets/${id}`);
    return res.data;
  },

  create: async (data: BudgetRequest): Promise<BudgetDTO> => {
    const res = await api.post<BudgetDTO>("/budgets", data);
    return res.data;
  },

  update: async (id: string, data: BudgetRequest): Promise<BudgetDTO> => {
    const res = await api.put<BudgetDTO>(`/budgets/${id}`, data);
    return res.data;
  },

  delete: (id: string) => api.delete(`/budgets/${id}`),

  getPrevisions: async (anneeScolaire: string): Promise<PrevisionDTO> => {
    const res = await api.get<PrevisionDTO>(
      `/budgets/previsions?anneeScolaire=${anneeScolaire}`
    );
    return res.data;
  },
};

export const exportComptableApi = {
  exportCSV: async (anneeScolaire: string): Promise<void> => {
    const res = await api.get(`/export-comptable/csv?anneeScolaire=${anneeScolaire}`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `export-comptable-${anneeScolaire}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
