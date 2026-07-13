import { useMutation, useQuery } from "@tanstack/react-query";
import { aiApi } from "@/api/ai.api";
import type {
  AiCommentRequest,
  AiPerformanceRequest,
  AiDetectAnomaliesRequest,
  AiChatRequest,
} from "@/types/ai";

const AI_KEY = "ai";

/**
 * Hook for generating a bulletin comment.
 */
export function useGenerateBulletinComment() {
  return useMutation({
    mutationFn: (request: AiCommentRequest) =>
      aiApi.generateBulletinComment(request),
  });
}

/**
 * Hook for generating a performance summary.
 */
export function useGeneratePerformanceSummary() {
  return useMutation({
    mutationFn: (request: AiPerformanceRequest) =>
      aiApi.generatePerformanceSummary(request),
  });
}

/**
 * Hook for detecting anomalies.
 */
export function useDetectAnomalies() {
  return useMutation({
    mutationFn: (request: AiDetectAnomaliesRequest) =>
      aiApi.detectAnomalies(request),
  });
}

/**
 * Hook for AI chat.
 */
export function useAiChat() {
  return useMutation({
    mutationFn: (request: AiChatRequest) => aiApi.chat(request),
  });
}

/**
 * Hook for clearing chat history.
 */
export function useClearChatHistory() {
  return useMutation({
    mutationFn: () => aiApi.clearChatHistory(),
  });
}

/**
 * Hook for getting AI status.
 */
export function useAiStatus() {
  return useQuery({
    queryKey: [AI_KEY, "status"],
    queryFn: () => aiApi.getStatus(),
    staleTime: 60000, // 1 minute
  });
}
