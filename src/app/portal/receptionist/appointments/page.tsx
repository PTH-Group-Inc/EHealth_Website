"use client";

/**
 * Receptionist Appointments — Phase J.3 #1-#5.
 * Spec: dòng 10777-11045.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import {
    getAppointments,
    rescheduleAppointment,
    appointmentConfirmationService,
    cancelAppointment,
} from "@/services/appointmentService";

type TabKey = "today" | "need_confirm" | "upcoming" | "done" | "all";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-700" },
    CHECKED_IN: { label: "Đã check-in", cls: "bg-indigo-100 text-indigo-700" },
    IN_PROGRESS: { label: "Đang khám", cls: "bg-violet-100 text-violet-700" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700" },
    NO_SHOW: { label: "Không đến", cls: "bg-slate-200 text-slate-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const fmtTime = (v?: string) => v?.toString().slice(0, 5) ?? "—";

interface Row {
    id: string;
    code: string;
    patientName: string;
    patientId?: string;
    phone?: string;
    doctorName?: string;
    serviceName?: string;
    room?: string;
    date?: string;
    slot?: string;
    status: string;
    reason?: string;
}

function normalize(a: any): Row {
    return {
        id: a.appointments_id ?? a.id,
        code: a.appointment_code ?? a.code ?? (a.id ?? "").toString().slice(0, 8),
        patientName: a.patient_name ?? a.patientName ?? "(chưa có)",
        patientId: a.patient_id ?? a.patientId,
        phone: a.patient_phone ?? a.phone,
        doctorName: a.doctor_name ?? a.doctorName,
        serviceName: a.service_name ?? a.serviceName,
        room: a.room_name ?? a.room,
        date: a.appointment_date ?? a.date,
        slot: a.slot_start_time ?? a.slot,
        status: (a.status ?? "PENDING").toString().toUpperCase(),
        reason: a.reason_for_visit ?? a.reason,
    };
}

export default function ReceptionistAppointmentsPage() {
    const [items, setItems] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("today");
    const [filterDate, setFilterDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Row | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAppointments({ limit: 200 });
            setItems((res.data ?? []).map(normalize));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = new Date().toISOString().slice(0, 10);

    const filtered = useMemo(() => items.filter(r => {
        if (tab === "today" && r.date?.slice(0, 10) !== today) return false;
        if (tab === "need_confirm" && r.status !== "PENDING") return false;
        if (tab === "upcoming" && !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status)) return false;
        if (tab === "done" && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status)) return false;
        if (filterDate && r.date?.slice(0, 10) !== filterDate) return false;
        if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return r.patientName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.phone ?? "").includes(q);
        }
        return true;
    }), [items, tab, today, filterDate, filterStatus, search]);

    const counts = {
        today: items.filter(r => r.date?.slice(0, 10) === today).length,
        need_confirm: items.filter(r => r.status === "PENDING").length,
        upcoming: items.filter(r => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status)).length,
        done: items.filter(r => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status)).length,
    };

    const onConfirm = async (id: string) => {
        try { await appointmentConfirmationService.confirm(id); await load(); }
        catch (e: any) { alert(e?.message ?? "Xác nhận thất bại"); }
    };

    const onResend = async (id: string) => {
        try { await appointmentConfirmationService.sendReminder(id); alert("Đã gửi lại nhắc lịch."); }
        catch (e: any) { alert(e?.message ?? "Gửi thất bại"); }
    };

    const onCancel = async (id: string) => {
        if (!confirm("Huỷ lịch hẹn này?")) return;
        try { await cancelAppointment(id); setSelected(null); await load(); }
        catch (e: any) { alert(e?.message ?? "Huỷ thất bại"); }
    };

    const onReschedule = async () => {
        if (!selected || !rescheduleDate) return;
        setBusy(true);
        try {
            await rescheduleAppointment(selected.id, { newDate: rescheduleDate });
            setSelected(null);
            await load();
        } catch (e: any) { alert(e?.message ?? "Dời lịch thất bại"); }
        finally { setBusy(false); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch khám"
                subtitle="Quản lý toàn bộ lịch khám: xác nhận, dời, nhắc, huỷ."
                icon="calendar_month"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Lịch khám" },
                ]}
                actions={
                    <Link href="/portal/receptionist/appointments/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3C81C6] text-white text-sm font-medium hover:bg-[#2a6da8]">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Đặt lịch tại quầy
                    </Link>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Hôm nay" value={counts.today} icon="event" color="blue" loading={loading} />
                <StatCard label="Cần xác nhận" value={counts.need_confirm} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Sắp tới" value={counts.upcoming} icon="upcoming" color="violet" loading={loading} />
                <StatCard label="Đã xong" value={counts.done} icon="task_alt" color="emerald" loading={loading} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {([
                    { key: "today", label: `Hôm nay (${counts.today})` },
                    { key: "need_confirm", label: `Cần xác nhận (${counts.need_confirm})` },
                    { key: "upcoming", label: `Sắp tới (${counts.upcoming})` },
                    { key: "done", label: `Đã xong (${counts.done})` },
                    { key: "all", label: `Tất cả (${items.length})` },
                ] as { key: TabKey; label: string }[]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === t.key ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm BN / mã / SĐT…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Mã</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Ngày</th>
                                <th className="text-left px-4 py-3">Giờ</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8}><EmptyState icon="event_busy" title="Không có lịch" /></td></tr>
                            ) : filtered.map(r => {
                                const meta = STATUS_META[r.status] ?? { label: r.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                                        <td className="px-4 py-3 font-medium">{r.patientName}</td>
                                        <td className="px-4 py-3">{fmt(r.date)}</td>
                                        <td className="px-4 py-3">{fmtTime(r.slot)}</td>
                                        <td className="px-4 py-3">{r.doctorName ?? "—"}</td>
                                        <td className="px-4 py-3">{r.room ?? "—"}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {r.status === "PENDING" && <button onClick={() => onConfirm(r.id)} className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">Xác nhận</button>}
                                                <button onClick={() => onResend(r.id)} className="px-2 py-1 text-xs rounded bg-amber-50 text-amber-700">Nhắc</button>
                                                <button onClick={() => { setSelected(r); setRescheduleDate(r.date?.slice(0, 10) ?? ""); }} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800">Chi tiết</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail modal with reschedule */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Chi tiết lịch</h3>
                                <p className="text-xs text-[#687582] font-mono">{selected.code}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div><p className="text-xs text-[#687582]">Bệnh nhân</p><p className="font-medium">{selected.patientName} · {selected.phone ?? "—"}</p></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><p className="text-xs text-[#687582]">Ngày</p><p>{fmt(selected.date)}</p></div>
                                <div><p className="text-xs text-[#687582]">Giờ</p><p>{fmtTime(selected.slot)}</p></div>
                            </div>
                            <div><p className="text-xs text-[#687582]">Bác sĩ / Phòng</p><p>{selected.doctorName ?? "—"} · {selected.room ?? "—"}</p></div>
                            {selected.reason && <div><p className="text-xs text-[#687582]">Lý do</p><p>{selected.reason}</p></div>}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3">
                                <p className="text-xs text-[#687582] mb-1">Dời lịch sang ngày</p>
                                <div className="flex gap-2">
                                    <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                                    <button onClick={onReschedule} disabled={busy} className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">Dời</button>
                                </div>
                            </div>
                            <Link href={`/portal/receptionist/change-history?appointmentId=${selected.id}`} className="text-xs text-[#3C81C6] hover:underline block">
                                Xem lịch sử thay đổi →
                            </Link>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-between">
                            <button onClick={() => onCancel(selected.id)} className="px-3 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50">Huỷ lịch</button>
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
