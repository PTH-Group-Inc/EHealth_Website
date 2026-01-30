/**
 * Medicine Service
 * Xử lý các chức năng liên quan đến thuốc
 * 
 * @description
 * - CRUD thuốc
 * - Tìm kiếm thuốc
 * - Quản lý tồn kho
 */

import axiosClient from '@/api/axiosClient';
import { MEDICINE_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Medicine {
    id: string;
    name: string;
    genericName: string;
    category: string;
    unit: string;
    price: number;
    quantity: number;
    minQuantity: number;
    manufacturer: string;
    expiryDate: string;
    description?: string;
    sideEffects?: string;
    status: 'available' | 'low_stock' | 'out_of_stock';
    createdAt: string;
    updatedAt: string;
}

export interface CreateMedicineData {
    name: string;
    genericName: string;
    category: string;
    unit: string;
    price: number;
    quantity: number;
    minQuantity: number;
    manufacturer: string;
    expiryDate: string;
    description?: string;
    sideEffects?: string;
}

export interface MedicineListResponse {
    success: boolean;
    data: Medicine[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Lấy danh sách thuốc
// ============================================
export const getMedicines = async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
}): Promise<MedicineListResponse> => {
    try {
        const response = await axiosClient.get(MEDICINE_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách thuốc thất bại');
    }
};

// ============================================
// Lấy chi tiết thuốc
// ============================================
export const getMedicineById = async (id: string): Promise<Medicine> => {
    try {
        const response = await axiosClient.get(MEDICINE_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin thuốc thất bại');
    }
};

// ============================================
// Tạo thuốc mới
// ============================================
export const createMedicine = async (data: CreateMedicineData): Promise<Medicine> => {
    try {
        const response = await axiosClient.post(MEDICINE_ENDPOINTS.CREATE, {
            name: data.name,
            generic_name: data.genericName,
            category: data.category,
            unit: data.unit,
            price: data.price,
            quantity: data.quantity,
            min_quantity: data.minQuantity,
            manufacturer: data.manufacturer,
            expiry_date: data.expiryDate,
            description: data.description,
            side_effects: data.sideEffects,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo thuốc thất bại');
    }
};

// ============================================
// Cập nhật thuốc
// ============================================
export const updateMedicine = async (id: string, data: Partial<CreateMedicineData>): Promise<Medicine> => {
    try {
        const response = await axiosClient.put(MEDICINE_ENDPOINTS.UPDATE(id), {
            name: data.name,
            generic_name: data.genericName,
            category: data.category,
            unit: data.unit,
            price: data.price,
            quantity: data.quantity,
            min_quantity: data.minQuantity,
            manufacturer: data.manufacturer,
            expiry_date: data.expiryDate,
            description: data.description,
            side_effects: data.sideEffects,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật thuốc thất bại');
    }
};

// ============================================
// Xóa thuốc
// ============================================
export const deleteMedicine = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(MEDICINE_ENDPOINTS.DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa thuốc thất bại');
    }
};

// ============================================
// Tìm kiếm thuốc
// ============================================
export const searchMedicines = async (query: string): Promise<Medicine[]> => {
    try {
        const response = await axiosClient.get(MEDICINE_ENDPOINTS.SEARCH, {
            params: { q: query },
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tìm kiếm thuốc thất bại');
    }
};

// ============================================
// Lấy danh sách thuốc sắp hết
// ============================================
export const getLowStockMedicines = async (): Promise<Medicine[]> => {
    try {
        const response = await axiosClient.get(MEDICINE_ENDPOINTS.LOW_STOCK);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách thuốc sắp hết thất bại');
    }
};

// ============================================
// Nhập thêm thuốc vào kho
// ============================================
export const addStock = async (id: string, quantity: number): Promise<Medicine> => {
    try {
        const response = await axiosClient.post(`${MEDICINE_ENDPOINTS.DETAIL(id)}/add-stock`, {
            quantity,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nhập kho thất bại');
    }
};
