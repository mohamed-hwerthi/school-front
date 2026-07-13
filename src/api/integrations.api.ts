import api from "./axios";
import type {
  EmailRequest,
  SmsRequest,
  WebhookConfig,
  IntegrationConfig,
} from "@/types/integration";

const BASE = "/integrations";

export const integrationsApi = {
  sendEmail: async (request: EmailRequest): Promise<boolean> => {
    const res = await api.post<boolean>(`${BASE}/email/send`, request);
    return res.data;
  },

  sendTestEmail: async (request: EmailRequest): Promise<boolean> => {
    const res = await api.post<boolean>(`${BASE}/email/test`, request);
    return res.data;
  },

  sendSms: async (request: SmsRequest): Promise<boolean> => {
    const res = await api.post<boolean>(`${BASE}/sms/send`, request);
    return res.data;
  },

  sendTestSms: async (request: SmsRequest): Promise<boolean> => {
    const res = await api.post<boolean>(`${BASE}/sms/test`, request);
    return res.data;
  },

  sendBulkSms: async (phoneNumbers: string[], message: string): Promise<string[]> => {
    const res = await api.post<string[]>(`${BASE}/sms/bulk`, { phoneNumbers, message });
    return res.data;
  },

  getWebhooks: async (): Promise<WebhookConfig[]> => {
    const res = await api.get<WebhookConfig[]>(`${BASE}/webhooks`);
    return res.data;
  },

  createWebhook: async (config: WebhookConfig): Promise<WebhookConfig> => {
    const res = await api.post<WebhookConfig>(`${BASE}/webhooks`, config);
    return res.data;
  },

  deleteWebhook: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/webhooks/${id}`);
  },

  getConfig: async (): Promise<IntegrationConfig> => {
    const res = await api.get<IntegrationConfig>(`${BASE}/config`);
    return res.data;
  },

  updateConfig: async (
    config: IntegrationConfig
  ): Promise<IntegrationConfig> => {
    const res = await api.put<IntegrationConfig>(`${BASE}/config`, config);
    return res.data;
  },
};
