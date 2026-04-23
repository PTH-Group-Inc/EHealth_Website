"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RECEPTIONIST_MENU_ITEMS } from "@/constants/routes";
import { useSidebar } from "@/contexts/SidebarContext";

export function ReceptionistSidebar() {
    const pathname = usePathname();
    const { collapsed, toggleSidebar } = useSidebar();
    const tNav = useTranslations("common.nav.portal");

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-64"} bg-white dark:bg-[#1e242b] border-r border-[#e5e7eb] dark:border-[#2d353e] flex flex-col h-full shrink-0 z-20 transition-all duration-300`}>
            {/* Logo + Toggle */}
            <div className={`${collapsed ? "p-3 flex flex-col items-center gap-2" : "p-6 flex items-center gap-3"}`}>
                {!collapsed && (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/20">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>
                                local_hospital
                            </span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-[#121417] dark:text-white">EHealth</h1>
                            <p className="text-[10px] font-semibold text-[#3C81C6] uppercase tracking-wider">{tNav("staffTagline")}</p>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/20">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>
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
                {RECEPTIONIST_MENU_ITEMS.map((item) => {
                    const active = item.key === "dashboard"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    const label = tNav(`staff.${item.key}`);

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
                                className={`material-symbols-outlined ${active ? "fill-1" : "group-hover:text-[#3C81C6]"} transition-colors`}
                                style={{ fontSize: "22px" }}
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
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        LT
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">
                                    Nguyễn Thị Hoa
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">{tNav("staffTagline")}</p>
                            </div>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>
                                    logout
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
