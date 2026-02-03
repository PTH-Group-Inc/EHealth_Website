"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES, ADMIN_MENU_ITEMS } from "@/constants/routes";
import { NotificationDropdown } from "./notification-dropdown";
import { SettingsDropdown } from "./settings-dropdown";

export function AdminHeader() {
    const pathname = usePathname();

    // Build breadcrumb from pathname
    const getBreadcrumbs = () => {
        const crumbs = [{ label: "Trang chủ", href: ROUTES.ADMIN.DASHBOARD as string }];

        // Find matching menu item
        const menuItem = ADMIN_MENU_ITEMS.find((item) => item.href === pathname);
        if (menuItem && pathname !== ROUTES.ADMIN.DASHBOARD) {
            crumbs.push({ label: menuItem.label, href: menuItem.href as string });
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e] h-16 px-6">
            {/* Breadcrumbs */}
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

            {/* Right Actions */}
            <div className="flex items-center gap-1">
                <NotificationDropdown />
                <SettingsDropdown />
            </div>
        </header>
    );
}
