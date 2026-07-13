import api from "./axios";
import type {
  AiCommentRequest,
  AiCommentResponse,
  AiPerformanceRequest,
  AiDetectAnomaliesRequest,
  Anomaly,
  AiChatRequest,
  AiChatResponse,
  AiStatus,
} from "@/types/ai";

const BASE = "/ai";

export const aiApi = {
  generateBulletinComment: async (
    request: AiCommentRequest
  ): Promise<AiCommentResponse> => {
    const res = await api.post<AiCommentResponse>(
      `${BASE}/bulletin-comment`,
      request
    );
    return res.data;
  },

  generatePerformanceSummary: async (
    request: AiPerformanceRequest
  ): Promise<string> => {
    const res = await api.post<string>(
      `${BASE}/performance-summary`,
      request
    );
    return res.data;
  },

  detectAnomalies: async (
    request: AiDetectAnomaliesRequest
  ): Promise<Anomaly[]> => {
    const res = await api.post<Anomaly[]>(
      `${BASE}/detect-anomalies`,
      request
    );
    return res.data;
  },

  chat: async (request: AiChatRequest): Promise<AiChatResponse> => {
    const res = await api.post<AiChatResponse>(`${BASE}/chat`, request);
    return res.data;
  },

  clearChatHistory: async (): Promise<void> => {
    await api.delete(`${BASE}/chat/history`);
  },

  getStatus: async (): Promise<AiStatus> => {
    const res = await api.get<AiStatus>(`${BASE}/status`);
    return res.data;
  },
};
