import axiosClient from "@/api/axiosClient";
import { TREATMENT_PLAN_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export const treatmentPlanService = {
  getByPatient: async (patientId: string, params?: any) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.BY_PATIENT(patientId), { params });
    return unwrapList(res);
  },

  getDetail: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.DETAIL(planId));
    return unwrap(res);
  },

  updateStatus: async (planId: string, data: any) => {
    const res = await axiosClient.put(TREATMENT_PLAN_ENDPOINTS.STATUS(planId), data);
    return unwrap(res);
  },

  getSummary: async (planId: string) => {
    const res = await axiosClient.get(TREATMENT_PLAN_ENDPOINTS.SUMMARY(planId));
    return unwrap(res);
  },
};
