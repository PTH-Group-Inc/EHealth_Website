"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

// Cấu hình theo vai trò
const PORTAL_CONFIG: Record<string, { label: string; settingsRoute: string; initials: string; name: string; role: string }> = {
    "/portal/doctor": {
        label: "Bác sĩ",
        settingsRoute: ROUTES.PORTAL.DOCTOR.SETTINGS,
        initials: "BS",
        name: "Nguyễn Văn Minh",
        role: "Bác sĩ — Khoa Nội Tổng Quát",
    },
    "/portal/pharmacist": {
        label: "Dược sĩ",
        settingsRoute: ROUTES.PORTAL.PHARMACIST.SETTINGS,
        initials: "DS",
        name: "Trần Văn Dược",
        role: "Dược sĩ — Quầy phát thuốc số 2",
    },
    "/portal/receptionist": {
        label: "Lễ tân",
        settingsRoute: ROUTES.PORTAL.RECEPTIONIST.SETTINGS,
        initials: "LT",
        name: "Phạm Thị Hoa",
        role: "Lễ tân — Quầy tiếp nhận 1",
    },
    "/admin": {
        label: "Quản trị viên",
        settingsRoute: ROUTES.ADMIN.SETTINGS,
        initials: "QT",
        name: "Admin Hệ Thống",
        role: "Quản trị viên",
    },
};

function getPortalConfig(pathname: string) {
    for (const [prefix, config] of Object.entries(PORTAL_CONFIG)) {
        if (pathname.startsWith(prefix)) return config;
    }
    return PORTAL_CONFIG["/admin"];
}

export function SettingsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const config = getPortalConfig(pathname);

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = () => {
        setIsOpen(false);
        // Xóa token/session khỏi localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.push(ROUTES.PUBLIC.LOGIN);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 z-50">
                    {/* Thông tin người dùng */}
                    <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {config.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{config.name}</p>
                                <p className="text-xs text-[#687582] truncate">{config.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chế độ tối */}
                    <div className="p-2">
                        <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">
                                    {isDarkMode ? "light_mode" : "dark_mode"}
                                </span>
                                <span className="text-sm font-medium text-[#121417] dark:text-white">
                                    Chế độ {isDarkMode ? "sáng" : "tối"}
                                </span>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`relative w-11 h-6 rounded-full transition-colors ${isDarkMode ? "bg-[#3C81C6]" : "bg-gray-300 dark:bg-gray-600"}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isDarkMode ? "left-6" : "left-1"}`} />
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[#dde0e4] dark:border-[#2d353e]" />

                    {/* Menu chính */}
                    <div className="p-2">
                        <Link
                            href={config.settingsRoute}
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">manage_accounts</span>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-[#121417] dark:text-white block">Hồ sơ cá nhân</span>
                                <span className="text-xs text-[#687582]">Thông tin tài khoản, mật khẩu</span>
                            </div>
                            <span className="material-symbols-outlined text-[16px] text-[#687582]">chevron_right</span>
                        </Link>

                        <Link
                            href={config.settingsRoute}
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">notifications</span>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-[#121417] dark:text-white block">Thông báo</span>
                                <span className="text-xs text-[#687582]">Tùy chỉnh nhận thông báo</span>
                            </div>
                            <span className="material-symbols-outlined text-[16px] text-[#687582]">chevron_right</span>
                        </Link>
                    </div>

                    <div className="border-t border-[#dde0e4] dark:border-[#2d353e]" />

                    {/* Đăng xuất */}
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left group"
                        >
                            <span className="material-symbols-outlined text-[20px] text-red-500">logout</span>
                            <span className="text-sm font-medium text-red-500">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
