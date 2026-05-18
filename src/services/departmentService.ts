/**
 * Department Service
 * Xử lý các chức năng liên quan đến khoa/phòng ban
 */

import axiosClient from '@/api/axiosClient';
import { DEPARTMENT_ENDPOINTS, STAFF_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
    headDoctorId?: string;
    headDoctorName?: string;
    totalDoctors: number;
    totalPatients: number;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

/** Unwrap departments từ các kiểu response khác nhau */
export function unwrapDepartments(res: any): Department[] {
    const raw = res?.data?.data ?? res?.data?.items ?? res?.data ?? res?.items ?? res ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((d: any): Department => ({
        id: d.department_id ?? d.id ?? '',
        name: d.name ?? '',
        code: d.code ?? '',
        description: d.description ?? '',
        headDoctorId: d.head_doctor_id ?? '',
        headDoctorName: d.head_doctor_name ?? '',
        totalDoctors: d.doctor_count ?? d.totalDoctors ?? 0,
        totalPatients: d.patient_count ?? d.totalPatients ?? 0,
        status: (d.status ?? 'active') as 'active' | 'inactive',
        createdAt: d.created_at ?? '',
        updatedAt: d.updated_at ?? '',
    }));
}

export interface CreateDepartmentData {
    name: string;
    code: string;
    description?: string;
    headDoctorId?: string;
}

// ============================================
// Lấy danh sách khoa
// ============================================
export const getDepartments = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<{ data: Department[]; pagination: any }> => {
    try {
        const response = await axiosClient.get(DEPARTMENT_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách khoa thất bại');
    }
};

// ============================================
// Lấy chi tiết khoa
// ============================================
export const getDepartmentById = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.get(DEPARTMENT_ENDPOINTS.DETAIL(id));
        // Trả raw data để caller tự unwrap
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin khoa thất bại');
    }
};

// ============================================
// Tạo khoa mới
// ============================================
export const createDepartment = async (data: CreateDepartmentData): Promise<Department> => {
    try {
        const response = await axiosClient.post(DEPARTMENT_ENDPOINTS.CREATE, {
            name: data.name,
            code: data.code,
            description: data.description,
            head_doctor_id: data.headDoctorId,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo khoa thất bại');
    }
};

// ============================================
// Cập nhật khoa
// ============================================
export const updateDepartment = async (id: string, data: Partial<CreateDepartmentData>): Promise<Department> => {
    try {
        const response = await axiosClient.put(DEPARTMENT_ENDPOINTS.UPDATE(id), {
            name: data.name,
            code: data.code,
            description: data.description,
            head_doctor_id: data.headDoctorId,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật khoa thất bại');
    }
};

// ============================================
// Xóa khoa
// ============================================
export const deleteDepartment = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(DEPARTMENT_ENDPOINTS.DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa khoa thất bại');
    }
};

// ============================================
// Lấy danh sách nhân sự theo khoa
// (dùng /api/staff?departmentId=xxx vì không có endpoint riêng)
// ============================================
export const getStaffByDepartment = async (departmentId: string): Promise<any[]> => {
    try {
        const response = await axiosClient.get(STAFF_ENDPOINTS.LIST, {
            params: { departmentId, limit: 100 }
        });
        const raw = response.data?.data?.data ?? response.data?.data?.items ?? response.data?.data ?? response.data?.items ?? response.data ?? [];
        return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
        return [];
    }
};
