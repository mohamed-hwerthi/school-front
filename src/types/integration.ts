export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  templateType?: string;
}

export interface SmsRequest {
  phoneNumber: string;
  message: string;
}

export interface WebhookConfig {
  id?: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface WebhookEventDTO {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface IntegrationConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smsProvider: string;
  smsApiKey: string;
  webhookConfigs: WebhookConfig[];
}

export const WEBHOOK_EVENTS = [
  'STUDENT_CREATED',
  'STUDENT_UPDATED',
  'STUDENT_DELETED',
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'ABSENCE_CREATED',
  'GRADE_PUBLISHED',
  'BULLETIN_GENERATED',
  'DOCUMENT_GENERATED',
  '*',
] as const;
