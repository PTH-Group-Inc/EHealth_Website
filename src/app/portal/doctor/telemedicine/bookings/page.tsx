"use client";

/**
 * Telemedicine Bookings — Phase I.6 #1.
 * Spec: dòng 7029-7107.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { telemedicineService, type TelemedicineSession } from "@/services/telemedicineService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-700" },
    IN_PROGRESS: { label: "Đang khám", cls: "bg-violet-100 text-violet-700" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return v; } };

export default function DoctorTeleBookingsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<TelemedicineSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const params: any = { doctorId: user.id, limit: 100 };
            if (date) { params.from = date; params.to = date; }
            const res = await telemedicineService.getList(params);
            setItems((res as any)?.data ?? []);
        } finally { setLoading(false); }
    }, [user?.id, date]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => items.filter((s: any) => {
        const status = (s.status ?? "PENDING").toString().toUpperCase();
        if (statusFilter !== "ALL" && status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!(s.patientName ?? s.patient_name ?? "").toLowerCase().includes(q) &&
                !(s.id ?? "").toString().toLowerCase().includes(q)) return false;
        }
        return true;
    }), [items, statusFilter, search]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter((s: any) => (s.status ?? "").toUpperCase() === "PENDING").length,
        upcoming: items.filter((s: any) => (s.status ?? "").toUpperCase() === "CONFIRMED").length,
    }), [items]);

    const onConfirm = async (id: string) => {
        try { await telemedicineService.confirm(id); await load(); }
        catch (e: any) { alert(e?.message ?? "Xác nhận thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Telemedicine Booking"
                subtitle="Danh sách phiên khám online đã đặt."
                icon="event_available"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Booking" },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng phiên" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ xác nhận" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Sắp diễn ra" value={stats.upcoming} icon="upcoming" color="violet" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bệnh nhân / ID…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Session</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Loại</th>
                                <th className="text-left px-4 py-3">Thời gian</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon="videocam_off" title="Không có phiên khám" description="Không có booking khớp bộ lọc." /></td></tr>
                            ) : filtered.map((s: any) => {
                                const status = (s.status ?? "PENDING").toString().toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{s.id?.slice?.(0, 8)}</td>
                                        <td className="px-4 py-3 font-medium">{s.patientName ?? s.patient_name ?? "—"}</td>
                                        <td className="px-4 py-3">{s.type ?? s.consultation_type ?? "video"}</td>
                                        <td className="px-4 py-3">{fmt(s.scheduledAt ?? s.scheduled_at ?? s.startTime ?? s.appointment_date)}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {status === "PENDING" && (
                                                    <button onClick={() => onConfirm(s.id)} className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Xác nhận</button>
                                                )}
                                                {(status === "CONFIRMED" || status === "IN_PROGRESS") && (
                                                    <Link href={`/portal/doctor/telemedicine/room?sessionId=${s.id}`} className="px-2 py-1 text-xs rounded-md bg-[#3C81C6] text-white hover:bg-[#2a6da8]">
                                                        Vào room
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
