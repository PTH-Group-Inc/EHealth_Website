"use client";

import { ReactNode, useMemo } from "react";
import { formatDate, formatTime } from "@/utils/formatters";
import { EmptyState } from "@/components/shared/layout/EmptyState";

export type HealthEventType =
    | "encounter"
    | "diagnosis"
    | "prescription"
    | "lab"
    | "imaging"
    | "vital"
    | "vaccination"
    | "appointment"
    | "admission"
    | "discharge"
    | "note";

export interface HealthEvent {
    id: string | number;
    type: HealthEventType;
    title: string;
    description?: string;
    timestamp: string;
    doctor?: string;
    facility?: string;
    severity?: "info" | "success" | "warning" | "critical";
    badges?: { label: string; color?: "blue" | "emerald" | "amber" | "red" | "violet" | "gray" }[];
    children?: ReactNode;
    onClick?: () => void;
}

export interface HealthTimelineProps {
    events: HealthEvent[];
    loading?: boolean;
    groupByDate?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
}

const TYPE_META: Record<HealthEventType, { icon: string; label: string; bg: string; ring: string }> = {
    encounter: { icon: "stethoscope", label: "Phiên khám", bg: "bg-blue-500", ring: "ring-blue-100 dark:ring-blue-900/40" },
    diagnosis: { icon: "diagnosis", label: "Chẩn đoán", bg: "bg-violet-500", ring: "ring-violet-100 dark:ring-violet-900/40" },
    prescription: { icon: "pill", label: "Đơn thuốc", bg: "bg-emerald-500", ring: "ring-emerald-100 dark:ring-emerald-900/40" },
    lab: { icon: "biotech", label: "Xét nghiệm", bg: "bg-cyan-500", ring: "ring-cyan-100 dark:ring-cyan-900/40" },
    imaging: { icon: "radiology", label: "Chẩn đoán hình ảnh", bg: "bg-indigo-500", ring: "ring-indigo-100 dark:ring-indigo-900/40" },
    vital: { icon: "monitor_heart", label: "Sinh hiệu", bg: "bg-pink-500", ring: "ring-pink-100 dark:ring-pink-900/40" },
    vaccination: { icon: "vaccines", label: "Tiêm chủng", bg: "bg-teal-500", ring: "ring-teal-100 dark:ring-teal-900/40" },
    appointment: { icon: "event", label: "Lịch hẹn", bg: "bg-amber-500", ring: "ring-amber-100 dark:ring-amber-900/40" },
    admission: { icon: "bed", label: "Nhập viện", bg: "bg-orange-500", ring: "ring-orange-100 dark:ring-orange-900/40" },
    discharge: { icon: "logout", label: "Xuất viện", bg: "bg-emerald-600", ring: "ring-emerald-100 dark:ring-emerald-900/40" },
    note: { icon: "sticky_note_2", label: "Ghi chú", bg: "bg-gray-500", ring: "ring-gray-100 dark:ring-gray-800" },
};

const BADGE_COLOR: Record<NonNullable<NonNullable<HealthEvent["badges"]>[number]["color"]>, string> = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const SEVERITY_BORDER: Record<NonNullable<HealthEvent["severity"]>, string> = {
    info: "border-l-blue-500",
    success: "border-l-emerald-500",
    warning: "border-l-amber-500",
    critical: "border-l-red-500",
};

export function HealthTimeline({
    events,
    loading = false,
    groupByDate = true,
    emptyTitle = "Chưa có sự kiện y tế",
    emptyDescription = "Khi bệnh nhân có hoạt động khám/chữa bệnh, lịch sử sẽ hiển thị ở đây.",
}: HealthTimelineProps) {
    const groups = useMemo(() => {
        if (!groupByDate) return [{ date: "", items: events }];
        const map = new Map<string, HealthEvent[]>();
        for (const ev of events) {
            const dateKey = (ev.timestamp ?? "").slice(0, 10);
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(ev);
        }
        return Array.from(map.entries())
            .sort((a, b) => (a[0] < b[0] ? 1 : -1))
            .map(([date, items]) => ({
                date,
                items: items.slice().sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
            }));
    }, [events, groupByDate]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return <EmptyState icon="timeline" title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <div className="space-y-6">
            {groups.map((g) => (
                <div key={g.date || "all"}>
                    {groupByDate && g.date && (
                        <div className="sticky top-0 z-10 -mx-1 px-1 py-1 mb-3 bg-white/95 dark:bg-[#1e242b]/95 backdrop-blur-sm">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#3C81C6]/10 to-[#1d4ed8]/10 border border-[#3C81C6]/20">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "14px" }}>event</span>
                                <span className="text-xs font-semibold text-[#3C81C6]">{formatDate(g.date)}</span>
                            </div>
                        </div>
                    )}
                    <ol className="relative space-y-4">
                        <span className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-[#3C81C6]/30 via-gray-200 to-transparent dark:via-gray-700" aria-hidden />
                        {g.items.map((ev) => {
                            const meta = TYPE_META[ev.type] ?? TYPE_META.note;
                            const sevBorder = ev.severity ? SEVERITY_BORDER[ev.severity] : "border-l-transparent";
                            return (
                                <li key={ev.id} className="relative pl-14">
                                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-full ${meta.bg} ring-4 ${meta.ring} flex items-center justify-center shadow-sm`}>
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{meta.icon}</span>
                                    </div>
                                    <div
                                        role={ev.onClick ? "button" : undefined}
                                        tabIndex={ev.onClick ? 0 : undefined}
                                        onClick={ev.onClick}
                                        onKeyDown={(e) => { if (ev.onClick && e.key === "Enter") ev.onClick(); }}
                                        className={`bg-white dark:bg-[#13191f] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] border-l-4 ${sevBorder} p-3 ${ev.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#687582] dark:text-gray-500">
                                                        {meta.label}
                                                    </span>
                                                    {ev.badges?.map((b, i) => (
                                                        <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BADGE_COLOR[b.color ?? "gray"]}`}>
                                                            {b.label}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h4 className="text-sm font-semibold text-[#121417] dark:text-white mt-1">{ev.title}</h4>
                                                {ev.description && (
                                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-1 leading-relaxed">{ev.description}</p>
                                                )}
                                                {(ev.doctor || ev.facility) && (
                                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#687582] dark:text-gray-500">
                                                        {ev.doctor && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>person</span>
                                                                {ev.doctor}
                                                            </span>
                                                        )}
                                                        {ev.facility && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>local_hospital</span>
                                                                {ev.facility}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <time className="text-[11px] text-[#687582] dark:text-gray-500 font-mono whitespace-nowrap">
                                                {formatTime(ev.timestamp)}
                                            </time>
                                        </div>
                                        {ev.children && <div className="mt-2 pt-2 border-t border-[#f0f0f0] dark:border-[#2d353e]">{ev.children}</div>}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            ))}
        </div>
    );
}

export default HealthTimeline;
