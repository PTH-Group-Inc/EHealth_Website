"use client";

/**
 * VerticalTimeline — timeline dọc dùng chung cho audit log, EHR history, maintenance log, ...
 */

import { ReactNode } from "react";
import { formatDate, formatTime } from "@/utils/formatters";

export type TimelineVariant = "default" | "success" | "warning" | "error" | "info";

const VARIANT_STYLE: Record<TimelineVariant, { dot: string; line: string; icon: string }> = {
    default: { dot: "bg-gray-300 dark:bg-gray-600", line: "bg-gray-200 dark:bg-gray-700", icon: "text-gray-600" },
    success: { dot: "bg-emerald-500", line: "bg-emerald-200 dark:bg-emerald-900/50", icon: "text-emerald-600" },
    warning: { dot: "bg-amber-500", line: "bg-amber-200 dark:bg-amber-900/50", icon: "text-amber-600" },
    error: { dot: "bg-red-500", line: "bg-red-200 dark:bg-red-900/50", icon: "text-red-600" },
    info: { dot: "bg-blue-500", line: "bg-blue-200 dark:bg-blue-900/50", icon: "text-blue-600" },
};

export interface TimelineItemData {
    id: string | number;
    title: string;
    description?: string;
    timestamp?: string;
    variant?: TimelineVariant;
    icon?: string;
    meta?: string;            // VD: user, department
    children?: ReactNode;      // custom content (card, badge, ...)
}

export interface VerticalTimelineProps {
    items: TimelineItemData[];
    compact?: boolean;
    emptyText?: string;
}

export function VerticalTimeline({ items, compact = false, emptyText = "Chưa có dữ liệu" }: VerticalTimelineProps) {
    if (items.length === 0) {
        return (
            <div className="py-8 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">history</span>
                <p className="text-xs text-[#687582] dark:text-gray-500">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3C81C6]/30 via-gray-200 to-transparent dark:from-[#3C81C6]/40 dark:via-gray-700" />
            <ul className={`space-y-${compact ? 3 : 4}`}>
                {items.map((item) => {
                    const v = VARIANT_STYLE[item.variant ?? "default"];
                    return (
                        <li key={item.id} className="relative">
                            <div className={`absolute -left-[26px] top-0.5 w-[22px] h-[22px] rounded-full ${v.dot} border-[3px] border-white dark:border-[#1e242b] flex items-center justify-center shadow-sm`}>
                                {item.icon && (
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: "12px" }}>
                                        {item.icon}
                                    </span>
                                )}
                            </div>
                            <div className={compact ? "pb-2" : "pb-1"}>
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-[#121417] dark:text-white">{item.title}</h4>
                                    {item.timestamp && (
                                        <time className="text-[11px] text-[#687582] dark:text-gray-500 font-mono">
                                            {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                                        </time>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">{item.description}</p>
                                )}
                                {item.meta && (
                                    <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-0.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>person</span>
                                        {item.meta}
                                    </p>
                                )}
                                {item.children && <div className="mt-2">{item.children}</div>}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default VerticalTimeline;
