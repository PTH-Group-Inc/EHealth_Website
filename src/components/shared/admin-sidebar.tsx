"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ADMIN_MENU_ITEMS, type AdminMenuItem } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";
import { useSidebar } from "@/contexts/SidebarContext";

/**
 * Map key nhóm sidebar admin → i18n key trong common.json/nav.*
 * Fallback về `item.label` nếu key không có trong map.
 */
const GROUP_I18N_KEY: Record<string, string> = {
    "dashboard": "nav.home",
    "users": "nav.staffManagement",
    "hospital": "nav.facilityManagement",
    "operations": "nav.operations",
    "ops-config": "nav.opsConfig",
    "coordination": "nav.coordination",
    "telemedicine": "nav.telemedicine",
    "medicines": "nav.pharmacy",
    "finance": "nav.finance",
    "system-data": "nav.systemData",
    "statistics": "nav.statistics",
    "activity-logs": "nav.activityLogs",
    "settings": "nav.settings",
};

/**
 * Map key menu con → i18n key.
 */
const CHILD_I18N_KEY: Record<string, string> = {
    "users-list": "nav.menu.users",
    "doctors-list": "nav.menu.doctors",
    "users-roles": "nav.menu.roles",
    "permissions": "nav.menu.permissions",
    "hospitals": "nav.menu.hospitals",
    "branches": "nav.menu.branches",
    "departments": "nav.menu.departments",
    "specialties": "nav.menu.specialties",
    "services": "nav.menu.services",
    "clinic-rooms": "nav.menu.clinicRooms",
    "equipment": "nav.menu.equipment",
    "beds": "nav.menu.beds",
    "time-slots": "nav.menu.timeSlots",
    "shifts": "nav.menu.shifts",
    "staff-schedule": "nav.menu.staffSchedule",
    "schedules": "nav.menu.schedules",
    "leaves": "nav.menu.leaves",
    "shift-swaps": "nav.menu.shiftSwaps",
    "slots-config": "nav.menu.slotsConfig",
    "slots-locked": "nav.menu.slotsLocked",
    "shift-services": "nav.menu.shiftServices",
    "service-durations": "nav.menu.serviceDurations",
    "booking-configs": "nav.menu.bookingConfigs",
    "operating-hours": "nav.menu.operatingHours",
    "facility-status": "nav.menu.facilityStatus",
    "doctor-load": "nav.menu.doctorLoad",
    "doctor-availability": "nav.menu.doctorAvailability",
    "appointment-changes": "nav.menu.appointmentChanges",
    "tele-types": "nav.menu.teleTypes",
    "tele-bookings": "nav.menu.teleBookings",
    "tele-rooms": "nav.menu.teleRooms",
    "tele-results": "nav.menu.teleResults",
    "tele-prescriptions": "nav.menu.telePrescriptions",
    "tele-followups": "nav.menu.teleFollowups",
    "tele-quality": "nav.menu.teleQuality",
    "medicines-list": "nav.menu.medicinesList",
    "medicines-import": "nav.menu.medicinesImport",
    "medicines-export": "nav.menu.medicinesExport",
    "medicines-stock": "nav.menu.medicinesStock",
    "warehouses": "nav.menu.warehouses",
    "suppliers": "nav.menu.suppliers",
    "pharmacy-categories": "nav.menu.pharmacyCategories",
    "billing-invoices": "nav.menu.billingInvoices",
    "pricing-policies": "nav.menu.pricingPolicies",
    "promotions": "nav.menu.promotions",
    "e-invoices": "nav.menu.eInvoices",
    "payment-gateway": "nav.menu.paymentGateway",
    "reconciliation": "nav.menu.reconciliation",
    "refunds": "nav.menu.refunds",
    "master-data": "nav.menu.masterData",
    "notif-role-configs": "nav.menu.notifRoleConfigs",
    "notif-broadcast": "nav.menu.notifBroadcast",
    "statistics-overview": "nav.menu.statisticsOverview",
    "statistics-revenue": "nav.menu.statisticsRevenue",
};

// Helper: kiểm tra item có child đang active không
function isChildActiveForItem(item: AdminMenuItem, pathname: string) {
    if (!item.children || item.children.length === 0) return false;
    return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
}

// Helper: collect ALL known hrefs (including children) so we can check for more-specific matches
function getAllHrefs(items: AdminMenuItem[]): string[] {
    const hrefs: string[] = [];
    for (const item of items) {
        if (item.href) hrefs.push(item.href);
        if (item.children) {
            for (const child of item.children) {
                hrefs.push(child.href);
            }
        }
    }
    return hrefs;
}

// Helper: check if a standalone item (no children) should be active
function isItemActive(itemHref: string, pathname: string, allHrefs: string[]): boolean {
    if (pathname === itemHref) return true;
    if (itemHref === "/admin") return false;
    if (!pathname.startsWith(itemHref + '/')) return false;
    const hasMoreSpecific = allHrefs.some(
        (href) => href !== itemHref && href.startsWith(itemHref + '/') && pathname.startsWith(href)
    );
    return !hasMoreSpecific;
}

// Sidebar menu item — nhận trạng thái open từ cha
function SidebarItem({
    item,
    pathname,
    isOpen,
    onToggle,
    allHrefs,
    collapsed,
}: {
    item: AdminMenuItem;
    pathname: string;
    isOpen: boolean;
    onToggle: () => void;
    allHrefs: string[];
    collapsed: boolean;
}) {
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && isChildActiveForItem(item, pathname);
    const isDirectActive = item.href ? isItemActive(item.href, pathname, allHrefs) : false;
    const isActive = hasChildren ? isChildActive : isDirectActive;
    const t = useTranslations("common");

    // Translate label của nhóm: ưu tiên i18n map, fallback item.label
    const label = GROUP_I18N_KEY[item.key] ? t(GROUP_I18N_KEY[item.key]) : item.label;

    // Item đơn (không có children)
    if (!hasChildren && item.href) {
        return (
            <Link
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-[#3C81C6]/20"
                    : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                        {label}
                    </span>
                )}
            </Link>
        );
    }

    // Item nhóm (có children) — accordion
    return (
        <div>
            <button
                onClick={onToggle}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-[#3C81C6]/5 text-[#3C81C6] dark:bg-[#3C81C6]/10"
                    : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-[#3C81C6]" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <>
                        <span className={`text-sm flex-1 text-left ${isActive ? "font-bold" : "font-medium"}`}>
                            {label}
                        </span>
                        <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                    </>
                )}
            </button>

            {/* Submenu — accordion animation (hidden when collapsed) */}
            {!collapsed && (
                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-48 mt-0.5" : "max-h-0"}`}>
                    <div className="ml-[22px] pl-4 border-l-2 border-[#e5e7eb] dark:border-[#2d353e] space-y-0.5 py-0.5">
                        {item.children!.map((child) => {
                            const childActive = isItemActive(child.href, pathname, allHrefs);
                            const childLabel = CHILD_I18N_KEY[child.key] ? t(CHILD_I18N_KEY[child.key]) : child.label;
                            return (
                                <Link
                                    key={child.key}
                                    href={child.href}
                                    className={`block px-3 py-2 rounded-lg text-[13px] transition-colors ${childActive
                                        ? "bg-[#3C81C6]/10 text-[#3C81C6] font-bold dark:bg-[#3C81C6]/20"
                                        : "text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                                        }`}
                                >
                                    {childLabel}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function AdminSidebar() {
    const pathname = usePathname();
    const { collapsed, toggleSidebar } = useSidebar();
    const allHrefs = getAllHrefs(ADMIN_MENU_ITEMS);
    // Accordion: chỉ 1 nhóm mở tại 1 thời điểm
    const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

    // Tự động mở nhóm active khi pathname thay đổi
    const getActiveGroupKey = useCallback((path: string) => {
        for (const item of ADMIN_MENU_ITEMS) {
            if (item.children && item.children.length > 0 && isChildActiveForItem(item, path)) {
                return item.key;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        setOpenGroupKey(getActiveGroupKey(pathname));
    }, [pathname, getActiveGroupKey]);

    const handleToggleGroup = (key: string) => {
        setOpenGroupKey((prev) => (prev === key ? null : key));
    };

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-72"} bg-white dark:bg-[#1e242b] border-r border-[#dde0e4] dark:border-[#2d353e] flex flex-col flex-shrink-0 h-full transition-all duration-300`}>
            {/* Logo + Toggle */}
            <div className={`${collapsed ? "p-3 flex flex-col items-center gap-2" : "p-6 flex items-center gap-3"}`}>
                {!collapsed && (
                    <>
                        <div className="bg-[#3C81C6]/10 p-2 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3C81C6] text-3xl">
                                local_hospital
                            </span>
                        </div>
                        <div className="flex flex-col flex-1">
                            <h1 className="text-[#121417] dark:text-white text-lg font-bold leading-tight">
                                {UI_TEXT.APP.NAME}
                            </h1>
                            <p className="text-[#687582] dark:text-gray-400 text-xs font-normal">
                                {UI_TEXT.APP.TAGLINE}
                            </p>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="bg-[#3C81C6]/10 p-2 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#3C81C6] text-2xl">
                            local_hospital
                        </span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#687582] hover:text-[#3C81C6]"
                    title={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {collapsed ? "menu_open" : "menu"}
                    </span>
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-4"} py-2 space-y-0.5`}>
                {ADMIN_MENU_ITEMS.map((item) => (
                    <SidebarItem
                        key={item.key}
                        item={item}
                        pathname={pathname}
                        isOpen={openGroupKey === item.key}
                        onToggle={() => handleToggleGroup(item.key)}
                        allHrefs={allHrefs}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] mt-auto">
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors`}>
                    <div
                        className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 shrink-0"
                        style={{
                            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQYIqPn_-s62aeppqoiMtHkuez698P9PXA0a03QBC6Wns_EQXjLkFJ_kJ7tzpoo_H3_6578fCpsYqlWJfw_vA4F3u8ONBugqU-9uZxbs3JMaXbLuLbBLdJSvRr8C2lzIA5O1q7CaeG3LI0a5VYEyfkU7hZU-J_MwS62b8d2X8QUV72FNA27BURKLxPpwBtvxL6J6Grch4aSlFi9g5EGsWwf5FzDDyl1Zz9Gq53I6G74TUGy4o-QzsXSD42oWJNRv5LKMCEdlkD0LIl')`,
                        }}
                    />
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-bold truncate text-[#121417] dark:text-white">
                                Admin Quản trị
                            </p>
                            <p className="text-xs text-[#687582] dark:text-gray-400 truncate">
                                admin@ehealth.vn
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <button className="ml-auto text-[#687582] hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
