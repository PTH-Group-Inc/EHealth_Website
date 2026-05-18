"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

interface PatientGrowthData {
    month: string;
    value: number;
}

export function PatientGrowthChart({ data, highlightIndex = 7 }: { data: PatientGrowthData[]; highlightIndex?: number }) {
    const maxVal = data.length > 0 ? Math.max(...data.map((item) => item.value), 1) : 1;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const safeHighlightIndex = data.length > 0 ? Math.min(highlightIndex, data.length - 1) : -1;

    return (
        <div className="flex flex-col rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-2.5 dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-900/20">
                        <span className="material-symbols-outlined text-[20px] text-blue-600">monitoring</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.ADMIN.DASHBOARD.PATIENT_GROWTH}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            Lượng bệnh nhân mới theo tháng - Tổng: <b className="text-[#121417] dark:text-white">{total.toLocaleString("vi-VN")}</b>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-[#687582] focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-700 dark:bg-[#13191f] dark:text-gray-300">
                        <option>2024</option>
                        <option>2023</option>
                    </select>
                    <Link href={ROUTES.ADMIN.STATISTICS} className="text-xs font-medium text-[#3C81C6] hover:underline">
                        {UI_TEXT.COMMON.VIEW_DETAILS}
                    </Link>
                </div>
            </div>

            <div className="flex-1 px-4 pb-3 pt-3">
                {data.length === 0 ? (
                    <div className="flex h-36 flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                    </div>
                ) : (
                    <div className="relative h-36">
                        {[0, 25, 50, 75, 100].map((pct) => (
                            <div
                                key={pct}
                                className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800"
                                style={{ bottom: `${pct}%` }}
                            >
                                {pct > 0 && (
                                    <span className="absolute -top-2.5 left-0 text-[9px] text-[#687582] dark:text-gray-600">
                                        {Math.round((pct / 100) * maxVal)}
                                    </span>
                                )}
                            </div>
                        ))}

                        <div className="absolute inset-0 flex items-end gap-2 pl-6">
                            {data.map((item, index) => {
                                const pct = (item.value / maxVal) * 100;
                                const isHighlighted = index === safeHighlightIndex;

                                return (
                                    <div key={item.month} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                                        <div className="absolute left-1/2 top-[-1.75rem] z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e242b] px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-[#1e242b]">
                                            {item.value.toLocaleString("vi-VN")} BN
                                        </div>
                                        <div
                                            className={`relative w-full rounded-t-[3px] transition-all duration-300 ${isHighlighted ? "bg-gradient-to-t from-[#3C81C6] to-[#60a5fa] shadow-sm shadow-blue-200 dark:shadow-none" : "bg-[#3C81C6]/12 group-hover:bg-[#3C81C6]/25"}`}
                                            style={{ height: `${Math.max(pct, 4)}%` }}
                                        />
                                        <span className={`text-[10px] ${isHighlighted ? "font-bold text-[#3C81C6]" : "text-[#687582] dark:text-gray-500"}`}>
                                            {item.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-2 flex items-center gap-4 border-t border-[#f0f1f3] pt-2 dark:border-[#2d353e]">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-[#3C81C6] to-[#60a5fa]" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Cao nhất</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-sm bg-[#3C81C6]/15" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Bệnh nhân mới</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientGrowthChart;
