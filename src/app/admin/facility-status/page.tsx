"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { FACILITY_STATUS_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type Status = "OPEN" | "CLOSED" | "LIMITED";

interface FacilityStatus {
    facilityId: string;
    facilityName: string;
    branchId?: string;
    branchName?: string;
    date: string;
    status: Status;
    openTime?: string;
    closeTime?: string;
    note?: string;
}

const STATUS_META: Record<Status, { label: string; color: string; icon: string; bg: string }> = {
    OPEN: { label: "Mở cửa", color: "emerald", icon: "check_circle", bg: "from-emerald-500 to-teal-500" },
    CLOSED: { label: "Đóng cửa", color: "red", icon: "event_busy", bg: "from-red-500 to-rose-500" },
    LIMITED: { label: "Giới hạn", color: "amber", icon: "warning", bg: "from-amber-500 to-orange-500" },
};

function normalizeStatus(raw: any): Status {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CLOSED" || s === "OFF") return "CLOSED";
    if (s === "LIMITED" || s === "PARTIAL" || s === "RESTRICTED") return "LIMITED";
    return "OPEN";
}

function mapStatus(r: any): FacilityStatus {
    return {
        facilityId: String(r.facility_id ?? r.facilityId ?? r.facilities_id ?? ""),
        facilityName: r.facility_name ?? r.facilityName ?? r.name ?? "—",
        branchId: String(r.branch_id ?? r.branchId ?? r.branches_id ?? ""),
        branchName: r.branch_name ?? r.branchName ?? "",
        date: r.date ?? r.status_date ?? "",
        status: normalizeStatus(r.status),
        openTime: (r.open_time ?? r.openTime ?? "").slice(0, 5),
        closeTime: (r.close_time ?? r.closeTime ?? "").slice(0, 5),
        note: r.note ?? r.reason ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" });
}

function formatShortDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type ViewMode = "today" | "calendar";

export default function FacilityStatusPage() {
    const [view, setView] = useState<ViewMode>("today");
    const [today, setToday] = useState<FacilityStatus[]>([]);
    const [calendar, setCalendar] = useState<FacilityStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [todayRes, calRes] = await Promise.all([
                axiosClient.get(FACILITY_STATUS_ENDPOINTS.TODAY).catch(() => ({ data: { data: [] } })),
                axiosClient.get(FACILITY_STATUS_ENDPOINTS.CALENDAR).catch(() => ({ data: { data: [] } })),
            ]);
            const todayData = unwrapList<any>(todayRes).data;
            const calData = unwrapList<any>(calRes).data;
            setToday(todayData.map(mapStatus));
            setCalendar(calData.map(mapStatus));
        } catch {
            setError("Không tải được trạng thái cơ sở.");
            setToday([]);
            setCalendar([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: today.length,
        open: today.filter((s) => s.status === "OPEN").length,
        closed: today.filter((s) => s.status === "CLOSED").length,
        limited: today.filter((s) => s.status === "LIMITED").length,
    }), [today]);

    const calendarByFacility = useMemo(() => {
        const map = new Map<string, FacilityStatus[]>();
        calendar.forEach((s) => {
            const key = s.facilityName || s.facilityId;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        });
        map.forEach((list) => list.sort((a, b) => a.date.localeCompare(b.date)));
        return map;
    }, [calendar]);

    const upcomingDates = useMemo(() => {
        const dates = new Set<string>();
        calendar.forEach((s) => dates.add(s.date.slice(0, 10)));
        return Array.from(dates).sort().slice(0, 14);
    }, [calendar]);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Trạng thái cơ sở"
                subtitle="Nhìn nhanh hôm nay cơ sở nào mở/đóng và lịch vận hành 14 ngày tới"
                icon="store"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Trạng thái cơ sở" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "today", label: "Hôm nay", icon: "today" },
                    { key: "calendar", label: "Lịch 14 ngày", icon: "calendar_month" },
                ] as { key: ViewMode; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setView(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${
                            view === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"
                        }`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {view === "today" ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Tổng cơ sở" value={stats.total} icon="store" color="blue" loading={loading} />
                        <StatCard label="Đang mở cửa" value={stats.open} icon="check_circle" color="emerald" loading={loading} />
                        <StatCard label="Giới hạn" value={stats.limited} icon="warning" color="amber" loading={loading} />
                        <StatCard label="Đóng cửa" value={stats.closed} icon="event_busy" color="red" loading={loading} />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                        </div>
                    ) : today.length === 0 ? (
                        <EmptyState icon="store" title="Chưa có dữ liệu trạng thái" description="Chưa có cơ sở nào báo cáo trạng thái hôm nay." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {today.map((s, i) => {
                                const meta = STATUS_META[s.status];
                                return (
                                    <div key={`${s.facilityId}-${i}`} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden hover:shadow-md transition-all">
                                        <div className={`h-1.5 bg-gradient-to-r ${meta.bg}`} />
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>store</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate">{s.facilityName}</h3>
                                                        {s.branchName && <p className="text-xs text-[#687582] dark:text-gray-400 truncate">{s.branchName}</p>}
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </div>
                                            {s.openTime && s.closeTime && s.status !== "CLOSED" && (
                                                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-400 mb-2">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                                    <span className="font-mono">{s.openTime}–{s.closeTime}</span>
                                                </div>
                                            )}
                                            {s.note && <div className="text-xs text-[#687582] dark:text-gray-400 line-clamp-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">{s.note}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {loading ? (
                        <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ) : calendarByFacility.size === 0 ? (
                        <EmptyState icon="calendar_month" title="Chưa có lịch vận hành" description="Chưa có dữ liệu calendar cho 14 ngày tới." />
                    ) : (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-semibold text-[#687582] dark:text-gray-400 sticky left-0 bg-[#f8f9fa] dark:bg-[#13191f] min-w-[180px]">Cơ sở</th>
                                            {upcomingDates.map((d) => {
                                                const dt = new Date(d);
                                                return (
                                                    <th key={d} className="px-2 py-2 text-center font-semibold text-[10px] text-[#687582] dark:text-gray-400 whitespace-nowrap">
                                                        <div>{formatShortDate(dt)}</div>
                                                        <div className="text-[8px] opacity-60">{dt.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(calendarByFacility.entries()).map(([name, items]) => {
                                            const byDate = new Map(items.map((s) => [s.date.slice(0, 10), s]));
                                            return (
                                                <tr key={name} className="border-b border-gray-50 dark:border-gray-800">
                                                    <td className="px-3 py-2 font-medium text-[#121417] dark:text-white sticky left-0 bg-white dark:bg-[#1e242b] z-10">{name}</td>
                                                    {upcomingDates.map((d) => {
                                                        const s = byDate.get(d);
                                                        if (!s) return <td key={d} className="px-1 py-1"><div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 mx-auto" /></td>;
                                                        const meta = STATUS_META[s.status];
                                                        return (
                                                            <td key={d} className="px-1 py-1" title={`${meta.label} ${s.openTime ? `· ${s.openTime}-${s.closeTime}` : ""} ${s.note ? `· ${s.note}` : ""}`}>
                                                                <div className={`w-6 h-6 rounded flex items-center justify-center mx-auto bg-gradient-to-br ${meta.bg} text-white`}>
                                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center gap-4 px-4 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] bg-[#f8f9fa] dark:bg-[#13191f]">
                                {(Object.entries(STATUS_META) as [Status, typeof STATUS_META.OPEN][]).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-1.5 text-xs">
                                        <div className={`w-4 h-4 rounded bg-gradient-to-br ${v.bg}`} />
                                        <span className="text-[#687582] dark:text-gray-400">{v.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
