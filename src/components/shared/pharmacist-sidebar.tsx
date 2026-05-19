"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PHARMACIST_MENU_GROUPS, ROUTES, type PharmacistMenuGroup } from "@/constants/routes";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";

function kebabToCamel(s: string) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function getAllHrefs(groups: PharmacistMenuGroup[]): string[] {
    const hrefs: string[] = [];
    for (const g of groups) {
        if (g.href) hrefs.push(g.href);
        g.children?.forEach((c) => hrefs.push(c.href));
    }
    return hrefs;
}

// Tính 1 lần ở module scope — PHARMACIST_MENU_GROUPS là const, không đổi giữa các render.
// Nếu tính trong component sẽ tạo array mới mỗi render → useCallback/useEffect invalidate → vòng lặp render.
const PHARMACIST_ALL_HREFS = getAllHrefs(PHARMACIST_MENU_GROUPS);

function isItemActive(href: string, pathname: string, allHrefs: string[]): boolean {
    if (pathname === href) return true;
    if (href === ROUTES.PORTAL.PHARMACIST.DASHBOARD) return false;
    if (!pathname.startsWith(href + "/")) return false;
    const hasMoreSpecific = allHrefs.some(
        (h) => h !== href && h.startsWith(href + "/") && pathname.startsWith(h)
    );
    return !hasMoreSpecific;
}

function isChildActive(group: PharmacistMenuGroup, pathname: string, allHrefs: string[]) {
    if (!group.children?.length) return false;
    return group.children.some((c) => isItemActive(c.href, pathname, allHrefs));
}

function SidebarGroupItem({
    group,
    pathname,
    isOpen,
    onToggle,
    allHrefs,
    collapsed,
    tGroup,
    tItem,
}: {
    group: PharmacistMenuGroup;
    pathname: string;
    isOpen: boolean;
    onToggle: () => void;
    allHrefs: string[];
    collapsed: boolean;
    tGroup: (key: string) => string;
    tItem: (key: string) => string;
}) {
    const hasChildren = !!group.children?.length;
    const active = hasChildren
        ? isChildActive(group, pathname, allHrefs)
        : !!group.href && isItemActive(group.href, pathname, allHrefs);

    const label = safeT(tGroup, group.key, group.label);

    // Standalone (no children)
    if (!hasChildren && group.href) {
        return (
            <Link
                href={group.href}
                title={collapsed ? label : undefined}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                        ? "bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-[#3C81C6]/20"
                        : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${active ? "" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {group.icon}
                </span>
                {!collapsed && (
                    <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                )}
            </Link>
        );
    }

    return (
        <div>
            <button
                onClick={onToggle}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                        ? "bg-[#3C81C6]/5 text-[#3C81C6] dark:bg-[#3C81C6]/10"
                        : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${active ? "text-[#3C81C6]" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {group.icon}
                </span>
                {!collapsed && (
                    <>
                        <span className={`text-sm flex-1 text-left ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                        <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                    </>
                )}
            </button>

            {!collapsed && (
                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[600px] mt-0.5" : "max-h-0"}`}>
                    <div className="ml-[22px] pl-4 border-l-2 border-[#e5e7eb] dark:border-[#2d353e] space-y-0.5 py-0.5">
                        {group.children!.map((child) => {
                            const childActive = isItemActive(child.href, pathname, allHrefs);
                            const childLabel = safeT(tItem, kebabToCamel(child.key), child.label);
                            return (
                                <Link
                                    key={child.key}
                                    href={child.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                                        childActive
                                            ? "bg-[#3C81C6]/10 text-[#3C81C6] font-bold dark:bg-[#3C81C6]/20"
                                            : "text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                                    }`}
                                >
                                    {child.icon && (
                                        <span className="material-symbols-outlined text-[16px]">{child.icon}</span>
                                    )}
                                    <span className="truncate">{childLabel}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Gọi tNav/tGroup an toàn: nếu key không tồn tại thì fallback string label gốc.
function safeT(fn: (k: string) => string, key: string, fallback: string) {
    try {
        const r = fn(key);
        // next-intl trả lại key khi missing trong production. Nếu r == key thì dùng fallback.
        return r && !r.startsWith("common.") ? r : fallback;
    } catch {
        return fallback;
    }
}

export function PharmacistSidebar() {
    const pathname = usePathname();
    const { collapsed, toggleSidebar } = useSidebar();
    const { logout } = useAuth();
    const tNav = useTranslations("common.nav.portal");
    const tGroupRaw = useTranslations("common.nav.portal.pharmacistGroup");
    const tItemRaw = useTranslations("common.nav.portal.pharmacist");

    const allHrefs = PHARMACIST_ALL_HREFS;
    const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

    // Tự mở nhóm chứa route đang active (chỉ phụ thuộc pathname — allHrefs + PHARMACIST_MENU_GROUPS là const)
    useEffect(() => {
        for (const g of PHARMACIST_MENU_GROUPS) {
            if (g.children && isChildActive(g, pathname, PHARMACIST_ALL_HREFS)) {
                setOpenGroupKey(g.key);
                return;
            }
        }
    }, [pathname]);

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-64"} bg-white dark:bg-[#1e242b] border-r border-[#e5e7eb] dark:border-[#2d353e] flex flex-col h-full shrink-0 z-20 transition-all duration-300`}>
            {/* Logo + Toggle — giữ branding Dược sĩ (gradient blue) */}
            <div className={`${collapsed ? "p-3 flex flex-col items-center gap-2" : "p-6 flex items-center gap-3"}`}>
                {!collapsed && (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/20">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>local_hospital</span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-[#121417] dark:text-white">EHealth</h1>
                            <p className="text-[10px] font-semibold text-[#3C81C6] uppercase tracking-wider">{tNav("pharmacistTagline")}</p>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/20">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>local_hospital</span>
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

            {/* Navigation — render groups thay vì flat list */}
            <nav className={`flex-1 ${collapsed ? "px-2" : "px-4"} py-2 space-y-0.5 overflow-y-auto`}>
                {PHARMACIST_MENU_GROUPS.map((g) => (
                    <SidebarGroupItem
                        key={g.key}
                        group={g}
                        pathname={pathname}
                        isOpen={openGroupKey === g.key}
                        onToggle={() => setOpenGroupKey((prev) => (prev === g.key ? null : g.key))}
                        allHrefs={allHrefs}
                        collapsed={collapsed}
                        tGroup={tGroupRaw}
                        tItem={tItemRaw}
                    />
                ))}
            </nav>

            {/* User Profile — giữ avatar "DS" + role "Dược sĩ" */}
            <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">DS</div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">Trần Văn Dược</p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">{tNav("pharmacistTagline")}</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                title="Đăng xuất"
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>logout</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
