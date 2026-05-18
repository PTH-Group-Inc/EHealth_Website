/**
 * Auth Guard Component
 * Chặn truy cập trái phép bằng cách kiểm tra roles[] từ localStorage
 * Nếu user chưa đăng nhập → redirect về /login
 * Nếu user không đúng role → redirect về /403
 *
 * Hỗ trợ alias map giữa BE roles và FE aliases:
 *   - STAFF (BE) → receptionist (FE)
 *   - NURSE (BE) → doctor (FE)
 *   - SUPER_ADMIN/SUPERADMIN → admin
 */

"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AUTH_CONFIG } from "@/config";

interface AuthGuardProps {
    children: ReactNode;
    allowedRoles: string[];
}

/**
 * Map BE role name → FE aliases (lowercase, có thể có nhiều alias)
 */
const ROLE_ALIAS_MAP: Record<string, string[]> = {
    admin: ["admin", "super_admin", "superadmin"],
    super_admin: ["admin", "super_admin", "superadmin"],
    superadmin: ["admin", "super_admin", "superadmin"],
    doctor: ["doctor", "nurse"],
    nurse: ["doctor", "nurse"],
    pharmacist: ["pharmacist"],
    receptionist: ["receptionist", "staff", "cashier"],
    staff: ["receptionist", "staff", "cashier"],
    cashier: ["receptionist", "staff", "cashier"],
    patient: ["patient"],
};

/**
 * Mở rộng danh sách roles của user thành tất cả aliases có thể có
 */
function expandUserRoles(roles: string[]): string[] {
    const expanded = new Set<string>();
    roles.forEach(r => {
        const lower = r.toLowerCase();
        expanded.add(lower);
        const aliases = ROLE_ALIAS_MAP[lower] || [];
        aliases.forEach(a => expanded.add(a));
    });
    return Array.from(expanded);
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Reset trạng thái khi bắt đầu kiểm tra lại (ví dụ: khi pathname thay đổi sau logout)
        setIsChecking(true);
        setIsAuthorized(false);

        const checkAuth = () => {
            try {
                const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

                // Chưa đăng nhập → về login
                if (!token || !userStr) {
                    router.replace("/login");
                    return;
                }

                const user = JSON.parse(userStr);

                // Lấy tất cả roles của user (hỗ trợ cả roles[] lẫn role đơn cũ)
                let userRoles: string[] = [];
                if (Array.isArray(user.roles) && user.roles.length > 0) {
                    userRoles = user.roles.map((r: string) => r.toLowerCase());
                } else if (user.role) {
                    userRoles = [user.role.toLowerCase()];
                }

                // Mở rộng roles thông qua alias map (STAFF ↔ receptionist, NURSE ↔ doctor, ...)
                const expandedUserRoles = expandUserRoles(userRoles);

                // Kiểm tra xem user có ít nhất 1 role match với allowedRoles (cả 2 đều expand)
                const allowedLower = allowedRoles.map(r => r.toLowerCase());
                const expandedAllowed = expandUserRoles(allowedLower);
                const hasAccess = expandedUserRoles.some(r => expandedAllowed.includes(r));

                if (!hasAccess) {
                    router.replace("/403");
                    return;
                }

                setIsAuthorized(true);
            } catch {
                router.replace("/login");
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [pathname, allowedRoles, router]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#111518]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return <>{children}</>;
}
