"use client";

/**
 * Vận hành nhân sự — Phase J.6 #4 + #5.
 * Spec: dòng 12366-12459 (read-only: lịch nhân sự + nghỉ phép + đổi ca).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { ScheduleCalendar, ScheduleEvent } from "@/components/shared/calendar/ScheduleCalendar";
import { staffScheduleService } from "@/services/staffScheduleService";
import { leaveService } from "@/services/leaveService";
import { shiftSwapService } from "@/services/shiftSwapService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

const TABS = [
    { key: "schedules", label: "Lịch làm việc nhân sự", icon: "event_note" },
    { key: "leaves", label: "Nghỉ phép", icon: "event_busy" },
    { key: "swaps", label: "Đổi ca", icon: "swap_horiz" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ReceptionistStaffInfoPage() {
    const [tab, setTab] = useState<TabKey>("schedules");
    const [calMonth, setCalMonth] = useState(new Date());
    const [schedules, setSchedules] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [swaps, setSwaps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const y = calMonth.getFullYear();
        const m = String(calMonth.getMonth() + 1).padStart(2, "0");
        const fromDate = `${y}-${m}-01`;
        const toDate = new Date(y, calMonth.getMonth() + 1, 0).toISOString().slice(0, 10);

        const [s, l, sw] = await Promise.allSettled([
            staffScheduleService.getList({ from: fromDate, to: toDate }),
            leaveService.getList(),
            shiftSwapService.getList(),
        ]);
        
        if (s.status === "fulfilled") setSchedules(((s.value as any)?.data ?? s.value ?? []));
        if (l.status === "fulfilled") setLeaves(((l.value as any)?.data ?? l.value ?? []));
        if (sw.status === "fulfilled") setSwaps(((sw.value as any)?.data ?? sw.value ?? []));
        setLoading(false);
    }, [calMonth]);

    useEffect(() => { load(); }, [load]);

    const scheduleEvents = useMemo<ScheduleEvent[]>(() => {
        return (Array.isArray(schedules) ? schedules : []).map((s: any) => ({
            id: s.id ?? s.staff_schedules_id,
            date: s.workDate ?? s.work_date ?? s.working_date ?? s.schedule_date ?? "",
            title: s.staffName ?? s.staff_name ?? s.full_name ?? "—",
            subtitle: s.shiftName ?? s.shift_name ?? "",
            shift: s.shiftCode ?? s.shift_code ?? s.shiftName ?? s.shift_name,
            status: s.status,
        }));
    }, [schedules]);

    // Lọc lịch trực của hôm nay để đếm (chỉ cho StatCard)
    const todaySchedulesCount = useMemo(() => {
        const todayIso = new Date().toISOString().slice(0, 10);
        return (Array.isArray(schedules) ? schedules : []).filter((s: any) => {
            const dateStr = s.workDate ?? s.work_date ?? s.working_date ?? s.schedule_date ?? "";
            return dateStr.slice(0, 10) === todayIso;
        }).length;
    }, [schedules]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Vận hành nhân sự"
                subtitle="Tra cứu nhanh: ai trực hôm nay, ai nghỉ, ai đổi ca."
                icon="badge"
                breadcrumbs={[
                    { label: "Trang chủ", href: "/portal/receptionist" },
                    { label: "Vận hành nhân sự" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Lịch trực hôm nay" value={todaySchedulesCount} icon="event_note" color="blue" loading={loading} />
                <StatCard label="Đang nghỉ phép" value={leaves.filter((l: any) => (l.status ?? "").toUpperCase() === "APPROVED").length} icon="event_busy" color="amber" loading={loading} />
                <StatCard label="Yêu cầu đổi ca" value={swaps.filter((s: any) => (s.status ?? "").toUpperCase() === "PENDING").length} icon="swap_horiz" color="violet" loading={loading} />
            </div>

            <div className="flex gap-2 mb-4">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === t.key ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                        <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "schedules" && (
                <div className="mb-4">
                    <ScheduleCalendar
                        month={calMonth}
                        events={scheduleEvents}
                        onPrevMonth={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                        onNextMonth={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                        onToday={() => setCalMonth(new Date())}
                        loading={loading}
                    />
                </div>
            )}

            {tab === "leaves" && (
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                    : leaves.length === 0 ? <EmptyState icon="event_busy" title="Không có nghỉ phép" />
                    : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr><th className="text-left px-4 py-3">Nhân viên</th><th className="text-left px-4 py-3">Loại</th><th className="text-left px-4 py-3">Từ</th><th className="text-left px-4 py-3">Đến</th><th className="text-left px-4 py-3">Trạng thái</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {leaves.map((l: any) => (
                                    <tr key={l.id}>
                                        <td className="px-4 py-3 font-medium">{l.staffName ?? "—"}</td>
                                        <td className="px-4 py-3">{l.type ?? l.leaveType ?? "—"}</td>
                                        <td className="px-4 py-3">{fmt(l.startDate ?? l.fromDate)}</td>
                                        <td className="px-4 py-3">{fmt(l.endDate ?? l.toDate)}</td>
                                        <td className="px-4 py-3 text-[#687582]">{l.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === "swaps" && (
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                    : swaps.length === 0 ? <EmptyState icon="swap_horiz" title="Không có yêu cầu đổi ca" />
                    : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr><th className="text-left px-4 py-3">Người yêu cầu</th><th className="text-left px-4 py-3">Người nhận</th><th className="text-left px-4 py-3">Từ</th><th className="text-left px-4 py-3">Đến</th><th className="text-left px-4 py-3">Trạng thái</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {swaps.map((s: any) => (
                                    <tr key={s.id}>
                                        <td className="px-4 py-3 font-medium">{s.requesterName ?? "—"}</td>
                                        <td className="px-4 py-3">{s.targetStaffName ?? "—"}</td>
                                        <td className="px-4 py-3">{fmt(s.fromDate)}</td>
                                        <td className="px-4 py-3">{fmt(s.toDate)}</td>
                                        <td className="px-4 py-3 text-[#687582]">{s.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
