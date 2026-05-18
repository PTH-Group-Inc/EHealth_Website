import axiosClient from "@/api/axiosClient";
import { BRANCH_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  facilityId?: string;
  status?: "active" | "inactive";
  createdAt?: string;
}

const normalizeBranch = (b: any): Branch => ({
  ...b,
  id: b.branch_id || b.id,
});

export const branchService = {
  getList: async (params?: any) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.LIST, { params });
    const result = unwrapList<Branch>(res);
    return { ...result, data: result.data.map(normalizeBranch) };
  },

  getDropdown: async (params?: any) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.DROPDOWN, { params });
    const result = unwrapList<Branch>(res);
    return { ...result, data: result.data.map(normalizeBranch) };
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(BRANCH_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },

  updateStatus: async (id: string, data: any) => {
    const res = await axiosClient.put(BRANCH_ENDPOINTS.STATUS(id), data);
    return unwrap(res);
  },
};
