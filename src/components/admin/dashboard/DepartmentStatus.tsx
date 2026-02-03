"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

// Types
interface DepartmentLoad {
    id: string;
    name: string;
    loadPercentage: number;
}

interface DepartmentStatusProps {
    departments: DepartmentLoad[];
}

// Utility function
function getLoadColor(percentage: number): string {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-400";
    if (percentage >= 40) return "bg-yellow-400";
    return "bg-green-500";
}

// Progress Bar Component
function DepartmentProgressBar({ department }: { department: DepartmentLoad }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-[#121417] dark:text-white">
                    {department.name}
                </span>
                <span className="text-[#687582] dark:text-gray-400">
                    {department.loadPercentage}% Tải
                </span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getLoadColor(department.loadPercentage)} rounded-full`}
                    style={{ width: `${department.loadPercentage}%` }}
                ></div>
            </div>
        </div>
    );
}

// Main Component
export function DepartmentStatus({ departments }: DepartmentStatusProps) {
    return (
        <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4">
                {UI_TEXT.ADMIN.DASHBOARD.DEPARTMENT_STATUS}
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {departments.map((dept) => (
                    <DepartmentProgressBar key={dept.id} department={dept} />
                ))}
            </div>

            <Link
                href={ROUTES.ADMIN.DEPARTMENTS}
                className="mt-4 w-full py-2 text-sm text-[#3C81C6] font-bold hover:bg-[#3C81C6]/5 rounded-xl transition-colors text-center block"
            >
                {UI_TEXT.COMMON.VIEW_DETAILS}
            </Link>
        </div>
    );
}

export default DepartmentStatus;
