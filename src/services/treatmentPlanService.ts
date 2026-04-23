import axiosClient from "@/api/axiosClient";
import { TREATMENT_PLAN_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface TreatmentPlan {
  id: string;
  patientId?: string;
  doctorId?: string;
  title?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  [key: string]: any;
}

export interface TreatmentPlanNote {
  id: string;
  planId?: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
  [key: string]: any;
}

export const treatmentPlanService = {
  getByPatient: async (patientId: string, params?: any) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.BY_PATIENT(patientId), { params });
    return unwrapList<TreatmentPlan>(res);
  },

  getDetail: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.DETAIL(planId));
    return unwrap<TreatmentPlan>(res);
  },

  getSummary: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.SUMMARY(planId));
    return unwrap<any>(res);
  },

  getFollowUpChain: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.FOLLOW_UP_CHAIN(planId));
    return unwrapList<any>(res);
  },

  create: async (data: Partial<TreatmentPlan>) => {
    const res = await axiosClient.post(TREATMENT_PLAN_ENDPOINTS.CREATE, data);
    return unwrap<TreatmentPlan>(res);
  },

  update: async (planId: string, data: Partial<TreatmentPlan>) => {
    const res = await axiosClient.patch(TREATMENT_PLAN_ENDPOINTS.DETAIL(planId), data);
    return unwrap<TreatmentPlan>(res);
  },

  updateStatus: async (planId: string, data: any) => {
    const res = await axiosClient.patch(TREATMENT_PLAN_ENDPOINTS.STATUS(planId), data);
    return unwrap<TreatmentPlan>(res);
  },

  // Notes
  getNotes: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.NOTES(planId));
    return unwrapList<TreatmentPlanNote>(res);
  },

  addNote: async (planId: string, content: string) => {
    const res = await axiosClient.post(TREATMENT_PLAN_ENDPOINTS.NOTES(planId), { content });
    return unwrap<TreatmentPlanNote>(res);
  },

  updateNote: async (planId: string, noteId: string, data: Partial<TreatmentPlanNote>) => {
    const res = await axiosClient.patch(TREATMENT_PLAN_ENDPOINTS.NOTE_DETAIL(planId, noteId), data);
    return unwrap<TreatmentPlanNote>(res);
  },

  deleteNote: async (planId: string, noteId: string) => {
    const res = await axiosClient.delete(TREATMENT_PLAN_ENDPOINTS.NOTE_DETAIL(planId, noteId));
    return unwrap(res);
  },

  // Follow-ups
  addFollowUp: async (planId: string, data: any) => {
    const res = await axiosClient.post(TREATMENT_PLAN_ENDPOINTS.FOLLOW_UPS(planId), data);
    return unwrap<any>(res);
  },
};

export default treatmentPlanService;
