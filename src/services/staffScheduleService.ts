/**
 * Staff Schedule Service
 * Quản lý lịch trực nhân viên chi tiết
 * Swagger: /api/staff-schedules/*
 */

import axiosClient from "@/api/axiosClient";
import { STAFF_SCHEDULE_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface StaffSchedule {
    id: string;
    staffId: string;
    staffName?: string;
    shiftId?: string;
    shiftName?: string;
    workDate: string;
    startTime?: string;
    endTime?: string;
    departmentId?: string;
    status?: "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "SUSPENDED" | "LEAVE";
    note?: string;
    createdAt?: string;
}

export interface StaffScheduleListParams {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    staffId?: string;
    departmentId?: string;
    status?: string;
}

// Fallback cho bulk assign (không có trong endpoints.ts)
const STAFF_SCHEDULE_EXTRA = {
    BULK: "/api/staff-schedules/bulk",
};

export const staffScheduleService = {
    getList: (params?: StaffScheduleListParams) =>
        axiosClient
            .get(STAFF_SCHEDULE_ENDPOINTS.LIST, { params })
            .then((r) => unwrapList<StaffSchedule>(r.data)),

    getByStaff: (staffId: string, params?: { from?: string; to?: string }) =>
        axiosClient
            .get(STAFF_SCHEDULE_ENDPOINTS.BY_STAFF(staffId), { params })
            .then((r) => unwrapList<StaffSchedule>(r.data)),

    getByDate: (date: string) =>
        axiosClient
            .get(STAFF_SCHEDULE_ENDPOINTS.BY_DATE(date))
            .then((r) => unwrapList<StaffSchedule>(r.data)),

    getDetail: (id: string) =>
        axiosClient
            .get(STAFF_SCHEDULE_ENDPOINTS.DETAIL(id))
            .then((r) => unwrap<StaffSchedule>(r.data)),

    create: (data: Partial<StaffSchedule>) =>
        axiosClient
            .post(STAFF_SCHEDULE_ENDPOINTS.CREATE, data)
            .then((r) => unwrap<StaffSchedule>(r.data)),

    update: (id: string, data: Partial<StaffSchedule>) =>
        axiosClient
            .put(STAFF_SCHEDULE_ENDPOINTS.UPDATE(id), data)
            .then((r) => unwrap<StaffSchedule>(r.data)),

    delete: (id: string) =>
        axiosClient
            .delete(STAFF_SCHEDULE_ENDPOINTS.DELETE(id))
            .then(() => {}),

    getCalendar: (month: number, year: number, params?: Record<string, any>) =>
        axiosClient
            .get(STAFF_SCHEDULE_ENDPOINTS.CALENDAR, {
                params: { month, year, ...params },
            })
            .then((r) => {
                const data = unwrap<any>(r.data);
                // If backend returns Record<string, array[]>, flatten it into a single array
                if (data && !Array.isArray(data) && typeof data === 'object') {
                    return Object.values(data).flat() as StaffSchedule[];
                }
                return data as StaffSchedule[];
            }),

    bulkAssign: (data: {
        staffIds: string[];
        shiftId?: string;
        dates: string[];
        departmentId?: string;
        [key: string]: any;
    }) =>
        axiosClient
            .post(STAFF_SCHEDULE_EXTRA.BULK, data)
            .then((r) => unwrap<StaffSchedule[]>(r.data)),

    suspend: (id: string) =>
        axiosClient
            .patch(STAFF_SCHEDULE_ENDPOINTS.SUSPEND(id))
            .then((r) => unwrap<StaffSchedule>(r.data)),

    resume: (id: string) =>
        axiosClient
            .patch(STAFF_SCHEDULE_ENDPOINTS.RESUME(id))
            .then((r) => unwrap<StaffSchedule>(r.data)),
};

export default staffScheduleService;
