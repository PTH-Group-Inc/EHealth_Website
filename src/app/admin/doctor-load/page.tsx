"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_COORDINATION_ENDPOINTS } from "@/api/endpoints";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/layout";

interface DoctorLoadRow {
    doctorId: string;
    doctorName: string;
    department: string;
    capacity: number;
    booked: number;
    completed: number;
    pending: number;
    loadPercent: number;
    avgPerHour: number;
}

function mapRow(r: any, i: number): DoctorLoadRow {
    const capacity = numOr(r.capacity ?? r.total_slots ?? r.totalSlots ?? r.maxAppointments ?? r.max_appointments, 0);
    const booked = numOr(r.booked ?? r.booked_count ?? r.bookedCount ?? r.totalAppointments ?? r.total_appointments, 0);
    const loadPercent = numOr(
        r.loadPercent ?? r.load_percent ?? r.load_percentage ?? r.loadPercentage,
        capacity > 0 ? Math.round((booked / capacity) * 100) : 0
    );
    return {
        doctorId: String(r.doctorId ?? r.doctor_id ?? r.id ?? `d-${i}`),
        doctorName: r.doctorName ?? r.doctor_name ?? r.fullName ?? r.full_name ?? "Bác sĩ",
        department: r.department ?? r.departmentName ?? r.department_name ?? r.specialty_name ?? r.specialty ?? "",
        capacity,
        booked,
        completed: numOr(r.completed ?? r.completed_count ?? r.completedAppointments, 0),
        pending: numOr(r.pending ?? r.pending_count ?? r.pendingAppointments, 0),
        loadPercent,
        avgPerHour: numOr(r.avgPerHour ?? r.avg_per_hour, 0),
    };
}

function numOr(v: any, d: number): number { const n = Number(v); return Number.isFinite(n) ? n : d; }

function aggregateByDoctor(rows: DoctorLoadRow[]): DoctorLoadRow[] {
    const map = new Map<string, DoctorLoadRow>();
    for (const r of rows) {
        const cur = map.get(r.doctorId);
        if (!cur) { map.set(r.doctorId, { ...r }); continue; }
        cur.capacity += r.capacity;
        cur.booked += r.booked;
        cur.completed += r.completed;
        cur.pending += r.pending;
        cur.loadPercent = cur.capacity > 0 ? Math.round((cur.booked / cur.capacity) * 100) : 0;
    }
    return Array.from(map.values());
}

const LOAD_COLOR = (pct: number) => {
    if (pct >= 90) return { bg: "from-red-500 to-rose-600", bar: "bg-red-500", label: "Quá tải" };
    if (pct >= 70) return { bg: "from-amber-500 to-orange-500", bar: "bg-amber-500", label: "Cao" };
    if (pct >= 40) return { bg: "from-blue-500 to-indigo-600", bar: "bg-blue-500", label: "Bình thường" };
    return { bg: "from-emerald-500 to-teal-600", bar: "bg-emerald-500", label: "Thấp" };
};

export default function DoctorLoadDashboardPage() {
    const today = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(today);
    const [rows, setRows] = useState<DoctorLoadRow[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"load" | "booked" | "name">("load");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [loadRes, balRes] = await Promise.allSettled([
                axiosClient.get(APPOINTMENT_COORDINATION_ENDPOINTS.DOCTOR_LOAD, { params: { date } }).then((r) => r.data?.data ?? r.data),
                axiosClient.get(APPOINTMENT_COORDINATION_ENDPOINTS.BALANCE_OVERVIEW, { params: { date } }).then((r) => r.data?.data ?? r.data),
            ]);
            if (loadRes.status === "fulfilled") {
                const v: any = loadRes.value;
                const arr: any[] = Array.isArray(v) ? v : (v?.data ?? v?.items ?? v?.doctors ?? []);
                setRows(aggregateByDoctor(arr.map(mapRow)));
            } else {
                setRows([]);
            }
            if (balRes.status === "fulfilled") setOverview(balRes.value);
        } catch {
            setError("Không tải được dữ liệu doctor load.");
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const sorted = useMemo(() => {
        const arr = [...rows];
        if (sortBy === "load") arr.sort((a, b) => b.loadPercent - a.loadPercent);
        else if (sortBy === "booked") arr.sort((a, b) => b.booked - a.booked);
        else arr.sort((a, b) => a.doctorName.localeCompare(b.doctorName, "vi"));
        return arr;
    }, [rows, sortBy]);

    const totals = useMemo(() => {
        const t = { totalDoctors: rows.length, totalBooked: 0, totalCapacity: 0, overloaded: 0 };
        for (const r of rows) {
            t.totalBooked += r.booked;
            t.totalCapacity += r.capacity;
            if (r.loadPercent >= 90) t.overloaded++;
        }
        return { ...t, avgLoad: t.totalCapacity > 0 ? Math.round((t.totalBooked / t.totalCapacity) * 100) : 0 };
    }, [rows]);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Tải bác sĩ (Doctor Load)"
                subtitle="Theo dõi cân bằng tải khám của từng bác sĩ trong ngày"
                icon="monitoring"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Tải bác sĩ" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            className="px-3 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        <button onClick={load} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
                            Tải lại
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Tổng bác sĩ" value={totals.totalDoctors} icon="stethoscope" color="blue" loading={loading} />
                <StatCard label="Lượt khám đã đặt" value={totals.totalBooked} icon="event_available" color="violet" loading={loading} />
                <StatCard label="Tải trung bình" value={`${totals.avgLoad}%`} icon="trending_up" color={totals.avgLoad >= 70 ? "amber" : "emerald"} loading={loading} />
                <StatCard label="Quá tải (>90%)" value={totals.overloaded} icon="warning" color={totals.overloaded > 0 ? "red" : "emerald"} loading={loading} />
            </div>

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {overview?.recommendation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tips_and_updates</span>
                        Gợi ý cân bằng tải
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">{overview.recommendation}</p>
                </div>
            )}

            <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>list</span>
                    Chi tiết theo bác sĩ ({sorted.length})
                </h3>
                <div className="inline-flex bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-1">
                    {([
                        { value: "load", label: "Tải", icon: "trending_up" },
                        { value: "booked", label: "Lượt khám", icon: "event" },
                        { value: "name", label: "Tên A→Z", icon: "sort_by_alpha" },
                    ] as const).map((opt) => (
                        <button key={opt.value} onClick={() => setSortBy(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${sortBy === opt.value ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] dark:text-gray-400"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : sorted.length === 0 ? (
                <EmptyState icon="monitoring" title="Không có dữ liệu tải bác sĩ" description="Có thể BE chưa có endpoint hoặc ngày này không có lịch khám." />
            ) : (
                <div className="space-y-2">
                    {sorted.map((r) => {
                        const c = LOAD_COLOR(r.loadPercent);
                        return (
                            <div key={r.doctorId} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all p-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>stethoscope</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-[#121417] dark:text-white truncate">{r.doctorName}</h4>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">{r.department || "—"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-extrabold ${r.loadPercent >= 90 ? "text-red-600" : r.loadPercent >= 70 ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {r.loadPercent}%
                                                </p>
                                                <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider">{c.label}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-2 bg-[#f0f0f0] dark:bg-[#2d353e] rounded-full overflow-hidden">
                                            <div className={`h-full ${c.bar} transition-all`} style={{ width: `${Math.min(r.loadPercent, 100)}%` }} />
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-[#687582] dark:text-gray-400 flex-wrap">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>
                                                {r.booked}/{r.capacity || "—"} lượt
                                            </span>
                                            {r.completed > 0 && (
                                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                                                    {r.completed} hoàn tất
                                                </span>
                                            )}
                                            {r.pending > 0 && (
                                                <span className="inline-flex items-center gap-1 text-amber-600">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                                    {r.pending} đang chờ
                                                </span>
                                            )}
                                            {r.avgPerHour > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>speed</span>
                                                    {r.avgPerHour.toFixed(1)}/h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
