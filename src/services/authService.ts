/**
 * Authentication Service
 * Xử lý các chức năng đăng nhập, đăng ký, đăng xuất
 * 
 * @description
 * - Đăng nhập / Đăng ký
 * - Quên mật khẩu / Đặt lại mật khẩu
 * - Đăng nhập Google
 * - Quản lý token
 */

import axiosClient from '@/api/axiosClient';
import { AUTH_ENDPOINTS } from '@/api/endpoints';
import { AUTH_CONFIG } from '@/config';

// ============================================
// Types
// ============================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            avatar?: string;
        };
        accessToken: string;
        refreshToken: string;
    };
}

// ============================================
// Đăng nhập
// ============================================
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await axiosClient.post(AUTH_ENDPOINTS.LOGIN, credentials);

        // Lưu token vào localStorage nếu đăng nhập thành công
        if (response.data.success && response.data.data) {
            const { accessToken, refreshToken, user } = response.data.data;

            localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
        }

        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đăng nhập thất bại',
        };
    }
};

// ============================================
// Đăng ký tài khoản
// ============================================
export const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
        const response = await axiosClient.post(AUTH_ENDPOINTS.REGISTER, {
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            phone_number: data.phoneNumber,
        });

        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đăng ký thất bại',
        };
    }
};

// ============================================
// Đăng xuất
// ============================================
export const logout = async (): Promise<void> => {
    try {
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

        if (refreshToken) {
            await axiosClient.post(AUTH_ENDPOINTS.LOGOUT, { refresh_token: refreshToken });
        }
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
    } finally {
        // Xóa tất cả dữ liệu auth khỏi localStorage
        localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    }
};

// ============================================
// Quên mật khẩu
// ============================================
export const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Gửi email thất bại',
        };
    }
};

// ============================================
// Đặt lại mật khẩu
// ============================================
export const resetPassword = async (
    token: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
            token,
            new_password: newPassword,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đặt lại mật khẩu thất bại',
        };
    }
};

// ============================================
// Đăng nhập bằng Google
// ============================================
export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
    try {
        const response = await axiosClient.post(AUTH_ENDPOINTS.GOOGLE_LOGIN, { id_token: idToken });

        // Lưu token nếu thành công
        if (response.data.success && response.data.data) {
            const { accessToken, refreshToken, user } = response.data.data;

            localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
        }

        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đăng nhập Google thất bại',
        };
    }
};

// ============================================
// Lấy thông tin user từ localStorage
// ============================================
export const getCurrentUser = () => {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

// ============================================
// Kiểm tra đã đăng nhập chưa
// ============================================
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    return !!token;
};
