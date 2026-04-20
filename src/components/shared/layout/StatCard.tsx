"use client";

/**
 * StatCard — widget thống kê chuẩn cho dashboard.
 */

import Link from "next/link";
import { ReactNode } from "react";

export type StatColor = "blue" | "emerald" | "amber" | "red" | "violet" | "pink";

const COLOR_STYLE: Record<StatColor, { bg: string; text: string; gradient: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600", gradient: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10" },
    red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-500", gradient: "from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/10" },
    violet: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600", gradient: "from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-900/10" },
    pink: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600", gradient: "from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-900/10" },
};

export interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: StatColor;
    trend?: { value: number | string; direction?: "up" | "down" | "flat"; label?: string };
    footer?: ReactNode;
    href?: string;
    loading?: boolean;
}

export function StatCard({ label, value, icon, color = "blue", trend, footer, href, loading }: StatCardProps) {
    const c = COLOR_STYLE[color];

    const inner = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[#687582] dark:text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider truncate">{label}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    ) : (
                        <h3 className="text-[28px] font-extrabold text-[#121417] dark:text-white leading-none">{value}</h3>
                    )}
                </div>
                <div className={`p-2.5 bg-gradient-to-br ${c.gradient} rounded-xl ${c.text} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </div>
            </div>
            {(trend || footer) && (
                <div className="mt-3 pt-3 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                    {trend ? (
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${trend.direction === "down"
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                }`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                                    {trend.direction === "down" ? "trending_down" : trend.direction === "flat" ? "trending_flat" : "trending_up"}
                                </span>
                                {trend.value}
                            </span>
                            {trend.label && <span className="text-[10px] text-[#687582] dark:text-gray-500">{trend.label}</span>}
                        </div>
                    ) : footer}
                </div>
            )}
        </>
    );

    const cls = "bg-white dark:bg-[#1e242b] p-5 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6]/40 dark:hover:border-[#3C81C6]/30 transition-all";

    if (href) return <Link href={href} className={`${cls} cursor-pointer`}>{inner}</Link>;
    return <div className={cls}>{inner}</div>;
}

export default StatCard;
