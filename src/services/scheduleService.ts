/**
 * Schedule Service
 * Quản lý lịch làm việc bác sĩ — đồng bộ Swagger API
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/schedules/*
 */

import axiosClient from '@/api/axiosClient';
import { SCHEDULE_ENDPOINTS } from '@/api/endpoints';

export interface Schedule {
    id: string;
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    department: string;
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    date: string;
    status: 'SCHEDULED' | 'ON_DUTY' | 'COMPLETED' | 'ABSENT' | 'LEAVE';
    avatar?: string;
    createdAt?: string;
}

export interface ScheduleListResponse {
    data: Schedule[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** Unwrap schedule list từ các kiểu response khác nhau */
export function unwrapSchedules(res: any): Schedule[] {
    const raw = res?.data?.data ?? res?.data?.items ?? res?.data ?? res?.items ?? res ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((s: any): Schedule => ({
        id: s.schedule_id ?? s.id ?? '',
        doctorId: s.doctor_id ?? s.staff_id ?? '',
        doctorName: s.doctor_name ?? s.full_name ?? '',
        departmentId: s.department_id ?? s.department?.id ?? '',
        department: s.department_name ?? s.department?.name ?? '',
        shift: (s.shift ?? 'MORNING') as Schedule['shift'],
        date: s.date ?? s.work_date ?? '',
        status: (s.status ?? 'SCHEDULED') as Schedule['status'],
        avatar: s.avatar ?? s.avatar_url ?? '',
        createdAt: s.created_at ?? '',
    }));
}

export const scheduleService = {
    getList: (params?: {
        page?: number;
        limit?: number;
        from?: string;
        to?: string;
        doctorId?: string;
        staffId?: string;
        status?: string;
        departmentId?: string;
    }): Promise<ScheduleListResponse> =>
        axiosClient.get(SCHEDULE_ENDPOINTS.LIST, { params }).then(r => r.data),

    create: (data: Partial<Schedule> & { staffId?: string; workDate?: string }): Promise<Schedule> =>
        axiosClient.post(SCHEDULE_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Partial<Schedule>): Promise<Schedule> =>
        axiosClient.put(SCHEDULE_ENDPOINTS.UPDATE(id), data).then(r => r.data?.data ?? r.data),

    delete: (id: string): Promise<void> =>
        axiosClient.delete(SCHEDULE_ENDPOINTS.DELETE(id)).then(() => {}),

    suspend: (id: string): Promise<any> =>
        axiosClient.patch(SCHEDULE_ENDPOINTS.SUSPEND(id)).then(r => r.data),

    resume: (id: string): Promise<any> =>
        axiosClient.patch(SCHEDULE_ENDPOINTS.RESUME(id)).then(r => r.data),

    getByDoctor: (doctorId: string, params?: { from?: string; to?: string }): Promise<Schedule[]> =>
        axiosClient.get(SCHEDULE_ENDPOINTS.BY_DOCTOR(doctorId), { params }).then(r => {
            return unwrapSchedules(r.data);
        }),

    getCalendar: (params?: { from?: string; to?: string; departmentId?: string }): Promise<Schedule[]> =>
        axiosClient.get(SCHEDULE_ENDPOINTS.CALENDAR, { params }).then(r => {
            return unwrapSchedules(r.data);
        }),
};
