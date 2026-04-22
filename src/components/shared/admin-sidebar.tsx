"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ADMIN_MENU_ITEMS, type AdminMenuItem } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";
import { useSidebar } from "@/contexts/SidebarContext";

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

// Pre-compute at module level — never changes
const ALL_HREFS: string[] = [];
const CHILD_HREFS_SET = new Set<string>();
for (const item of ADMIN_MENU_ITEMS) {
    if (item.href) ALL_HREFS.push(item.href);
    if (item.children) {
        for (const child of item.children) {
            ALL_HREFS.push(child.href);
            CHILD_HREFS_SET.add(child.href);
        }
    }
}

function isLeafActive(href: string, pathname: string): boolean {
    if (pathname === href) return true;
    if (href === "/admin") return false;
    if (!pathname.startsWith(href + "/")) return false;
    // Make sure no child route is more specific
    for (const childHref of Array.from(CHILD_HREFS_SET)) {
        if (childHref !== href && childHref.startsWith(href + "/") && pathname.startsWith(childHref)) {
            return false;
        }
    }
    return true;
}

interface ActiveMap {
    groupKeys: Set<string>;
    childHrefs: Set<string>;
    standaloneKeys: Set<string>;
}

function computeActiveMap(items: AdminMenuItem[], pathname: string): ActiveMap {
    const groupKeys = new Set<string>();
    const childHrefs = new Set<string>();
    const standaloneKeys = new Set<string>();

    for (const item of items) {
        if (item.children && item.children.length > 0) {
            for (const child of item.children) {
                if (isLeafActive(child.href, pathname)) {
                    groupKeys.add(item.key);
                    childHrefs.add(child.href);
                }
            }
        } else if (item.href && isLeafActive(item.href, pathname)) {
            standaloneKeys.add(item.key);
        }
    }
    return { groupKeys, childHrefs, standaloneKeys };
}

interface SidebarItemProps {
    item: AdminMenuItem;
    isGroupActive: boolean;
    activeChildHrefs: Set<string>;
    isStandaloneActive: boolean;
    isOpen: boolean;
    onToggle: () => void;
    collapsed: boolean;
}

function SidebarItemInner({
    item, isGroupActive, activeChildHrefs, isStandaloneActive, isOpen, onToggle, collapsed,
}: SidebarItemProps) {
    const t = useTranslations("common");
    const hasChildren = !!(item.children && item.children.length > 0);
    const isActive = hasChildren ? isGroupActive : isStandaloneActive;
    const label = GROUP_I18N_KEY[item.key] ? t(GROUP_I18N_KEY[item.key]) : item.label;

    if (!hasChildren && item.href) {
        return (
            <Link
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                        ? "bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-[#3C81C6]/20"
                        : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
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
                    isActive
                        ? "bg-[#3C81C6]/5 text-[#3C81C6] dark:bg-[#3C81C6]/10"
                        : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-[#3C81C6]" : "group-hover:text-[#3C81C6]"} transition-colors`}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <>
                        <span className={`text-sm flex-1 text-left ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
                        <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                    </>
                )}
            </button>

            {!collapsed && (
                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-48 mt-0.5" : "max-h-0"}`}>
                    <div className="ml-[22px] pl-4 border-l-2 border-[#e5e7eb] dark:border-[#2d353e] space-y-0.5 py-0.5">
                        {item.children!.map((child) => {
                            const childActive = activeChildHrefs.has(child.href);
                            const childLabel = CHILD_I18N_KEY[child.key] ? t(CHILD_I18N_KEY[child.key]) : child.label;
                            return (
                                <Link
                                    key={child.key}
                                    href={child.href}
                                    className={`block px-3 py-2 rounded-lg text-[13px] transition-colors ${
                                        childActive
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

    // Compute active state once per pathname change — no useEffect double-render
    const activeMap = useMemo(() => computeActiveMap(ADMIN_MENU_ITEMS, pathname), [pathname]);

    // Default open group = active group key (derived, not state)
    const defaultOpenKey = activeMap.groupKeys.size > 0 ? Array.from(activeMap.groupKeys)[0] : null;
    const [overrideKey, setOverrideKey] = useState<string | null | "NONE">(null);

    // Resolve open key: user override takes priority; null resets to active group
    const openGroupKey = overrideKey === "NONE" ? null : (overrideKey ?? defaultOpenKey);

    const handleToggleGroup = useCallback((key: string) => {
        setOverrideKey((prev) => {
            const currentlyOpen = (prev === "NONE" ? null : (prev ?? defaultOpenKey)) === key;
            return currentlyOpen ? "NONE" : key;
        });
    }, [defaultOpenKey]);

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-72"} bg-white dark:bg-[#1e242b] border-r border-[#dde0e4] dark:border-[#2d353e] flex flex-col flex-shrink-0 h-full transition-all duration-300`}>
            {/* Logo + Toggle */}
            <div className={`${collapsed ? "p-3 flex flex-col items-center gap-2" : "p-6 flex items-center gap-3"}`}>
                {!collapsed && (
                    <>
                        <div className="bg-[#3C81C6]/10 p-2 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3C81C6] text-3xl">local_hospital</span>
                        </div>
                        <div className="flex flex-col flex-1">
                            <h1 className="text-[#121417] dark:text-white text-lg font-bold leading-tight">{UI_TEXT.APP.NAME}</h1>
                            <p className="text-[#687582] dark:text-gray-400 text-xs font-normal">{UI_TEXT.APP.TAGLINE}</p>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="bg-[#3C81C6]/10 p-2 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#3C81C6] text-2xl">local_hospital</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#687582] hover:text-[#3C81C6]"
                    title={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
                >
                    <span className="material-symbols-outlined text-[20px]">{collapsed ? "menu_open" : "menu"}</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-4"} py-2 space-y-0.5`}>
                {ADMIN_MENU_ITEMS.map((item) => (
                    <SidebarItemInner
                        key={item.key}
                        item={item}
                        isGroupActive={activeMap.groupKeys.has(item.key)}
                        activeChildHrefs={activeMap.childHrefs}
                        isStandaloneActive={activeMap.standaloneKeys.has(item.key)}
                        isOpen={openGroupKey === item.key}
                        onToggle={() => handleToggleGroup(item.key)}
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
                            <p className="text-sm font-bold truncate text-[#121417] dark:text-white">Admin Quản trị</p>
                            <p className="text-xs text-[#687582] dark:text-gray-400 truncate">admin@ehealth.vn</p>
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
