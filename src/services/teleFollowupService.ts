import axiosClient from "@/api/axiosClient";
import { TELE_FOLLOWUP_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface FollowUpPlan {
  plan_id?: string;
  planId?: string;
  consultation_id?: string;
  consultationId?: string;
  patient_id?: string;
  patientId?: string;
  patient_name?: string;
  patientName?: string;
  status?: string;
  scheduled_at?: string;
  scheduledAt?: string;
  due_at?: string;
  dueAt?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  [key: string]: any;
}

export interface FollowUpStats {
  total?: number;
  active?: number;
  upcoming?: number;
  overdue?: number;
  need_response?: number;
  needResponse?: number;
  [key: string]: any;
}

export interface FollowUpAttentionUpdate {
  id: string;
  plan_id?: string;
  planId?: string;
  patient_name?: string;
  patientName?: string;
  reason?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export const teleFollowupService = {
  getStats: async (): Promise<FollowUpStats> => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.STATS);
    return unwrap<FollowUpStats>(res);
  },

  getUpcoming: async (params?: { limit?: number; doctorId?: string }) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.UPCOMING, { params });
    return unwrapList<FollowUpPlan>(res);
  },

  getAttentionUpdates: async (params?: { limit?: number; doctorId?: string }) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.ATTENTION_UPDATES, { params });
    return unwrapList<FollowUpAttentionUpdate>(res);
  },

  getPlans: async (params?: Record<string, any>) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.PLANS, { params });
    return unwrapList<FollowUpPlan>(res);
  },

  getPlanDetail: async (planId: string) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.PLAN_DETAIL(planId));
    return unwrap<FollowUpPlan>(res);
  },

  getPatientPlans: async (patientId: string) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.PATIENT_PLANS(patientId));
    return unwrapList<FollowUpPlan>(res);
  },

  getPlanUpdates: async (planId: string) => {
    const res = await axiosClient.get(TELE_FOLLOWUP_ENDPOINTS.HEALTH_UPDATES(planId));
    return unwrapList<any>(res);
  },

  respondToUpdate: async (updateId: string, data: Record<string, any>) => {
    const res = await axiosClient.put(
      TELE_FOLLOWUP_ENDPOINTS.RESPOND_UPDATE(updateId),
      data
    );
    return unwrap<any>(res);
  },

  completePlan: async (planId: string, data?: Record<string, any>) => {
    const res = await axiosClient.put(
      TELE_FOLLOWUP_ENDPOINTS.COMPLETE_PLAN(planId),
      data ?? {}
    );
    return unwrap<FollowUpPlan>(res);
  },
};

export default teleFollowupService;
