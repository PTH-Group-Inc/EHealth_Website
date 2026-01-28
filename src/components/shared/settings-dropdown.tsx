"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export function SettingsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Determine the current context (admin or doctor)
    const isDoctor = pathname.startsWith("/portal/doctor");
    const settingsRoute = isDoctor ? ROUTES.PORTAL.DOCTOR.SETTINGS : ROUTES.ADMIN.SETTINGS;
    const portalLabel = isDoctor ? "E-Health Doctor" : "E-Health Admin";

    // Check initial dark mode state
    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setIsDarkMode(!isDarkMode);
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
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <h3 className="font-bold text-[#121417] dark:text-white">Cài đặt nhanh</h3>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="p-3">
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isDarkMode ? "left-6" : "left-1"}`}
                                ></span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#dde0e4] dark:border-[#2d353e]"></div>

                    {/* Links */}
                    <div className="p-2">
                        <Link
                            href={settingsRoute}
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">manage_accounts</span>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-[#121417] dark:text-white block">Cài đặt tài khoản</span>
                                <span className="text-xs text-[#687582]">Thông tin cá nhân, bảo mật</span>
                            </div>
                            <span className="material-symbols-outlined text-[16px] text-[#687582]">chevron_right</span>
                        </Link>
                        <Link
                            href={settingsRoute}
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">tune</span>
                            <span className="text-sm font-medium text-[#121417] dark:text-white">Cài đặt hệ thống</span>
                            <span className="material-symbols-outlined text-[16px] text-[#687582] ml-auto">chevron_right</span>
                        </Link>
                        <a
                            href="https://support.example.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">help</span>
                            <span className="text-sm font-medium text-[#121417] dark:text-white">Trợ giúp & Hỗ trợ</span>
                            <span className="material-symbols-outlined text-[16px] text-[#687582] ml-auto">open_in_new</span>
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#dde0e4] dark:border-[#2d353e]"></div>

                    {/* Version info */}
                    <div className="px-4 py-3">
                        <p className="text-xs text-[#687582] text-center">{portalLabel} v1.0.0</p>
                    </div>
                </div>
            )}
        </div>
    );
}
