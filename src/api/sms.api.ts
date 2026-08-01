import api from "./axios";

export interface SmsCreditsInfo {
  tenantId: string;
  totalCredits: number;
  usedCredits: number;
  remaining: number;
}

export const smsApi = {
  getMyCredits: async (): Promise<SmsCreditsInfo> => {
    const res = await api.get<SmsCreditsInfo>("/sms/credits");
    return res.data;
  },

  getAllCredits: async (): Promise<SmsCreditsInfo[]> => {
    const res = await api.get<SmsCreditsInfo[]>("/super-admin/sms-credits");
    return res.data;
  },

  getTenantCredits: async (tenantId: string): Promise<SmsCreditsInfo> => {
    const res = await api.get<SmsCreditsInfo>(`/super-admin/sms-credits/${tenantId}`);
    return res.data;
  },

  setTenantCredits: async (tenantId: string, totalCredits: number): Promise<SmsCreditsInfo> => {
    const res = await api.put<SmsCreditsInfo>(`/super-admin/sms-credits/${tenantId}`, { totalCredits });
    return res.data;
  },

  addTenantCredits: async (tenantId: string, additionalCredits: number): Promise<SmsCreditsInfo> => {
    const res = await api.patch<SmsCreditsInfo>(`/super-admin/sms-credits/${tenantId}/add`, { additionalCredits });
    return res.data;
  },
};
