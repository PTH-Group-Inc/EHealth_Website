/**
 * Department Service
 * Xử lý các chức năng liên quan đến khoa/phòng ban
 */

import axiosClient from '@/api/axiosClient';
import { DEPARTMENT_ENDPOINTS } from '@/api/endpoints';

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
export const getDepartmentById = async (id: string): Promise<Department> => {
    try {
        const response = await axiosClient.get(DEPARTMENT_ENDPOINTS.DETAIL(id));
        return response.data.data;
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
