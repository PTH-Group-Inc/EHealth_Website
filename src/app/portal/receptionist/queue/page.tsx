"use client";

/**
 * Receptionist Queue — Phase J.1 #2 + J.3 #7 (điều phối hàng đợi).
 * Spec: dòng 10137-10265 + 11140-11173.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Đang chờ", cls: "bg-amber-100 text-amber-700" },
    checked_in: { label: "Đã check-in", cls: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Đang khám", cls: "bg-violet-100 text-violet-700" },
    completed: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
    skipped: { label: "Bỏ qua", cls: "bg-slate-200 text-slate-700" },
    no_show: { label: "Không đến", cls: "bg-rose-100 text-rose-700" },
};

const normalizeStatus = (raw: any): string => {
    const s = (raw ?? "").toString().toUpperCase();
    if (["WAITING", "PENDING"].includes(s)) return "waiting";
    if (s === "CHECKED_IN") return "checked_in";
    if (["IN_PROGRESS", "EXAMINING"].includes(s)) return "in_progress";
    if (["COMPLETED", "DONE"].includes(s)) return "completed";
    if (s === "SKIPPED") return "skipped";
    if (s === "NO_SHOW") return "no_show";
    return "waiting";
};

interface QueueItem {
    id: string;
    queueNumber?: number;
    patientName: string;
    appointmentCode?: string;
    room?: string;
    doctorName?: string;
    status: string;
    appointmentTime?: string;
}

export default function ReceptionistQueuePage() {
    const sp = useSearchParams();
    const initialRoom = sp.get("room") ?? "ALL";

    const [items, setItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState(initialRoom);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await appointmentStatusService.getQueueToday();
            const data = (r as any)?.data ?? r;
            setItems((Array.isArray(data) ? data : []).map((a: any) => ({
                id: a.id ?? a.appointments_id,
                queueNumber: a.queue_number ?? a.queueNumber,
                patientName: a.patient_name ?? a.patientName ?? "(chưa có)",
                appointmentCode: a.appointment_code ?? a.code,
                room: a.room_name ?? a.room,
                doctorName: a.doctor_name ?? a.doctorName,
                status: normalizeStatus(a.queue_status ?? a.status),
                appointmentTime: a.appointment_time ?? a.slot_start_time,
            })));
            setLastUpdate(new Date());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const rooms = useMemo(() => Array.from(new Set(items.map(q => q.room).filter(Boolean) as string[])), [items]);

    const filtered = useMemo(() => items.filter(q => {
        if (roomFilter !== "ALL" && q.room !== roomFilter) return false;
        if (statusFilter !== "ALL" && q.status !== statusFilter) return false;
        if (search) {
            const qq = search.toLowerCase();
            return q.patientName.toLowerCase().includes(qq) || (q.appointmentCode ?? "").toLowerCase().includes(qq);
        }
        return true;
    }), [items, roomFilter, statusFilter, search]);

    const stats = useMemo(() => ({
        total: items.length,
        waiting: items.filter(q => q.status === "waiting").length,
        checkedIn: items.filter(q => q.status === "checked_in").length,
        inProgress: items.filter(q => q.status === "in_progress").length,
    }), [items]);

    const doAction = async (id: string, action: "check_in" | "skip" | "recall" | "no_show") => {
        setBusyId(id);
        try {
            if (action === "check_in") await appointmentStatusService.checkIn(id);
            if (action === "skip") await appointmentStatusService.skip(id);
            if (action === "recall") await appointmentStatusService.recall(id);
            if (action === "no_show") await appointmentStatusService.markNoShow(id);
            await load();
        } catch (e: any) { alert(e?.message ?? "Thao tác thất bại"); }
        finally { setBusyId(null); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hàng đợi hôm nay"
                subtitle={`Cập nhật ${lastUpdate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
                icon="groups"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Hàng đợi" },
                ]}
                actions={
                    <button onClick={load} className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e]">
                        <span className="material-symbols-outlined text-[18px] align-middle">refresh</span> Làm mới
                    </button>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Đang chờ" value={stats.waiting} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đã check-in" value={stats.checkedIn} icon="how_to_reg" color="violet" loading={loading} />
                <StatCard label="Đang khám" value={stats.inProgress} icon="stethoscope" color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bệnh nhân / mã lịch…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi phòng</option>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">STT</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Mã lịch</th>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon="groups" title="Queue trống" variant="success" /></td></tr>
                            ) : filtered.map(q => {
                                const meta = STATUS_META[q.status] ?? { label: q.status, cls: "bg-gray-100 text-gray-700" };
                                const highlight = q.status === "waiting" ? "border-l-4 border-amber-400"
                                    : q.status === "in_progress" ? "border-l-4 border-violet-500" : "";
                                const disabled = busyId === q.id;
                                return (
                                    <tr key={q.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${highlight}`}>
                                        <td className="px-4 py-3 font-bold text-[#3C81C6]">#{q.queueNumber ?? "?"}</td>
                                        <td className="px-4 py-3 font-medium">{q.patientName}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{q.appointmentCode ?? "—"}</td>
                                        <td className="px-4 py-3">{q.room ?? "—"}</td>
                                        <td className="px-4 py-3">{q.doctorName ?? "—"}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {q.status === "waiting" && (
                                                    <>
                                                        <button onClick={() => doAction(q.id, "check_in")} disabled={disabled} className="px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">Check-in</button>
                                                        <button onClick={() => doAction(q.id, "skip")} disabled={disabled} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 disabled:opacity-50">Bỏ qua</button>
                                                        <button onClick={() => doAction(q.id, "no_show")} disabled={disabled} className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50">No-show</button>
                                                    </>
                                                )}
                                                {q.status === "skipped" && (
                                                    <button onClick={() => doAction(q.id, "recall")} disabled={disabled} className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">Gọi lại</button>
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
