/**
 * Specialty Service
 * Quản lý danh mục chuyên khoa — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Section: 1.5.1
 */

import axiosClient from '@/api/axiosClient';
import { SPECIALTY_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Specialty {
    id: string;
    code: string;
    name: string;
    description?: string;
    logo_url?: string;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Service Functions
// ============================================

/** GET /api/specialties — Lấy danh sách chuyên khoa */
export const getSpecialties = async (params?: {
    page?: number;
    limit?: number;
    searchKeyword?: string;
}): Promise<{ data: Specialty[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(SPECIALTY_ENDPOINTS.LIST, { params });
        if (response.data && Array.isArray(response.data.data)) {
            response.data.data = response.data.data.map((item: any) => ({
                ...item,
                id: item.specialties_id || item.id,
            }));
        }
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách chuyên khoa thất bại');
    }
};

/** POST /api/specialties — Tạo mới chuyên khoa */
export const createSpecialty = async (data: {
    code: string;
    name: string;
    description?: string;
}): Promise<Specialty> => {
    try {
        const response = await axiosClient.post(SPECIALTY_ENDPOINTS.CREATE, data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo chuyên khoa thất bại');
    }
};

/** GET /api/specialties/{id} — Chi tiết chuyên khoa */
export const getSpecialtyById = async (id: string): Promise<Specialty> => {
    try {
        const response = await axiosClient.get(SPECIALTY_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy chi tiết chuyên khoa thất bại');
    }
};

/** PUT /api/specialties/{id} — Cập nhật chuyên khoa */
export const updateSpecialty = async (id: string, data: Partial<Specialty>): Promise<Specialty> => {
    try {
        const response = await axiosClient.put(SPECIALTY_ENDPOINTS.UPDATE(id), data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật chuyên khoa thất bại');
    }
};

/** DELETE /api/specialties/{id} — Xóa chuyên khoa (xóa mềm) */
export const deleteSpecialty = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(SPECIALTY_ENDPOINTS.DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa chuyên khoa thất bại');
    }
};

/** GET /api/specialties/by-facility/:facilityId — Lấy chuyên khoa kèm department_id theo cơ sở */
export const getSpecialtiesByFacility = async (facilityId: string): Promise<any[]> => {
    try {
        const response = await axiosClient.get(`/api/specialties/by-facility/${facilityId}`);
        return response.data.data;
    } catch (error: any) {
        return [];
    }
};

/** GET /api/department-specialties/:departmentId/specialties — Lấy chuyên khoa theo phòng ban */
export const getSpecialtiesByDepartment = async (departmentId: string): Promise<any[]> => {
    try {
        const response = await axiosClient.get(`/api/department-specialties/${departmentId}/specialties`);
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data.map((item: any) => ({
                ...item,
                id: item.specialty_id || item.specialties_id || item.id,
                name: item.specialty_name || item.name,
            }));
        }
        return response.data?.data || [];
    } catch (error: any) {
        return [];
    }
};

export const getServicesBySpecialty = async (id: string, facilityId?: string): Promise<any[]> => {
    try {
        const query = facilityId ? `?facilityId=${facilityId}` : '';
        const response = await axiosClient.get(SPECIALTY_ENDPOINTS.SPECIALTY_SERVICES(id) + query);
        return response.data.data;
    } catch (error: any) {
        // Return empty array on failure
        return [];
    }
};

export default {
    getSpecialties,
    createSpecialty,
    getSpecialtyById,
    updateSpecialty,
    deleteSpecialty,
    getSpecialtiesByFacility,
    getSpecialtiesByDepartment,
    getServicesBySpecialty,
};
