/**
 * Facility Service
 * Quản lý cơ sở y tế — đồng bộ Swagger API
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/facilities/*
 */

import axiosClient from '@/api/axiosClient';
import { FACILITY_ENDPOINTS } from '@/api/endpoints';

export interface Facility {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    type?: string;
    status: 'active' | 'inactive';
    doctorCount?: number;
    departmentCount?: number;
    createdAt?: string;
}

export interface FacilityListResponse {
    data: Facility[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const facilityService = {
    getList: (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<FacilityListResponse> =>
        axiosClient.get(FACILITY_ENDPOINTS.LIST, { params }).then(r => {
            const result = r.data;
            if (result && Array.isArray(result.data)) {
                result.data = result.data.map((f: any) => ({ ...f, id: f.facility_id || f.id }));
            }
            return result;
        }),
};
