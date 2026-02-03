"use client";

import { UI_TEXT } from "@/constants/ui-text";

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
}

export function PageHeader({
    title = UI_TEXT.ADMIN.DASHBOARD.TITLE,
    subtitle = UI_TEXT.ADMIN.DASHBOARD.SUBTITLE
}: PageHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                {title}
            </h1>
            <p className="text-[#687582] dark:text-gray-400 mt-1">
                {subtitle}
            </p>
        </div>
    );
}

export default PageHeader;
