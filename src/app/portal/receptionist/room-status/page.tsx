"use client";

/**
 * Room Status — Phase J.1 #3.
 * Spec: dòng 10269-10357.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Đang hoạt động", cls: "bg-emerald-100 text-emerald-700" },
    BUSY: { label: "Quá tải", cls: "bg-rose-100 text-rose-700" },
    IDLE: { label: "Trống", cls: "bg-blue-100 text-blue-700" },
    SLOW: { label: "Chậm", cls: "bg-amber-100 text-amber-700" },
    CLOSED: { label: "Đóng", cls: "bg-slate-200 text-slate-700" },
};

export default function ReceptionistRoomStatusPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [view, setView] = useState<"card" | "table">("card");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await appointmentStatusService.getRoomStatus();
            const data = (r as any)?.data ?? r;
            setRooms(Array.isArray(data) ? data : []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = {
        total: rooms.length,
        active: rooms.filter((r: any) => (r.status ?? "").toUpperCase() === "ACTIVE" || r.is_active).length,
        busy: rooms.filter((r: any) => (r.status ?? "").toUpperCase() === "BUSY").length,
        idle: rooms.filter((r: any) => (r.status ?? "").toUpperCase() === "IDLE" || (!r.is_active && !r.waiting_count)).length,
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Tình trạng phòng khám"
                subtitle="Theo dõi vận hành thực tế của các phòng khám."
                icon="meeting_room"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Room status" },
                ]}
                actions={
                    <div className="flex gap-2">
                        <button onClick={load} className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e]">
                            <span className="material-symbols-outlined text-[18px] align-middle">refresh</span>
                        </button>
                        <button onClick={() => setView(v => v === "card" ? "table" : "card")} className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e]">
                            {view === "card" ? "Bảng" : "Card"}
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng phòng" value={stats.total} icon="meeting_room" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Quá tải" value={stats.busy} icon="warning" color="red" loading={loading} />
                <StatCard label="Trống" value={stats.idle} icon="circle" color="violet" loading={loading} />
            </div>

            {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
            : rooms.length === 0 ? <EmptyState icon="meeting_room" title="Không có phòng" />
            : view === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((r: any, i: number) => {
                        const status = (r.status ?? (r.is_active ? "ACTIVE" : "IDLE")).toUpperCase();
                        const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                        return (
                            <div key={r.id ?? i} className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-base">{r.room_name ?? r.name ?? "Phòng"}</p>
                                        <p className="text-xs text-[#687582]">{r.doctor_name ?? "Chưa có bác sĩ"}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${meta.cls}`}>{meta.label}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                                        <p className="text-[#687582]">Đang chờ</p>
                                        <p className="font-bold text-[#3C81C6]">{r.waiting_count ?? 0}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                                        <p className="text-[#687582]">Đã khám</p>
                                        <p className="font-bold text-emerald-600">{r.completed_count ?? 0}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end">
                                    <Link href={`/portal/receptionist/queue?room=${r.room_name ?? r.id}`} className="text-xs text-[#3C81C6] hover:underline">
                                        Xem queue →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Đang chờ</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {rooms.map((r: any, i: number) => {
                                const status = (r.status ?? (r.is_active ? "ACTIVE" : "IDLE")).toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={r.id ?? i}>
                                        <td className="px-4 py-3 font-medium">{r.room_name ?? r.name}</td>
                                        <td className="px-4 py-3">{r.doctor_name ?? "—"}</td>
                                        <td className="px-4 py-3 font-bold text-[#3C81C6]">{r.waiting_count ?? 0}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/portal/receptionist/queue?room=${r.room_name ?? r.id}`} className="text-xs text-[#3C81C6] hover:underline">Queue</Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
