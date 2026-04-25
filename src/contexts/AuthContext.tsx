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
// Helper: Lấy URL redirect theo role (module-level để login page import)
// ============================================
export const getRedirectUrl = (role: string): string => {
    switch ((role || '').toLowerCase()) {
        case 'admin':
        case 'super_admin':
            return '/admin';
        case 'doctor':
        case 'nurse':
            return '/portal/doctor';
        case 'pharmacist':
            return '/portal/pharmacist';
        case 'staff':
        case 'receptionist':
        case 'cashier':
            return '/portal/receptionist';
        case 'patient':
            return '/patient';
        default:
            return '/patient';
    }
};

// ============================================
// Types
// ============================================

export interface User {
    id: string;
    email: string;
    fullName: string;
    /** @deprecated dùng roles[] thay thế */
    role: string;
    roles: string[];
    avatar?: string;
    phone?: string;
}

interface AuthContextType {
    // State
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    menus: any[];
    permissions: string[];

    // Actions
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; code?: string }>;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;

    // Role helpers
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
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
    const [menus, setMenus] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);

    // Kiểm tra token khi app khởi động
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

                if (token && userStr) {
                    const parsed = JSON.parse(userStr);
                    // Đảm bảo roles luôn là array
                    if (!parsed.roles) {
                        parsed.roles = parsed.role ? [parsed.role] : [];
                    }
                    setUser(parsed);
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Lỗi khởi tạo auth:', error);
                }
                localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
                localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Lắng nghe sự kiện force-logout từ axiosClient (refresh token thất bại)
        const handleForceLogout = () => {
            setUser(null);
            setMenus([]);
            setPermissions([]);
        };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    // ============================================
    // Đăng nhập
    // ============================================
    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await authService.login({ email, password });

            if (response.success && response.data) {
                // Swagger: { accessToken, refreshToken, user: { userId, name, avatar, email, phone, roles[] } }
                const { accessToken, refreshToken, user: apiUser } = response.data;
                // Robust parse: roles có thể là string[] hoặc object[] ({roles_id, code, name, ...})
                // Ưu tiên `code` (machine-readable, vd "PATIENT") trước `name` (display label tiếng Việt "Bệnh nhân")
                // để `getRedirectUrl()` + AuthGuard nhận diện đúng role.
                const rolesRaw: string[] = (apiUser.roles || [])
                    .map((r: any) => {
                        if (typeof r === 'string') return r;
                        if (r && typeof r === 'object') {
                            return r.code || r.role_code || r.name || r.role_name || r.role || '';
                        }
                        return '';
                    })
                    .filter((s: string) => s)
                    .map((s: string) => s.toLowerCase());
                const primaryRole = rolesRaw[0] || 'patient';

                const userData: User = {
                    id: String(apiUser.userId ?? ''),
                    email: apiUser.email || email,
                    fullName: apiUser.name || email.split('@')[0],
                    role: primaryRole,
                    roles: rolesRaw,
                    avatar: apiUser.avatar,
                    phone: apiUser.phone,
                };

                localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken || '');
                localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken || '');
                localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));

                setUser(userData);

                // Lấy roles/menus/permissions sau khi đăng nhập
                try {
                    const [rolesRes, menusRes, permsRes] = await Promise.allSettled([
                        authService.getMyRoles(),
                        authService.getMyMenus(),
                        authService.getMyPermissions(),
                    ]);

                    if (rolesRes.status === 'fulfilled' && rolesRes.value?.data) {
                        // BE trả [{roles_id, code: "ADMIN", name: "Quản trị viên"}]
                        // Ưu tiên `code` (machine-readable) trước `name` (display label)
                        const serverRoles: string[] = (rolesRes.value.data || []).map((r: any) => {
                            if (typeof r === 'string') return r;
                            if (!r) return '';
                            return r.code || r.role_code || r.name || r.role_name || r.role || '';
                        }).filter(Boolean).map((s: string) => s.toLowerCase());
                        if (serverRoles.length > 0) {
                            const updatedUser = { ...userData, roles: serverRoles, role: serverRoles[0] };
                            setUser(updatedUser);
                            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(updatedUser));
                        }
                    }

                    if (menusRes.status === 'fulfilled' && menusRes.value?.data) {
                        setMenus(menusRes.value.data || []);
                    }

                    if (permsRes.status === 'fulfilled' && permsRes.value?.data) {
                        const permsArr: string[] = (permsRes.value.data || []).map((p: any) =>
                            typeof p === 'string' ? p : p.code || p.name || ''
                        ).filter(Boolean);
                        setPermissions(permsArr);
                    }
                } catch {
                    // Không block login nếu lấy thêm thông tin thất bại
                }

                const redirectUrl = getRedirectUrl(primaryRole);
                router.push(redirectUrl);

                return { success: true, message: 'Đăng nhập thành công!' };
            }

            return { success: false, message: response.message || 'Đăng nhập thất bại', code: response.code };
        } catch (error: any) {
            return {
                success: false,
                code: error.response?.data?.code,
                message: error.response?.data?.message || error.message || 'Đăng nhập thất bại',
            };
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // Đăng xuất
    // ============================================
    const logout = async () => {
        // Xóa state trước (đồng bộ) để tránh component tree re-render với loading state
        setUser(null);
        setMenus([]);
        setPermissions([]);

        // Gọi API logout (async) — không block UI
        try {
            await authService.logout();
        } catch {
            // Ignore — localStorage đã được xóa bởi authService.logout() trong finally block
        }

        router.push('/login');
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
    // Helper: Kiểm tra role
    // ============================================
    const hasRole = (role: string): boolean => {
        if (!user?.roles) return false;
        return user.roles.map(r => r.toLowerCase()).includes(role.toLowerCase());
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user?.roles) return false;
        const userRolesLower = user.roles.map(r => r.toLowerCase());
        return roles.some(r => userRolesLower.includes(r.toLowerCase()));
    };


    // ============================================
    // Context Value
    // ============================================
    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        menus,
        permissions,
        login,
        logout,
        updateUser,
        hasRole,
        hasAnyRole,
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
