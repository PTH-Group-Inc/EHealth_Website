import axiosClient from "@/api/axiosClient";
import { DOCUMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export const documentService = {
  getList: async (patientId: string, params?: any) => {
    const res = await axiosClient.get(DOCUMENT_ENDPOINTS.LIST(patientId), { params });
    return unwrapList(res);
  },

  getDetail: async (patientId: string, documentId: string) => {
    const res = await axiosClient.get(DOCUMENT_ENDPOINTS.DETAIL(patientId, documentId));
    return unwrap(res);
  },

  upload: async (patientId: string, formData: FormData) => {
    const res = await axiosClient.post(DOCUMENT_ENDPOINTS.UPLOAD(patientId), formData);
    return unwrap(res);
  },

  delete: async (patientId: string, documentId: string) => {
    const res = await axiosClient.delete(DOCUMENT_ENDPOINTS.DELETE(patientId, documentId));
    return unwrap(res);
  },

  getVersions: async (patientId: string, documentId: string) => {
    const res = await axiosClient.get(DOCUMENT_ENDPOINTS.VERSIONS(patientId, documentId));
    return unwrapList(res);
  },
};
