"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES, DOCTOR_MENU_ITEMS } from "@/constants/routes";
import { NotificationBell } from "./NotificationBell";
import { SettingsDropdown } from "./settings-dropdown";
import { LanguageSwitcher } from "./LanguageSwitcher";
import AIStatusBadge from '@/components/ai-copilot/AIStatusBadge';
import AISearchBar from '@/components/ai-copilot/AISearchBar';
import AIGamificationBadge from '@/components/ai-copilot/AIGamificationBadge';

export function DoctorHeader() {
    const pathname = usePathname();

    // Build breadcrumb from pathname
    const getBreadcrumbs = () => {
        const crumbs = [{ label: "Trang chủ", href: ROUTES.PORTAL.DOCTOR.DASHBOARD as string }];

        // Find matching menu item
        const menuItem = DOCTOR_MENU_ITEMS.find((item) => item.href === pathname);
        if (menuItem && pathname !== ROUTES.PORTAL.DOCTOR.DASHBOARD) {
            crumbs.push({ label: menuItem.label, href: menuItem.href as string });
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Get current date in Vietnamese
    const getCurrentDate = () => {
        const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const months = [
            "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
            "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
        ];
        const now = new Date();
        return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    };

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white dark:bg-[#1e242b] border-b border-[#e5e7eb] dark:border-[#2d353e] h-16 px-6 shadow-sm">
            {/* Breadcrumbs & Date */}
            <div className="flex flex-col">
                <nav className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.href} className="flex items-center gap-2">
                            {index > 0 && (
                                <span className="text-[#687582] dark:text-gray-500">/</span>
                            )}
                            {index === breadcrumbs.length - 1 ? (
                                <span className="font-semibold text-[#121417] dark:text-white">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
                <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                    {getCurrentDate()}
                </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* AI Search */}
                <AISearchBar />

                {/* AI Status + Notifications & Settings */}
                <div className="flex items-center gap-1">
                    <AIGamificationBadge />
                    <AIStatusBadge />
                    <LanguageSwitcher variant="compact" />
                    <NotificationBell />
                    <SettingsDropdown />
                </div>
            </div>
        </header>
    );
}
