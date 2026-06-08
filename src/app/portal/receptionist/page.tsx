"use client";

/**
 * Receptionist Dashboard — Phase J.1 #1.
 * Dashboard tổng quan cho lễ tân: thống kê, hàng đợi live, hoá đơn gần nhất, phòng khám.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { billingService } from "@/services/billingService";

/* ── Thao tác nhanh ───────────────────────────────────────── */
const QUICK_ACTIONS = [
    { icon: "person_search", label: "Tra cứu BN", href: "/portal/receptionist/patients", color: "from-blue-500 to-blue-600" },
    { icon: "event_available", label: "Đặt lịch tại quầy", href: "/portal/receptionist/appointments/new", color: "from-emerald-500 to-emerald-600" },
    { icon: "qr_code_scanner", label: "Tiếp nhận", href: "/portal/receptionist/check-in", color: "from-amber-500 to-amber-600" },
    { icon: "groups", label: "Hàng đợi hôm nay", href: "/portal/receptionist/queue", color: "from-violet-500 to-violet-600" },
    { icon: "meeting_room", label: "Tình trạng phòng", href: "/portal/receptionist/room-status", color: "from-pink-500 to-pink-600" },
    { icon: "receipt_long", label: "Thu phí", href: "/portal/receptionist/billing", color: "from-cyan-500 to-cyan-600" },
];

/* ── Helpers ───────────────────────────────────────────────── */
const fmtMoney = (v?: number) => (v ?? 0).toLocaleString("vi-VN") + " ₫";
const fmtTime = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); } catch { return v; } };

const QUEUE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    CHECKED_IN: { label: "Đã tiếp nhận", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    IN_PROGRESS: { label: "Đang khám", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    SKIPPED: { label: "Bỏ qua", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ thu", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    PAID: { label: "Đã thu", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    PARTIALLY_PAID: { label: "Thu 1 phần", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

export default function ReceptionistDashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [queue, setQueue] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [d, r, q, inv] = await Promise.allSettled([
            appointmentStatusService.getDashboardToday(),
            appointmentStatusService.getRoomStatus(),
            appointmentStatusService.getQueueToday({ include_all: true }),
            billingService.getInvoices({ limit: 8, sort: "created_at:desc" }),
        ]);

        if (d.status === "fulfilled") {
            const val = (d.value as any)?.data ?? d.value;
            setDashboard(val);
        }
        if (r.status === "fulfilled") {
            const val = (r.value as any)?.data ?? r.value;
            setRooms(Array.isArray(val) ? val : []);
        }
        if (q.status === "fulfilled") {
            const val = (q.value as any)?.data ?? q.value;
            setQueue(Array.isArray(val) ? val : []);
        }
        if (inv.status === "fulfilled") {
            const raw = (inv.value as any)?.data;
            const list = raw?.data ?? raw?.invoices ?? raw?.items ?? (Array.isArray(raw) ? raw : []);
            setInvoices(Array.isArray(list) ? list.slice(0, 8) : []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── Computed stats (hỗ trợ cả cấu trúc flat lẫn nested summary) ── */
    const summary = dashboard?.summary ?? dashboard;
    const queueInfo = dashboard?.queue;
    const stats = {
        total: summary?.total ?? summary?.total_today ?? 0,
        waiting: queueInfo?.total_waiting ?? summary?.checked_in ?? summary?.waiting ?? 0,
        checkedIn: summary?.checked_in ?? 0,
        inProgress: summary?.in_progress ?? 0,
        completed: summary?.completed ?? 0,
        pending: summary?.pending ?? 0,
        confirmed: summary?.confirmed ?? 0,
        noShow: summary?.no_show ?? 0,
        cancelled: summary?.cancelled ?? 0,
        rooms: rooms.length,
    };

    /* Lọc hàng đợi active (checked_in, in_progress, confirmed, skipped) */
    const activeQueue = queue
        .filter((q: any) => ["CHECKED_IN", "IN_PROGRESS", "SKIPPED", "CONFIRMED"].includes(q.status))
        .sort((a: any, b: any) => (a.queue_number ?? 999) - (b.queue_number ?? 999))
        .slice(0, 8);

    /* Hoá đơn chờ thu */
    const pendingInvoices = invoices.filter((i: any) => i.status === "PENDING" || i.status === "PARTIALLY_PAID");
    const billingCount = pendingInvoices.length;

    const greetName = user?.fullName ?? user?.email ?? "lễ tân";

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Quầy tiếp đón"
                subtitle={`Xin chào ${greetName} — tổng quan tiếp nhận hôm nay (${new Date().toLocaleDateString("vi-VN")}).`}
                icon="contact_emergency"
            />

            {/* ── Row 1: Thao tác nhanh (ưu tiên trên fold cho ca lễ tân) ── */}
            <div>
                <h3 className="text-sm font-bold mb-3 text-[#121417] dark:text-white">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} href={a.href} className="group bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 hover:shadow-md hover:border-[#3C81C6]/40 transition-all text-center">
                            <div className={`mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-[24px]">{a.icon}</span>
                            </div>
                            <p className="text-xs font-medium text-[#121417] dark:text-white">{a.label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Row 2: Stat Cards (KPI làm background context) ──── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Tổng lịch hôm nay" value={stats.total} icon="event" color="blue" loading={loading} href="/portal/receptionist/appointments" />
                <StatCard label="Chờ xác nhận" value={stats.pending} icon="schedule" color="amber" loading={loading} href="/portal/receptionist/appointments" />
                <StatCard label="Đã tiếp nhận" value={stats.checkedIn} icon="how_to_reg" color="emerald" loading={loading} href="/portal/receptionist/queue" />
                <StatCard label="Đang khám" value={stats.inProgress} icon="stethoscope" color="violet" loading={loading} href="/portal/receptionist/queue" />
                <StatCard label="Hoàn tất" value={stats.completed} icon="check_circle" color="blue" loading={loading} />
                <StatCard label="Hoá đơn chờ thu" value={billingCount} icon="receipt_long" color="pink" loading={loading} href="/portal/receptionist/billing" />
            </div>

            {/* ── Row 3: 2 columns — Hàng đợi live + Tóm tắt theo trạng thái ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Hàng đợi live --- */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-violet-600">groups</span>
                        <h3 className="text-sm font-bold flex-1">Hàng đợi hôm nay ({activeQueue.length})</h3>
                        <Link href="/portal/receptionist/queue" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
                        </div>
                    ) : activeQueue.length === 0 ? (
                        <EmptyState icon="groups" title="Chưa có bệnh nhân trong hàng đợi" compact />
                    ) : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {activeQueue.map((q: any, i: number) => {
                                const st = QUEUE_STATUS_MAP[q.status] ?? { label: q.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <li key={q.appointments_id ?? q.id ?? i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 font-bold text-sm">
                                            {q.queue_number ?? "—"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{q.patient_name ?? "Bệnh nhân"}</p>
                                            <p className="text-xs text-[#687582]">
                                                {q.doctor_name ?? "—"} · {q.room_name ?? "—"} · {fmtTime(q.slot_start_time ?? q.appointment_time)}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${st.cls}`}>{st.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* --- Tóm tắt theo trạng thái --- */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">summarize</span>
                        <h3 className="text-sm font-bold flex-1">Tóm tắt theo trạng thái</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {[
                            { label: "Chờ xác nhận", value: stats.pending, color: "text-amber-600", icon: "schedule" },
                            { label: "Đã xác nhận", value: stats.confirmed, color: "text-blue-600", icon: "event_available" },
                            { label: "Đã tiếp nhận", value: stats.checkedIn, color: "text-cyan-600", icon: "how_to_reg" },
                            { label: "Đang khám", value: stats.inProgress, color: "text-violet-600", icon: "stethoscope" },
                            { label: "Hoàn tất", value: stats.completed, color: "text-emerald-600", icon: "check_circle" },
                            { label: "Vắng mặt", value: stats.noShow, color: "text-rose-600", icon: "person_off" },
                            { label: "Đã huỷ", value: stats.cancelled, color: "text-slate-500", icon: "cancel" },
                            { label: "Tổng cộng", value: stats.total, color: "text-[#121417] dark:text-white", icon: "bar_chart" },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                                <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                                <div>
                                    <p className="text-xs text-[#687582]">{s.label}</p>
                                    <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Row 4: 2 columns — Hoá đơn gần nhất + Phòng khám ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Hoá đơn gần nhất --- */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-cyan-600">receipt_long</span>
                        <h3 className="text-sm font-bold flex-1">Hoá đơn gần nhất ({invoices.length})</h3>
                        <Link href="/portal/receptionist/billing" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
                        </div>
                    ) : invoices.length === 0 ? (
                        <EmptyState icon="receipt_long" title="Chưa có hoá đơn nào" compact />
                    ) : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {invoices.map((inv: any, i: number) => {
                                const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <li key={inv.invoice_id ?? inv.id ?? i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600">
                                            <span className="material-symbols-outlined text-[18px]">receipt</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {inv.patient_name ?? "Bệnh nhân"}{" "}
                                                <span className="text-[10px] text-[#687582] font-normal">#{(inv.invoice_number ?? inv.invoice_id ?? "").slice(-8)}</span>
                                            </p>
                                            <p className="text-xs text-[#687582]">{fmtMoney(inv.total_amount ?? inv.amount)} · {fmtTime(inv.created_at)}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${st.cls}`}>{st.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* --- Phòng khám --- */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-violet-600">meeting_room</span>
                        <h3 className="text-sm font-bold flex-1">Tình trạng phòng ({rooms.length})</h3>
                        <Link href="/portal/receptionist/room-status" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
                        </div>
                    ) : rooms.length === 0 ? (
                        <EmptyState icon="meeting_room" title="Không có dữ liệu phòng" compact />
                    ) : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {rooms.slice(0, 6).map((r: any, i: number) => {
                                const isActive = r.status === "OCCUPIED" || r.status === "ACTIVE" || r.is_active;
                                return (
                                    <li key={r.id ?? i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{r.room_name ?? r.name ?? "Phòng"}</p>
                                                <p className="text-xs text-[#687582]">
                                                    {r.doctor_name ?? "—"}{r.waiting_count ? ` · ${r.waiting_count} chờ` : ""}
                                                    {r.current_patient ? ` · BN: ${r.current_patient}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                                            {r.status === "OCCUPIED" ? "Đang khám" : r.status === "AVAILABLE" ? "Trống" : r.status ?? (r.is_active ? "Hoạt động" : "Trống")}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Row 5: Hàng đợi hiện tại (số phục vụ hiện tại & kế tiếp) ── */}
            {queueInfo && (queueInfo.current_serving || queueInfo.next_in_line) && (
                <div className="bg-gradient-to-r from-[#3C81C6] to-[#2a6da8] rounded-xl p-5 text-white flex flex-wrap items-center gap-6">
                    <span className="material-symbols-outlined text-[32px]">counter_1</span>
                    <div>
                        <p className="text-xs opacity-80 uppercase tracking-wider">Đang phục vụ</p>
                        <p className="text-2xl font-bold">{queueInfo.current_serving?.patient_name ?? "—"} <span className="text-base opacity-70">STT #{queueInfo.current_serving?.queue_number ?? "—"}</span></p>
                    </div>
                    <div className="w-px h-10 bg-white/30 hidden md:block" />
                    <div>
                        <p className="text-xs opacity-80 uppercase tracking-wider">Kế tiếp</p>
                        <p className="text-lg font-semibold">{queueInfo.next_in_line?.patient_name ?? "—"} <span className="text-sm opacity-70">STT #{queueInfo.next_in_line?.queue_number ?? "—"}</span></p>
                    </div>
                    <div className="ml-auto">
                        <p className="text-xs opacity-80">Còn chờ</p>
                        <p className="text-3xl font-extrabold">{queueInfo.total_waiting ?? 0}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
