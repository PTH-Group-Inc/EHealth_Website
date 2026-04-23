"use client";

/**
 * Lịch làm việc bác sĩ — Phase I.2 Nhóm 2 #4.
 * Spec: dòng 5245-5302 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { doctorAvailabilityService } from "@/services/appointmentService";
import { staffScheduleService } from "@/services/staffScheduleService";

const formatDate = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return v; }
};
const formatDow = (v?: string) => {
    if (!v) return "—";
    try {
        const d = new Date(v);
        const dow = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
        return dow;
    } catch { return ""; }
};

const isoOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
};

interface ScheduleRow {
    id: string;
    workDate?: string;
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    facility?: string;
    status?: string;
    note?: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Đã xếp", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    ON_DUTY: { label: "Đang trực", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    COMPLETED: { label: "Đã xong", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    SUSPENDED: { label: "Tạm ngưng", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    LEAVE: { label: "Nghỉ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

export default function DoctorSchedulePage() {
    const { user } = useAuth();
    const [from, setFrom] = useState(isoOffset(0));
    const [to, setTo] = useState(isoOffset(13));
    const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        const [s, c, f] = await Promise.allSettled([
            staffScheduleService.getByStaff(user.id, { from, to }),
            doctorAvailabilityService.getConflicts(user.id, { from, to }),
            doctorAvailabilityService.getFacilities(user.id),
        ]);
        if (s.status === "fulfilled") {
            const arr = (s.value as any)?.data ?? [];
            const rows = (arr as any[]).map((r: any) => ({
                id: r.id ?? r.staff_schedule_id,
                workDate: r.work_date ?? r.workDate ?? r.date,
                shiftName: r.shift_name ?? r.shiftName ?? r.shift?.name,
                startTime: r.start_time ?? r.startTime,
                endTime: r.end_time ?? r.endTime,
                facility: r.facility_name ?? r.facility?.name ?? r.branch_name ?? r.department_name,
                status: (r.status ?? "SCHEDULED").toString().toUpperCase(),
                note: r.note,
            } as ScheduleRow));
            setSchedules(rows);
        } else setSchedules([]);
        setConflicts(c.status === "fulfilled" ? c.value : []);
        setFacilities(f.status === "fulfilled" ? f.value : []);
        setLoading(false);
    }, [user?.id, from, to]);

    useEffect(() => { load(); }, [load]);

    const grouped = useMemo(() => {
        const m = new Map<string, ScheduleRow[]>();
        schedules.forEach(s => {
            const k = (s.workDate ?? "").slice(0, 10);
            if (!m.has(k)) m.set(k, []);
            m.get(k)!.push(s);
        });
        return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [schedules]);

    const stats = useMemo(() => ({
        days: grouped.length,
        total: schedules.length,
        conflicts: conflicts.length,
        facilities: facilities.length,
    }), [grouped, schedules, conflicts, facilities]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch làm việc bác sĩ"
                subtitle="Lịch trực, độ sẵn sàng, xung đột lịch & cơ sở đang gắn."
                icon="event_note"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Lịch làm việc" },
                ]}
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Số ngày trực" value={stats.days} icon="calendar_today" color="blue" loading={loading} />
                <StatCard label="Tổng ca" value={stats.total} icon="schedule" color="violet" loading={loading} />
                <StatCard label="Conflict" value={stats.conflicts} icon="warning" color={stats.conflicts > 0 ? "red" : "emerald"} loading={loading} />
                <StatCard label="Cơ sở làm việc" value={stats.facilities} icon="business" color="amber" loading={loading} />
            </div>

            {/* Filter range */}
            <div className="flex flex-wrap items-end gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <div>
                    <label className="block text-xs text-[#687582] mb-1">Từ ngày</label>
                    <input
                        type="date"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-[#687582] mb-1">Đến ngày</label>
                    <input
                        type="date"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { label: "Hôm nay", days: 0 },
                        { label: "Tuần này", days: 6 },
                        { label: "2 tuần", days: 13 },
                        { label: "Tháng này", days: 29 },
                    ].map(p => (
                        <button
                            key={p.label}
                            onClick={() => { setFrom(isoOffset(0)); setTo(isoOffset(p.days)); }}
                            className="px-3 py-2 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Schedule list */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">event_available</span>
                            <h3 className="text-sm font-bold">Lịch làm việc cá nhân</h3>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-[#687582]">Đang tải…</div>
                        ) : grouped.length === 0 ? (
                            <EmptyState icon="event_busy" title="Không có lịch làm việc" description="Chưa có ca trực nào trong khoảng thời gian đã chọn." />
                        ) : (
                            <div className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {grouped.map(([day, rows]) => (
                                    <div key={day} className="px-4 py-3">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <p className="text-sm font-bold text-[#121417] dark:text-white">{formatDate(day)}</p>
                                            <span className="text-xs text-[#687582]">({formatDow(day)})</span>
                                        </div>
                                        <div className="space-y-2">
                                            {rows.map(r => {
                                                const meta = STATUS_META[r.status ?? "SCHEDULED"] ?? { label: r.status, cls: "bg-gray-100 text-gray-700" };
                                                return (
                                                    <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">
                                                                {r.shiftName ?? "Ca làm việc"}
                                                                {r.startTime && (
                                                                    <span className="ml-2 text-xs text-[#687582]">
                                                                        {r.startTime?.slice(0, 5)}{r.endTime ? ` – ${r.endTime.slice(0, 5)}` : ""}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {r.facility && (
                                                                <p className="text-xs text-[#687582] mt-0.5 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">place</span>
                                                                    {r.facility}
                                                                </p>
                                                            )}
                                                            {r.note && <p className="text-xs italic text-[#687582] mt-1">&quot;{r.note}&quot;</p>}
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${meta.cls}`}>{meta.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side panels */}
                <div className="space-y-4">
                    {/* Conflicts */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
                            <h3 className="text-sm font-bold">Xung đột lịch</h3>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{conflicts.length}</span>
                        </div>
                        {conflicts.length === 0 ? (
                            <EmptyState icon="check_circle" title="Không có xung đột" description="Lịch của bạn không trùng lặp." variant="success" compact />
                        ) : (
                            <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {conflicts.map((c: any, i: number) => (
                                    <li key={c.id ?? i} className="px-4 py-3 text-sm">
                                        <p className="font-medium text-[#121417] dark:text-white">
                                            {c.title ?? c.description ?? c.reason ?? "Xung đột"}
                                        </p>
                                        <p className="text-xs text-[#687582] mt-0.5">
                                            {formatDate(c.date ?? c.work_date)} {c.start_time ? `• ${c.start_time}` : ""}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Facilities */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">business</span>
                            <h3 className="text-sm font-bold">Cơ sở làm việc</h3>
                        </div>
                        {facilities.length === 0 ? (
                            <EmptyState icon="domain_disabled" title="Chưa có cơ sở" description="Bạn chưa được gán vào cơ sở nào." compact />
                        ) : (
                            <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {facilities.map((f: any, i: number) => (
                                    <li key={f.id ?? i} className="px-4 py-3 text-sm">
                                        <p className="font-medium text-[#121417] dark:text-white">
                                            {f.name ?? f.facility_name ?? f.branch_name ?? "Cơ sở"}
                                        </p>
                                        {(f.address ?? f.location) && (
                                            <p className="text-xs text-[#687582] mt-0.5">{f.address ?? f.location}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
