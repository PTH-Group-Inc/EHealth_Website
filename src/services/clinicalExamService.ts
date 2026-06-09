import axiosClient from "@/api/axiosClient";
import { CLINICAL_EXAM_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface ClinicalExam {
  id: string;
  patientId: string;
  encounterId?: string;
  status?: string;
  [key: string]: any;
}

export interface VitalSigns {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  [key: string]: any;
}

export const clinicalExamService = {
  getByPatient: async (patientId: string, params?: any) => {
    const res = await axiosClient.get(
      CLINICAL_EXAM_ENDPOINTS.BY_PATIENT(patientId),
      { params }
    );
    return unwrapList<ClinicalExam>(res);
  },

  getDetail: async (encounterId: string) => {
    const res = await axiosClient.get(CLINICAL_EXAM_ENDPOINTS.DETAIL(encounterId));
    return unwrap<ClinicalExam>(res);
  },

  getVitals: async (encounterId: string) => {
    const res = await axiosClient.get(CLINICAL_EXAM_ENDPOINTS.VITALS(encounterId));
    return unwrap<VitalSigns>(res);
  },

  updateVitals: async (encounterId: string, data: VitalSigns) => {
    const res = await axiosClient.put(
      CLINICAL_EXAM_ENDPOINTS.VITALS(encounterId),
      data
    );
    return unwrap<VitalSigns>(res);
  },

  getSummary: async (encounterId: string) => {
    const res = await axiosClient.get(CLINICAL_EXAM_ENDPOINTS.SUMMARY(encounterId));
    return unwrap<any>(res);
  },

  finalize: async (encounterId: string, data?: any) => {
    const res = await axiosClient.patch(
      CLINICAL_EXAM_ENDPOINTS.FINALIZE(encounterId),
      data ?? {}
    );
    return unwrap<ClinicalExam>(res);
  },
};

export default clinicalExamService;
