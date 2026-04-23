"use client";

/**
 * Queue hôm nay — Phase I.2 Nhóm 2 #3.
 * Spec: dòng 5155-5243 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";

type QueueStatus = "waiting" | "in_progress" | "completed" | "skipped" | "cancelled";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Đang chờ", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    in_progress: { label: "Đang khám", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    completed: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    skipped: { label: "Đã bỏ qua", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
    cancelled: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    recalled: { label: "Gọi lại", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

const normalizeStatus = (raw: any): QueueStatus => {
    const s = (raw ?? "").toString().toUpperCase();
    if (s === "WAITING" || s === "PENDING") return "waiting";
    if (s === "IN_PROGRESS" || s === "EXAMINING" || s === "STARTED") return "in_progress";
    if (s === "COMPLETED" || s === "DONE") return "completed";
    if (s === "SKIPPED") return "skipped";
    if (s === "CANCELLED" || s === "NO_SHOW") return "cancelled";
    return "waiting";
};

interface QueueItem {
    id: string;
    queueNumber?: number | string;
    patientName: string;
    room?: string;
    doctorName?: string;
    status: QueueStatus;
    appointmentTime?: string;
    checkInTime?: string;
    waitTime?: string;
}

function normalizeItem(a: any): QueueItem {
    return {
        id: a.id ?? a.appointments_id ?? a.queueId,
        queueNumber: a.queue_number ?? a.queueNumber ?? a.queue_no,
        patientName: a.patient_name ?? a.patientName ?? a.patient?.fullName ?? "(chưa có tên)",
        room: a.room_name ?? a.room ?? a.clinic_room_name,
        doctorName: a.doctor_name ?? a.doctorName,
        status: normalizeStatus(a.queue_status ?? a.status),
        appointmentTime: a.appointment_time ?? a.appointmentTime ?? a.slot_start_time ?? a.time,
        checkInTime: a.check_in_time ?? a.checkInTime,
        waitTime: a.wait_time ?? a.waitTime,
    };
}

export default function DoctorQueuePage() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<QueueStatus | "ALL">("ALL");
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [q, r] = await Promise.allSettled([
                appointmentStatusService.getQueueToday({ doctorId: user.id }),
                appointmentStatusService.getRoomStatus(),
            ]);
            if (q.status === "fulfilled") {
                const data = q.value?.data ?? q.value;
                const arr = Array.isArray(data) ? data : [];
                setQueue(arr.map(normalizeItem));
            } else {
                setQueue([]);
            }
            if (r.status === "fulfilled") {
                const data = r.value?.data ?? r.value;
                setRooms(Array.isArray(data) ? data : []);
            }
            setLastUpdate(new Date());
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const uniqueRooms = useMemo(() => {
        const set = new Set<string>();
        queue.forEach(q => q.room && set.add(q.room));
        rooms.forEach((r: any) => (r.room_name ?? r.name) && set.add(r.room_name ?? r.name));
        return Array.from(set);
    }, [queue, rooms]);

    const filtered = useMemo(() => {
        return queue.filter(q => {
            if (roomFilter !== "ALL" && q.room !== roomFilter) return false;
            if (statusFilter !== "ALL" && q.status !== statusFilter) return false;
            return true;
        });
    }, [queue, roomFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: queue.length,
        waiting: queue.filter(q => q.status === "waiting").length,
        inProgress: queue.filter(q => q.status === "in_progress").length,
        completed: queue.filter(q => q.status === "completed").length,
    }), [queue]);

    const doAction = async (id: string, action: "start" | "complete" | "skip" | "recall") => {
        setBusyId(id);
        try {
            if (action === "start") await appointmentStatusService.startExam(id);
            if (action === "complete") await appointmentStatusService.completeExam(id);
            if (action === "skip") await appointmentStatusService.skip(id);
            if (action === "recall") await appointmentStatusService.recall(id);
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? e?.message ?? "Thao tác thất bại");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Queue hôm nay"
                subtitle="Hàng đợi bệnh nhân đang chờ / đang khám / đã xong trong ngày."
                icon="groups"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Queue hôm nay" },
                ]}
                actions={
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Làm mới
                    </button>
                }
            />

            <p className="text-xs text-[#687582] mb-4">
                Cập nhật lúc {lastUpdate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng ca" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Đang chờ" value={stats.waiting} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đang khám" value={stats.inProgress} icon="stethoscope" color="violet" loading={loading} />
                <StatCard label="Đã xong" value={stats.completed} icon="task_alt" color="emerald" loading={loading} />
            </div>

            {/* Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <select
                    value={roomFilter}
                    onChange={e => setRoomFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                >
                    <option value="ALL">Tất cả phòng</option>
                    {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="waiting">Đang chờ</option>
                    <option value="in_progress">Đang khám</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="skipped">Đã bỏ qua</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-[#687582] dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">STT</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Giờ hẹn</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon="groups" title="Queue trống" description="Không có ca nào khớp bộ lọc." variant="success" /></td></tr>
                            ) : filtered.map(q => {
                                const meta = STATUS_META[q.status] ?? { label: q.status, cls: "bg-gray-100 text-gray-700" };
                                const highlight = q.status === "waiting"
                                    ? "border-l-4 border-amber-400"
                                    : q.status === "in_progress"
                                        ? "border-l-4 border-violet-500"
                                        : "";
                                const disabled = busyId === q.id;
                                return (
                                    <tr key={q.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${highlight}`}>
                                        <td className="px-4 py-3 font-bold text-[#3C81C6]">#{q.queueNumber ?? "?"}</td>
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{q.patientName}</td>
                                        <td className="px-4 py-3">{q.room ?? "—"}</td>
                                        <td className="px-4 py-3">{q.appointmentTime ? q.appointmentTime.toString().slice(0, 5) : "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {q.status === "waiting" && (
                                                    <button
                                                        onClick={() => doAction(q.id, "start")}
                                                        disabled={disabled}
                                                        className="px-2 py-1 text-xs rounded-md bg-[#3C81C6] text-white hover:bg-[#2a6da8] disabled:opacity-50"
                                                    >
                                                        Bắt đầu
                                                    </button>
                                                )}
                                                {q.status === "in_progress" && (
                                                    <button
                                                        onClick={() => doAction(q.id, "complete")}
                                                        disabled={disabled}
                                                        className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        Hoàn tất
                                                    </button>
                                                )}
                                                {q.status === "waiting" && (
                                                    <button
                                                        onClick={() => doAction(q.id, "skip")}
                                                        disabled={disabled}
                                                        className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-[#121417] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                                                    >
                                                        Bỏ qua
                                                    </button>
                                                )}
                                                {q.status === "skipped" && (
                                                    <button
                                                        onClick={() => doAction(q.id, "recall")}
                                                        disabled={disabled}
                                                        className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                                    >
                                                        Gọi lại
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/portal/doctor/examination?appointmentId=${q.id}`}
                                                    className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    Chi tiết
                                                </Link>
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
