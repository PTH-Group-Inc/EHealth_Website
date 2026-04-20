"use client";

import { useMemo } from "react";

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
    blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    violet: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

function shiftToColor(shift?: ShiftCode): NonNullable<ScheduleEvent["color"]> {
    switch (shift) {
        case "MORNING": return "amber";
        case "AFTERNOON": return "blue";
        case "NIGHT": return "violet";
        default: return "gray";
    }
}

function statusToColor(status?: string): NonNullable<ScheduleEvent["color"]> | undefined {
    switch (status) {
        case "ABSENT": return "red";
        case "LEAVE": return "gray";
        case "COMPLETED": return "emerald";
        case "ON_DUTY": return "blue";
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
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dde0e4] dark:border-[#2d353e] bg-gradient-to-r from-[#3C81C6]/5 to-[#1d4ed8]/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">calendar_month</span>
                    <h3 className="text-base font-semibold text-[#121417] dark:text-white">
                        {VN_MONTHS[month.getMonth()]} {month.getFullYear()}
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={onPrevMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-[#13191f] flex items-center justify-center text-[#687582] dark:text-gray-400 transition-colors"
                        aria-label="Tháng trước">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_left</span>
                    </button>
                    <button type="button" onClick={onToday}
                        className="px-3 h-8 rounded-lg text-xs font-medium text-[#3C81C6] hover:bg-white dark:hover:bg-[#13191f] transition-colors">
                        Hôm nay
                    </button>
                    <button type="button" onClick={onNextMonth}
                        className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-[#13191f] flex items-center justify-center text-[#687582] dark:text-gray-400 transition-colors"
                        aria-label="Tháng sau">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                {headerDow.map((dow) => (
                    <div key={dow} className="px-2 py-2 text-center text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider">
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
                    const visible = dayEvents.slice(0, maxEventsPerDay);
                    const overflow = dayEvents.length - visible.length;

                    return (
                        <button
                            key={`${iso}-${idx}`}
                            type="button"
                            onClick={() => onDayClick?.(iso)}
                            className={`min-h-[96px] text-left px-1.5 py-1.5 border-b border-r border-[#dde0e4] dark:border-[#2d353e] transition-colors relative ${
                                inMonth ? "bg-white dark:bg-[#1e242b]" : "bg-[#f8f9fa] dark:bg-[#161c22]"
                            } ${onDayClick ? "hover:bg-[#3C81C6]/5 dark:hover:bg-[#3C81C6]/10 cursor-pointer" : "cursor-default"}`}
                        >
                            <div className={`text-[11px] font-semibold mb-1 inline-flex items-center justify-center ${
                                isToday
                                    ? "w-6 h-6 rounded-full bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm"
                                    : inMonth ? "text-[#121417] dark:text-white" : "text-gray-400 dark:text-gray-600"
                            }`}>
                                {d.getDate()}
                            </div>

                            {loading && inMonth && (
                                <div className="space-y-1">
                                    <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse w-2/3" />
                                </div>
                            )}

                            {!loading && (
                                <div className="space-y-1">
                                    {visible.map((ev) => {
                                        const colorKey = ev.color ?? statusToColor(ev.status) ?? shiftToColor(ev.shift);
                                        const cls = COLOR_MAP[colorKey];
                                        const shiftLabel = ev.shift ? SHIFT_LABEL[ev.shift] ?? ev.shift : null;
                                        return (
                                            <span
                                                key={ev.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEventClick?.(ev); } }}
                                                className={`block w-full text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${cls} ${onEventClick ? "cursor-pointer hover:opacity-80" : ""}`}
                                                title={`${shiftLabel ? shiftLabel + " — " : ""}${ev.title}${ev.subtitle ? " · " + ev.subtitle : ""}`}
                                            >
                                                {shiftLabel && <span className="font-bold mr-1">{shiftLabel}</span>}
                                                {ev.title}
                                            </span>
                                        );
                                    })}
                                    {overflow > 0 && (
                                        <span className="block text-[10px] text-[#687582] dark:text-gray-500 px-1">
                                            +{overflow} khác
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ScheduleCalendar;
