"use client";

import { UI_TEXT } from "@/constants/ui-text";

interface DoctorPageHeaderProps {
    title?: string;
    subtitle?: string;
}

export function DoctorPageHeader({
    title = UI_TEXT.DOCTOR.DASHBOARD.TITLE,
    subtitle = UI_TEXT.DOCTOR.DASHBOARD.SUBTITLE
}: DoctorPageHeaderProps) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                {title}
            </h2>
            <p className="text-sm text-[#687582] dark:text-gray-400">
                {subtitle}
            </p>
        </div>
    );
}

export default DoctorPageHeader;
