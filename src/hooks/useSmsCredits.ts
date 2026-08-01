import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { smsApi, type SmsCreditsInfo } from "@/api/sms.api";

const MY_CREDITS_KEY = "sms-credits-mine";
const ALL_CREDITS_KEY = "sms-credits-all";

export function useMySmsCredits() {
  return useQuery<SmsCreditsInfo>({
    queryKey: [MY_CREDITS_KEY],
    queryFn: () => smsApi.getMyCredits(),
  });
}

export function useAllSmsCredits() {
  return useQuery<SmsCreditsInfo[]>({
    queryKey: [ALL_CREDITS_KEY],
    queryFn: () => smsApi.getAllCredits(),
  });
}

export function useSetSmsCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, totalCredits }: { tenantId: string; totalCredits: number }) =>
      smsApi.setTenantCredits(tenantId, totalCredits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ALL_CREDITS_KEY] });
      qc.invalidateQueries({ queryKey: ["super-admin-tenants"] });
    },
  });
}

export function useAddSmsCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, additionalCredits }: { tenantId: string; additionalCredits: number }) =>
      smsApi.addTenantCredits(tenantId, additionalCredits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ALL_CREDITS_KEY] });
      qc.invalidateQueries({ queryKey: [MY_CREDITS_KEY] });
      qc.invalidateQueries({ queryKey: ["super-admin-tenants"] });
    },
  });
}
