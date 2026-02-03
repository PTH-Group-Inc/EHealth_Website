"use client";

import { UI_TEXT } from "@/constants/ui-text";

// Types
interface WeeklyData {
    day: string;
    count: number;
    percentage: number;
}

interface WeeklyStatsChartProps {
    data: WeeklyData[];
    todayIndex?: number;
}

// Chart Bar Component
function ChartBar({
    item,
    isToday
}: {
    item: WeeklyData;
    isToday: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
            <div
                className={`relative w-full max-w-[40px] rounded-t-md transition-all duration-300 ${isToday
                        ? "bg-[#3C81C6] shadow-lg shadow-blue-200 dark:shadow-none"
                        : "bg-[#3C81C6]/10 group-hover:bg-[#3C81C6]/20"
                    }`}
                style={{ height: `${item.percentage}%` }}
            >
                <div
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e242b] text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity ${isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                >
                    {item.count}
                </div>
            </div>
            <span className={`text-xs ${isToday ? "font-bold text-[#3C81C6]" : "text-gray-400"}`}>
                {item.day}
            </span>
        </div>
    );
}

// Time Period Selector
function TimePeriodSelector() {
    return (
        <select className="text-sm border-none bg-[#f8fafc] dark:bg-gray-800 text-[#687582] dark:text-gray-300 rounded-lg py-1 px-3 focus:ring-0 cursor-pointer outline-none">
            <option>Tuần hiện tại</option>
            <option>Tuần trước</option>
        </select>
    );
}

// Main Component
export function WeeklyStatsChart({ data, todayIndex = 2 }: WeeklyStatsChartProps) {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                    {UI_TEXT.DOCTOR.DASHBOARD.WEEKLY_STATS}
                </h3>
                <TimePeriodSelector />
            </div>

            {/* Chart */}
            <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                {data.map((item, index) => (
                    <ChartBar
                        key={item.day}
                        item={item}
                        isToday={index === todayIndex}
                    />
                ))}
            </div>
        </div>
    );
}

export default WeeklyStatsChart;
