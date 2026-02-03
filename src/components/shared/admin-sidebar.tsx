"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MENU_ITEMS } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

export function AdminSidebar() {
    const pathname = usePathname();

    // Check if current path matches menu item
    const isActive = (href: string) => {
        if (href === "/admin") {
            return pathname === "/admin";
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-72 bg-white dark:bg-[#1e242b] border-r border-[#dde0e4] dark:border-[#2d353e] flex flex-col flex-shrink-0 h-full transition-all duration-300">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-[#3C81C6]/10 p-2 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#3C81C6] text-3xl">
                        local_hospital
                    </span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-[#121417] dark:text-white text-lg font-bold leading-tight">
                        {UI_TEXT.APP.NAME}
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400 text-xs font-normal">
                        {UI_TEXT.APP.TAGLINE}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {ADMIN_MENU_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${active
                                    ? "bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-[#3C81C6]/20"
                                    : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined ${active ? "fill-current" : "group-hover:text-[#3C81C6]"
                                    } transition-colors`}
                            >
                                {item.icon}
                            </span>
                            <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] mt-auto">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <div
                        className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200"
                        style={{
                            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQYIqPn_-s62aeppqoiMtHkuez698P9PXA0a03QBC6Wns_EQXjLkFJ_kJ7tzpoo_H3_6578fCpsYqlWJfw_vA4F3u8ONBugqU-9uZxbs3JMaXbLuLbBLdJSvRr8C2lzIA5O1q7CaeG3LI0a5VYEyfkU7hZU-J_MwS62b8d2X8QUV72FNA27BURKLxPpwBtvxL6J6Grch4aSlFi9g5EGsWwf5FzDDyl1Zz9Gq53I6G74TUGy4o-QzsXSD42oWJNRv5LKMCEdlkD0LIl')`,
                        }}
                    />
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold truncate text-[#121417] dark:text-white">
                            Admin Quản trị
                        </p>
                        <p className="text-xs text-[#687582] dark:text-gray-400 truncate">
                            admin@ehealth.vn
                        </p>
                    </div>
                    <button className="ml-auto text-[#687582] hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
