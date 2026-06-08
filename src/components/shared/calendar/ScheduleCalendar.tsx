"use client";

import { useMemo, useState } from "react";

export type ShiftCode = "MORNING" | "AFTERNOON" | "NIGHT" | string;

export interface ScheduleEvent {
    id: string | number;
    date: string;
    title: string;
    shift?: ShiftCode;
    subtitle?: string;
    status?: "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "ABSENT" | "LEAVE" | string;
    color?: "blue" | "emerald" | "amber" | "red" | "violet" | "gray";
}

export interface ScheduleCalendarProps {
    month: Date;
    events: ScheduleEvent[];
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
    onToday?: () => void;
    onDayClick?: (dateIso: string) => void;
    onEventClick?: (event: ScheduleEvent) => void;
    loading?: boolean;
    maxEventsPerDay?: number;
    weekStartsOn?: 0 | 1;
}

const SHIFT_LABEL: Record<string, string> = {
    MORNING: "Sáng",
    AFTERNOON: "Chiều",
    NIGHT: "Tối",
};

const COLOR_MAP: Record<NonNullable<ScheduleEvent["color"]>, string> = {
    blue: "bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc] dark:bg-[#1967d2]/20 dark:text-[#8ab4f8] dark:border-[#1967d2]/30",
    violet: "bg-[#f3e8fd] text-[#681da8] border-[#e8d2fa] dark:bg-[#681da8]/20 dark:text-[#c58af9] dark:border-[#681da8]/30",
    amber: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2] dark:bg-[#b06000]/20 dark:text-[#fcd284] dark:border-[#b06000]/30",
    emerald: "bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#137333]/20 dark:text-[#81c995] dark:border-[#137333]/30",
    red: "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf] dark:bg-[#c5221f]/20 dark:text-[#f28b82] dark:border-[#c5221f]/30",
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700",
};

function shiftToColor(shift?: ShiftCode): NonNullable<ScheduleEvent["color"]> {
    if (!shift) return "gray";
    const s = shift.toUpperCase();
    if (s.includes("SÁNG") || s.includes("MORNING") || s.includes("SHIFT_1") || s.includes("CA_1") || s.includes("CA1") || s.includes("CA 1") || s === "M" || s === "S") return "blue";
    if (s.includes("CHIỀU") || s.includes("AFTERNOON") || s.includes("SHIFT_2") || s.includes("CA_2") || s.includes("CA2") || s.includes("CA 2") || s === "A" || s === "C") return "violet";
    if (s.includes("TỐI") || s.includes("NIGHT") || s.includes("SHIFT_3") || s.includes("CA_3") || s.includes("CA3") || s.includes("CA 3") || s === "E" || s === "T") return "amber";
    return "gray";
}

function statusToColor(status?: string): NonNullable<ScheduleEvent["color"]> | undefined {
    // Only apply status colors for exceptions. For normal schedules, we want to see the shift color.
    switch (status?.toUpperCase()) {
        case "ABSENT": return "red";
        case "LEAVE": return "gray";
        // case "COMPLETED": return "emerald"; // We still want to see the shift color even if completed
        // case "ON_DUTY": return "blue";
        default: return undefined;
    }
}

function toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(month: Date, weekStartsOn: 0 | 1 = 1): Date[] {
    const first = startOfMonth(month);
    const firstDayIdx = (first.getDay() - weekStartsOn + 7) % 7;
    const start = new Date(first);
    start.setDate(start.getDate() - firstDayIdx);
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
    });
}

const VN_MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const VN_DOW_MON_FIRST = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const VN_DOW_SUN_FIRST = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function ScheduleCalendar({
    month,
    events,
    onPrevMonth,
    onNextMonth,
    onToday,
    onDayClick,
    onEventClick,
    loading = false,
    maxEventsPerDay = 3,
    weekStartsOn = 1,
}: ScheduleCalendarProps) {
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    const grid = useMemo(() => buildGrid(month, weekStartsOn), [month, weekStartsOn]);
    const eventsByDate = useMemo(() => {
        const map = new Map<string, ScheduleEvent[]>();
        for (const ev of events) {
            const key = (ev.date ?? "").slice(0, 10);
            if (!key) continue;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return map;
    }, [events]);

    const todayIso = toIso(new Date());
    const headerDow = weekStartsOn === 1 ? VN_DOW_MON_FIRST : VN_DOW_SUN_FIRST;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e242b] gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                            {VN_MONTHS[month.getMonth()]} {month.getFullYear()}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>Sáng</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 shadow-sm"></span>Chiều</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></span>Tối</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#13191f] p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={onPrevMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all shadow-sm hover:shadow"
                        aria-label="Tháng trước">
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <button type="button" onClick={onToday}
                        className="px-4 h-8 rounded-lg text-sm font-semibold text-blue-600 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow">
                        Hôm nay
                    </button>
                    <button type="button" onClick={onNextMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all shadow-sm hover:shadow"
                        aria-label="Tháng sau">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-[#161c22]/50 border-b border-gray-100 dark:border-gray-800">
                {headerDow.map((dow) => (
                    <div key={dow} className="px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {dow}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {grid.map((d, idx) => {
                    const iso = toIso(d);
                    const inMonth = d.getMonth() === month.getMonth();
                    const isToday = iso === todayIso;
                    const dayEvents = eventsByDate.get(iso) ?? [];
                    const isExpanded = expandedDates[iso];
                    const visible = isExpanded ? dayEvents : dayEvents.slice(0, maxEventsPerDay);
                    const overflow = dayEvents.length - maxEventsPerDay;

                    return (
                        <div
                            key={`${iso}-${idx}`}
                            onClick={() => onDayClick?.(iso)}
                            role={onDayClick ? "button" : undefined}
                            tabIndex={onDayClick ? 0 : undefined}
                            onKeyDown={(e) => { if (e.key === "Enter" && onDayClick) onDayClick(iso); }}
                            className={`min-h-[120px] text-left p-2 border-b border-r border-gray-100 dark:border-gray-800/60 transition-all relative flex flex-col gap-1 ${
                                inMonth ? "bg-white dark:bg-[#1e242b]" : "bg-gray-50/50 dark:bg-[#161c22]"
                            } ${onDayClick ? "hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer" : "cursor-default"}
                            ${idx % 7 === 6 ? "border-r-0" : ""}
                            `}
                        >
                            <div className={`text-xs font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                                isToday
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                    : inMonth ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" : "text-gray-400 dark:text-gray-600"
                            }`}>
                                {d.getDate()}
                            </div>

                            {loading && inMonth && (
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    <div className="h-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse w-2/3" />
                                </div>
                            )}

                            {!loading && (
                                <div className="space-y-2 flex-1 pt-1">
                                    {["Sáng", "Chiều", "Tối", "Khác"].map((groupName) => {
                                        const groupEvs = visible.filter((ev) => {
                                            const color = shiftToColor(ev.shift);
                                            if (color === "blue") return groupName === "Sáng";
                                            if (color === "violet") return groupName === "Chiều";
                                            if (color === "amber") return groupName === "Tối";
                                            return groupName === "Khác";
                                        });

                                        if (groupEvs.length === 0) return null;

                                        return (
                                            <div key={groupName} className="space-y-1">
                                                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">
                                                    {groupName}
                                                </div>
                                                {groupEvs.map((ev) => {
                                                    const colorKey = ev.color ?? statusToColor(ev.status) ?? shiftToColor(ev.shift);
                                                    const cls = COLOR_MAP[colorKey];
                                                    return (
                                                        <div
                                                            key={ev.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                                                            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEventClick?.(ev); } }}
                                                            className={`group flex flex-col w-full px-2 py-1.5 rounded-lg border transition-all ${cls} ${onEventClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-sm" : ""}`}
                                                            title={`${ev.title}${ev.subtitle ? " · " + ev.subtitle : ""}`}
                                                        >
                                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                                <span className="text-[11px] font-medium leading-tight truncate">
                                                                    {ev.title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {!isExpanded && overflow > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setExpandedDates(prev => ({ ...prev, [iso]: true })); }}
                                            className="w-full mt-2 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                        >
                                            + {overflow} lịch khác
                                        </button>
                                    )}
                                    {isExpanded && overflow > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setExpandedDates(prev => ({ ...prev, [iso]: false })); }}
                                            className="w-full mt-2 text-center text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>expand_less</span>
                                            Thu gọn
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ScheduleCalendar;
