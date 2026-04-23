/**
 * Leave Service — Quản lý nghỉ phép nhân sự
 * Swagger: /api/leaves/*
 */

import axiosClient from "@/api/axiosClient";
import { LEAVE_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Leave {
  id: string;
  staffId?: string;
  staffName?: string;
  type?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  reason?: string;
  status: LeaveStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveListParams {
  staffId?: string;
  doctorId?: string;
  status?: LeaveStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeaveData {
  staffId?: string;
  doctorId?: string;
  type?: string;
  startDate: string;
  endDate: string;
  reason?: string;
  note?: string;
}

export const leaveService = {
  getList: async (params?: LeaveListParams) => {
    const res = await axiosClient.get(LEAVE_ENDPOINTS.LIST, { params });
    return unwrapList<Leave>(res);
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(LEAVE_ENDPOINTS.DETAIL(id));
    return unwrap<Leave>(res);
  },

  create: async (data: CreateLeaveData) => {
    const res = await axiosClient.post(LEAVE_ENDPOINTS.LIST, data);
    return unwrap<Leave>(res);
  },

  update: async (id: string, data: Partial<CreateLeaveData>) => {
    const res = await axiosClient.put(LEAVE_ENDPOINTS.DETAIL(id), data);
    return unwrap<Leave>(res);
  },

  remove: async (id: string) => {
    const res = await axiosClient.delete(LEAVE_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },

  approve: async (id: string, data?: any) => {
    const res = await axiosClient.put(LEAVE_ENDPOINTS.APPROVE(id), data);
    return unwrap<Leave>(res);
  },

  reject: async (id: string, data?: any) => {
    const res = await axiosClient.put(LEAVE_ENDPOINTS.REJECT(id), data);
    return unwrap<Leave>(res);
  },
};

export default leaveService;
