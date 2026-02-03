/**
 * Appointment Service
 * Xử lý các chức năng liên quan đến lịch hẹn khám
 * 
 * @description
 * - CRUD lịch hẹn
 * - Xác nhận / Hủy lịch hẹn
 * - Lấy lịch hẹn theo bác sĩ / bệnh nhân
 */

import axiosClient from '@/api/axiosClient';
import { APPOINTMENT_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    date: string;
    time: string;
    type: 'first_visit' | 're_examination' | 'consultation';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    reason?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentData {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    type: Appointment['type'];
    reason?: string;
}

export interface AppointmentListResponse {
    success: boolean;
    data: Appointment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Lấy danh sách lịch hẹn
// ============================================
export const getAppointments = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    doctorId?: string;
    patientId?: string;
}): Promise<AppointmentListResponse> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách lịch hẹn thất bại');
    }
};

// ============================================
// Lấy chi tiết lịch hẹn
// ============================================
export const getAppointmentById = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin lịch hẹn thất bại');
    }
};

// ============================================
// Tạo lịch hẹn mới
// ============================================
export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
    try {
        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CREATE, {
            patient_id: data.patientId,
            doctor_id: data.doctorId,
            date: data.date,
            time: data.time,
            type: data.type,
            reason: data.reason,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo lịch hẹn thất bại');
    }
};

// ============================================
// Cập nhật lịch hẹn
// ============================================
export const updateAppointment = async (
    id: string,
    data: Partial<CreateAppointmentData>
): Promise<Appointment> => {
    try {
        const response = await axiosClient.put(APPOINTMENT_ENDPOINTS.UPDATE(id), {
            patient_id: data.patientId,
            doctor_id: data.doctorId,
            date: data.date,
            time: data.time,
            type: data.type,
            reason: data.reason,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật lịch hẹn thất bại');
    }
};

// ============================================
// Xác nhận lịch hẹn
// ============================================
export const confirmAppointment = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CONFIRM(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xác nhận lịch hẹn thất bại');
    }
};

// ============================================
// Hủy lịch hẹn
// ============================================
export const cancelAppointment = async (id: string, reason?: string): Promise<void> => {
    try {
        await axiosClient.post(APPOINTMENT_ENDPOINTS.CANCEL(id), { reason });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Hủy lịch hẹn thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bác sĩ
// ============================================
export const getAppointmentsByDoctor = async (
    doctorId: string,
    params?: { date?: string; status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_DOCTOR(doctorId), { params });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bác sĩ thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bệnh nhân
// ============================================
export const getAppointmentsByPatient = async (
    patientId: string,
    params?: { status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_PATIENT(patientId), { params });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bệnh nhân thất bại');
    }
};
