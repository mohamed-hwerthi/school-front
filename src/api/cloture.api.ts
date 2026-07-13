import api from "./axios";
import type { PreChecksResponse, ClotureRequest, ClotureResult } from "@/types/cloture";

const BASE = "/cloture";

export const clotureApi = {
  /** Pre-closure verifications for a school year. */
  getPreChecks: async (anneeId: string): Promise<PreChecksResponse> => {
    const res = await api.get<PreChecksResponse>(`${BASE}/${anneeId}/pre-checks`);
    return res.data;
  },

  /** Close a school year, optionally creating the next one. */
  cloturer: async (anneeId: string, request: ClotureRequest): Promise<ClotureResult> => {
    const res = await api.post<ClotureResult>(`${BASE}/${anneeId}`, request);
    return res.data;
  },
};
