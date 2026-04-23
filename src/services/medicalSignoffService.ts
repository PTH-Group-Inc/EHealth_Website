import axiosClient from "@/api/axiosClient";
import { SIGN_OFF_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface SignoffRecord {
  id: string;
  encounterId: string;
  status?: string;
  signedBy?: string;
  signedAt?: string;
  [key: string]: any;
}

export interface Signature {
  id: string;
  encounterId: string;
  signerId?: string;
  signerName?: string;
  type?: string;
  signedAt?: string;
  [key: string]: any;
}

export const medicalSignoffService = {
  getPending: async (params?: any) => {
    const res = await axiosClient.get(SIGN_OFF_ENDPOINTS.PENDING, { params });
    return unwrapList<SignoffRecord>(res);
  },

  draftSign: async (encounterId: string, data: any) => {
    const res = await axiosClient.post(
      SIGN_OFF_ENDPOINTS.DRAFT_SIGN(encounterId),
      data
    );
    return unwrap<SignoffRecord>(res);
  },

  officialSign: async (encounterId: string, data: any) => {
    const res = await axiosClient.post(
      SIGN_OFF_ENDPOINTS.OFFICIAL_SIGN(encounterId),
      data
    );
    return unwrap<SignoffRecord>(res);
  },

  complete: async (encounterId: string, data?: any) => {
    const res = await axiosClient.post(
      SIGN_OFF_ENDPOINTS.COMPLETE(encounterId),
      data ?? {}
    );
    return unwrap<SignoffRecord>(res);
  },

  revoke: async (encounterId: string, reason: string) => {
    const res = await axiosClient.post(
      SIGN_OFF_ENDPOINTS.REVOKE(encounterId),
      { reason }
    );
    return unwrap<SignoffRecord>(res);
  },

  verify: async (encounterId: string) => {
    const res = await axiosClient.get(SIGN_OFF_ENDPOINTS.VERIFY(encounterId));
    return unwrap<{ valid: boolean; [key: string]: any }>(res);
  },

  getSignatures: async (encounterId: string) => {
    const res = await axiosClient.get(
      SIGN_OFF_ENDPOINTS.SIGNATURES(encounterId)
    );
    return unwrapList<Signature>(res);
  },

  getAuditLog: async (encounterId: string, params?: any) => {
    const res = await axiosClient.get(
      SIGN_OFF_ENDPOINTS.AUDIT_LOG(encounterId),
      { params }
    );
    return unwrapList<any>(res);
  },

  getLockStatus: async (encounterId: string) => {
    const res = await axiosClient.get(SIGN_OFF_ENDPOINTS.LOCK_STATUS(encounterId));
    return unwrap<{ locked?: boolean; reason?: string; [key: string]: any }>(res);
  },
};

export default medicalSignoffService;
