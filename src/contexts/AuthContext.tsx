/**
 * Authentication Context
 * Quản lý trạng thái đăng nhập toàn ứng dụng
 * 
 * @description
 * - Theo dõi trạng thái user đang đăng nhập
 * - Cung cấp hàm login, logout
 * - Tự động kiểm tra token khi app khởi động
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_CONFIG } from '@/config';
import * as authService from '@/services/authService';

// ============================================
// Types
// ============================================

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'receptionist';
    avatar?: string;
}

interface AuthContextType {
    // State
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra token khi app khởi động
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

                if (token && userStr) {
                    // Có token trong localStorage -> đặt user
                    setUser(JSON.parse(userStr));
                }
            } catch (error) {
                console.error('Lỗi khởi tạo auth:', error);
                // Xóa dữ liệu không hợp lệ
                localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
                localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // ============================================
    // Đăng nhập
    // ============================================
    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await authService.login({ email, password });

            if (response.success && response.data) {
                setUser(response.data.user as User);

                // Chuyển hướng dựa theo role
                const redirectUrl = getRedirectUrl(response.data.user.role);
                router.push(redirectUrl);

                return { success: true, message: 'Đăng nhập thành công!' };
            }

            return { success: false, message: response.message };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Đăng nhập thất bại'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // Đăng xuất
    // ============================================
    const logout = async () => {
        try {
            setIsLoading(true);
            await authService.logout();
            setUser(null);
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // Cập nhật thông tin user
    // ============================================
    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(updatedUser));
        }
    };

    // ============================================
    // Helper: Lấy URL redirect theo role
    // ============================================
    const getRedirectUrl = (role: string): string => {
        switch (role) {
            case 'admin':
                return '/admin';
            case 'doctor':
                return '/portal/doctor';
            case 'pharmacist':
                return '/portal/pharmacist';
            default:
                return '/';
        }
    };

    // ============================================
    // Context Value
    // ============================================
    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// Custom Hook
// ============================================

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
    }

    return context;
}

export default AuthContext;
