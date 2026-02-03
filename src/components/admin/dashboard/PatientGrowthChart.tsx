"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

// Types
interface PatientGrowthData {
    month: string;
    value: number;
}

interface PatientGrowthChartProps {
    data: PatientGrowthData[];
    highlightIndex?: number;
}

// Chart Bar Component
function ChartBar({
    item,
    index,
    isHighlighted
}: {
    item: PatientGrowthData;
    index: number;
    isHighlighted: boolean;
}) {
    return (
        <div className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div
                className={`w-full ${isHighlighted
                        ? "bg-[#3C81C6] shadow-lg shadow-blue-200 dark:shadow-none"
                        : "bg-[#3C81C6]/10 group-hover:bg-[#3C81C6]/20"
                    } rounded-t-sm relative transition-all duration-300`}
                style={{ height: `${item.value}%` }}
            >
                {isHighlighted && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e242b] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        2,450
                    </div>
                )}
            </div>
            <span className={`text-xs ${isHighlighted ? "font-bold text-[#3C81C6]" : "text-gray-400"}`}>
                {item.month}
            </span>
        </div>
    );
}

// Time Period Selector
function TimePeriodSelector() {
    return (
        <select className="text-sm border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-[#687582] dark:text-gray-300 focus:ring-[#3C81C6] focus:border-[#3C81C6] px-3 py-1.5">
            <option>12 tháng qua</option>
            <option>6 tháng qua</option>
            <option>Tháng này</option>
        </select>
    );
}

// Main Component
export function PatientGrowthChart({ data, highlightIndex = 7 }: PatientGrowthChartProps) {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.DASHBOARD.PATIENT_GROWTH}
                    </h3>
                    <p className="text-xs text-[#687582] dark:text-gray-400">
                        Thống kê lượng bệnh nhân mới trong năm 2024
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <TimePeriodSelector />
                    <Link
                        href={ROUTES.ADMIN.STATISTICS}
                        className="text-xs text-[#3C81C6] hover:underline font-medium"
                    >
                        {UI_TEXT.COMMON.VIEW_DETAILS}
                    </Link>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 mt-8 px-2">
                {data.map((item, index) => (
                    <ChartBar
                        key={item.month}
                        item={item}
                        index={index}
                        isHighlighted={index === highlightIndex}
                    />
                ))}
            </div>
        </div>
    );
}

export default PatientGrowthChart;
