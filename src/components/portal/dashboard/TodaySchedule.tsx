"use client";

import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";

// Types
interface ScheduleItem {
    id: string;
    time: string;
    title: string;
    location?: string;
    duration?: string;
    status: string;
}

interface TodayScheduleProps {
    schedule: ScheduleItem[];
}

// Utility function
function getScheduleStatusStyle(status: string) {
    switch (status) {
        case "completed":
            return { bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-500" };
        case "ongoing":
            return { bg: "bg-white", border: "border-green-200", dot: "bg-green-500 ring-4 ring-green-100" };
        case "upcoming":
            return { bg: "bg-[#f8fafc]", border: "border-dashed border-[#cbd5e1]", dot: "bg-[#cbd5e1]" };
        default:
            return { bg: "bg-gray-50", border: "border-gray-100", dot: "bg-gray-400" };
    }
}

// Schedule Item Component
function ScheduleItemCard({
    item,
    isLast
}: {
    item: ScheduleItem;
    isLast: boolean;
}) {
    const style = getScheduleStatusStyle(item.status);

    return (
        <div className="flex gap-4 group">
            {/* Time & Timeline */}
            <div className="flex flex-col items-center gap-1">
                <span
                    className={`text-xs font-bold ${item.status === "upcoming"
                        ? "text-[#687582]"
                        : "text-[#121417] dark:text-white"
                        }`}
                >
                    {item.time}
                </span>
                <div
                    className={`w-0.5 h-full ${isLast ? "bg-transparent" : "bg-[#e5e7eb] dark:bg-[#2d353e]"
                        } relative`}
                >
                    <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full ${style.dot}`}
                    ></div>
                </div>
            </div>

            {/* Content */}
            <div
                className={`pb-4 ${isLast ? "border-none" : "border-b border-[#f1f2f4] dark:border-[#2d353e]"
                    } w-full`}
            >
                <div className={`${style.bg} p-3 rounded-lg border ${style.border}`}>
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-[#121417] dark:text-white">
                            {item.title}
                        </p>
                        {item.status === "ongoing" && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase">
                                Đang diễn ra
                            </span>
                        )}
                    </div>
                    {item.location && (
                        <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">
                            {item.location} • {item.duration}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Component
export function TodaySchedule({ schedule }: TodayScheduleProps) {
    return (
        <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                    {UI_TEXT.DOCTOR.DASHBOARD.TODAY_SCHEDULE}
                </h3>
                <Link
                    href={ROUTES.PORTAL.DOCTOR.APPOINTMENTS}
                    className="text-sm text-[#3C81C6] font-medium hover:underline"
                >
                    {UI_TEXT.COMMON.VIEW_ALL}
                </Link>
            </div>

            {/* Schedule List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {schedule.map((item, index) => (
                    <ScheduleItemCard
                        key={item.id}
                        item={item}
                        isLast={index === schedule.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}

export default TodaySchedule;
