"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DOCTOR_MENU_ITEMS, ROUTES } from "@/constants/routes";
import { useSidebar } from "@/contexts/SidebarContext";

export function DoctorSidebar() {
    const pathname = usePathname();
    const { collapsed, toggleSidebar } = useSidebar();
    const tNav = useTranslations("common.nav.portal");

    const isActive = (href: string) => {
        if (href === ROUTES.PORTAL.DOCTOR.DASHBOARD) {
            return pathname === ROUTES.PORTAL.DOCTOR.DASHBOARD;
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-64"} bg-white dark:bg-[#1e242b] border-r border-[#e5e7eb] dark:border-[#2d353e] flex flex-col h-full shrink-0 z-20 transition-all duration-300`}>
            {/* Logo + Toggle */}
            <div className={`${collapsed ? "p-3 flex flex-col items-center gap-2" : "p-6 flex items-center gap-3"}`}>
                {!collapsed && (
                    <>
                        <div className="bg-[#3C81C6]/10 rounded-lg p-2 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3C81C6] text-3xl">
                                local_hospital
                            </span>
                        </div>
                        <div className="flex flex-col flex-1">
                            <h1 className="text-lg font-bold text-[#121417] dark:text-white leading-tight">
                                E-Health
                            </h1>
                            <p className="text-[#687582] dark:text-gray-400 text-xs font-medium">
                                {tNav("doctorTagline")}
                            </p>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="bg-[#3C81C6]/10 rounded-lg p-2 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#3C81C6] text-2xl">
                            local_hospital
                        </span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#687582] hover:text-[#3C81C6]"
                    title={collapsed ? tNav("expandSidebar") : tNav("collapseSidebar")}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {collapsed ? "menu_open" : "menu"}
                    </span>
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 ${collapsed ? "px-2" : "px-4"} flex flex-col gap-1 overflow-y-auto`}>
                {DOCTOR_MENU_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    const label = tNav(`doctor.${item.key === "medical-records" ? "medicalRecords" : item.key === "ai-assistant" ? "aiAssistant" : item.key}`);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            title={collapsed ? label : undefined}
                            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors group ${active
                                    ? "bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-[#3C81C6]/20"
                                    : "text-[#687582] dark:text-gray-400 hover:bg-[#f1f2f4] dark:hover:bg-gray-800 hover:text-[#121417] dark:hover:text-white"
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined ${active ? "fill-1" : "group-hover:text-[#3C81C6]"
                                    } transition-colors`}
                            >
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>
                                    {label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-lg hover:bg-[#f1f2f4] dark:hover:bg-gray-800 cursor-pointer transition-colors`}>
                    <div
                        className="size-10 rounded-full bg-cover bg-center border border-gray-200 shrink-0"
                        style={{
                            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDe1rc71Y7tDtvAIsivpcpjQnKf7Ilt1nM6EZmYVYwkjQ-EDUXOe4tp0zVG61kptcoC6rC85SSecuu1xYemUygIvJDm8KszhMZUbcFpTR6dWes4qn3vnzPhyZEcS_-y074gFSVdid3bgZxh7ycwM241VD8_uAZbwQTHfnV90tbuM2fsxfhnIH-uMlxnBfmBBrBLB9P_hMor36bwfYbJDUoRXfuHo8jL5YSPHxsvbe1JWyNVw6E1zVymCev-31CXVv-mC3ZLkWowxCqU')`,
                        }}
                    />
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">
                                BS. Nguyễn Văn Minh
                            </p>
                            <p className="text-xs text-[#687582] dark:text-gray-400 truncate">
                                Khoa Nội Tổng Quát
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
