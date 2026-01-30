/**
 * User Service
 * Xử lý các chức năng liên quan đến người dùng
 * 
 * @description
 * - CRUD người dùng
 * - Quản lý profile
 * - Đổi mật khẩu
 */

import axiosClient from '@/api/axiosClient';
import { USER_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'receptionist';
    status: 'active' | 'inactive';
    avatar?: string;
    department?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserData {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    role: User['role'];
    departmentId?: string;
}

export interface UpdateUserData {
    fullName?: string;
    phoneNumber?: string;
    role?: User['role'];
    status?: User['status'];
    departmentId?: string;
}

export interface UserListResponse {
    success: boolean;
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Lấy danh sách người dùng
// ============================================
export const getUsers = async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
}): Promise<UserListResponse> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách người dùng thất bại');
    }
};

// ============================================
// Lấy chi tiết người dùng
// ============================================
export const getUserById = async (id: string): Promise<User> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
    }
};

// ============================================
// Tạo người dùng mới
// ============================================
export const createUser = async (data: CreateUserData): Promise<User> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.CREATE, {
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            role: data.role,
            department_id: data.departmentId,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo người dùng thất bại');
    }
};

// ============================================
// Cập nhật người dùng
// ============================================
export const updateUser = async (id: string, data: UpdateUserData): Promise<User> => {
    try {
        const response = await axiosClient.put(USER_ENDPOINTS.UPDATE(id), {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            role: data.role,
            status: data.status,
            department_id: data.departmentId,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật người dùng thất bại');
    }
};

// ============================================
// Xóa người dùng
// ============================================
export const deleteUser = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(USER_ENDPOINTS.DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa người dùng thất bại');
    }
};

// ============================================
// Lấy thông tin profile
// ============================================
export const getProfile = async (): Promise<User> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.PROFILE);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin profile thất bại');
    }
};

// ============================================
// Cập nhật profile
// ============================================
export const updateProfile = async (data: {
    fullName?: string;
    phoneNumber?: string;
    avatar?: string;
}): Promise<User> => {
    try {
        const response = await axiosClient.put(USER_ENDPOINTS.PROFILE, {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            avatar: data.avatar,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật profile thất bại');
    }
};

// ============================================
// Đổi mật khẩu
// ============================================
export const changePassword = async (
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        };
    }
};
