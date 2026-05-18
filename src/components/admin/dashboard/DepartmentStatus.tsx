"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface DeptDistribution {
    department: string;
    icon: string;
    color: string;
    totalDoctors: number;
    onDuty: number;
    patientsWaiting: number;
}

export function DepartmentStatus({ departments }: { departments: DeptDistribution[] }) {
    return (
        <div className="flex flex-col rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-2.5 dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-indigo-50 p-1.5 dark:bg-indigo-900/20">
                        <span className="material-symbols-outlined text-[20px] text-indigo-600">local_hospital</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Phan bo bac si theo khoa</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{departments.length} chuyen khoa</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.DEPARTMENTS} className="text-xs font-medium text-[#3C81C6] hover:underline">
                    Chi tiet
                </Link>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                    </div>
                ) : departments.map((department) => {
                    const dutyPct = department.totalDoctors > 0 ? Math.round((department.onDuty / department.totalDoctors) * 100) : 0;

                    return (
                        <div
                            key={department.department}
                            className="group flex items-center gap-3 rounded-xl bg-[#f9fafb] p-3 transition-colors hover:bg-gray-100 dark:bg-[#13191f] dark:hover:bg-gray-800/50"
                        >
                            <div
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${department.color}15` }}
                            >
                                <span className="material-symbols-outlined text-[18px]" style={{ color: department.color }}>
                                    {department.icon}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                    <p className="truncate text-xs font-semibold text-[#121417] dark:text-white">{department.department}</p>
                                    <span className="flex-shrink-0 text-[11px] text-[#687582] dark:text-gray-500">
                                        {department.onDuty}/{department.totalDoctors} BS
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${dutyPct}%`, backgroundColor: department.color }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="text-[10px] text-[#687582] dark:text-gray-500">{dutyPct}% dang truc</span>
                                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                        {department.patientsWaiting} BN cho
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DepartmentStatus;
