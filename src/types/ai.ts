export type AiTone = "ENCOURAGEANT" | "NEUTRE" | "STRICT";

export interface AiCommentRequest {
  studentName: string;
  moyenne: number;
  noteDetails: string[];
  tone: AiTone;
}

export interface AiCommentResponse {
  comment: string;
  suggestions: string[];
}

export interface AiPerformanceRequest {
  studentName: string;
  moyenne: number;
  totalAbsences: number;
  totalRetards: number;
  noteDetails: string[];
}

export interface AiDetectAnomaliesRequest {
  studentId: string;
  notes: number[];
  absences: number[];
}

export type AnomalyType = "GRADE_DROP" | "HIGH_ABSENCE" | "BEHAVIOR_PATTERN";

export interface Anomaly {
  type: AnomalyType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  studentId: string;
}

export interface AiChatRequest {
  message: string;
  context?: string;
}

export interface AiChatResponse {
  response: string;
  suggestedActions: string[];
}

export interface AiStatus {
  enabled: boolean;
  provider: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
