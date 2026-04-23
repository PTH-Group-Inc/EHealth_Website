import axiosClient from '@/api/axiosClient';
import { MEDICAL_RECORD_ENDPOINTS } from '@/api/endpoints';
import { unwrap, unwrapList } from '@/api/response';

export interface MedicalRecordRow {
    id?: string;
    encounterId?: string;
    patientId?: string;
    patientName?: string;
    doctorName?: string;
    visitDate?: string;
    status?: string;
    completenessStatus?: string;
    signStatus?: string;
    [key: string]: any;
}

export const medicalRecordService = {
    search: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.SEARCH, { params });
        return unwrapList<MedicalRecordRow>(res);
    },

    getByPatient: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.BY_PATIENT(patientId), { params });
        return unwrapList<MedicalRecordRow>(res);
    },

    getStats: async (patientId: string) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.STATS(patientId));
        return unwrap<any>(res);
    },

    getDetail: async (encounterId: string) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.DETAIL(encounterId));
        return unwrap<any>(res);
    },

    getTimeline: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.TIMELINE(patientId), { params });
        return unwrapList<any>(res);
    },

    getSnapshot: async (encounterId: string) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.SNAPSHOT(encounterId));
        return unwrap<any>(res);
    },

    getCompleteness: async (encounterId: string) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.COMPLETENESS(encounterId));
        return unwrap<any>(res);
    },

    finalize: async (encounterId: string) => {
        const res = await axiosClient.post(MEDICAL_RECORD_ENDPOINTS.FINALIZE(encounterId), {});
        return unwrap<any>(res);
    },

    sign: async (encounterId: string) => {
        const res = await axiosClient.post(MEDICAL_RECORD_ENDPOINTS.SIGN(encounterId), {});
        return unwrap<any>(res);
    },

    export: async (encounterId: string) => {
        const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.EXPORT(encounterId), { responseType: 'blob' });
        return res.data;
    },
};

export default medicalRecordService;
