import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsApi } from "@/api/integrations.api";
import type {
  EmailRequest,
  SmsRequest,
  WebhookConfig,
  IntegrationConfig,
} from "@/types/integration";

const INTEGRATIONS_KEY = "integrations";

/**
 * Get webhooks list.
 */
export function useWebhooks() {
  return useQuery<WebhookConfig[]>({
    queryKey: [INTEGRATIONS_KEY, "webhooks"],
    queryFn: () => integrationsApi.getWebhooks(),
  });
}

/**
 * Create webhook mutation.
 */
export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: WebhookConfig) =>
      integrationsApi.createWebhook(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY, "webhooks"] });
    },
  });
}

/**
 * Delete webhook mutation.
 */
export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.deleteWebhook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY, "webhooks"] });
    },
  });
}

/**
 * Get integration config.
 */
export function useIntegrationConfig() {
  return useQuery<IntegrationConfig>({
    queryKey: [INTEGRATIONS_KEY, "config"],
    queryFn: () => integrationsApi.getConfig(),
  });
}

/**
 * Update integration config mutation.
 */
export function useUpdateIntegrationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: IntegrationConfig) =>
      integrationsApi.updateConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY, "config"] });
    },
  });
}

/**
 * Send email mutation.
 */
export function useSendEmail() {
  return useMutation({
    mutationFn: (request: EmailRequest) => integrationsApi.sendEmail(request),
  });
}

/**
 * Send test email mutation.
 */
export function useSendTestEmail() {
  return useMutation({
    mutationFn: (request: EmailRequest) =>
      integrationsApi.sendTestEmail(request),
  });
}

/**
 * Send SMS mutation.
 */
export function useSendSms() {
  return useMutation({
    mutationFn: (request: SmsRequest) => integrationsApi.sendSms(request),
  });
}

/**
 * Send test SMS mutation.
 */
export function useSendTestSms() {
  return useMutation({
    mutationFn: (request: SmsRequest) => integrationsApi.sendTestSms(request),
  });
}
