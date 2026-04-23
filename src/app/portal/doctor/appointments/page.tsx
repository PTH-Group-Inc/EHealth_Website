"use client";

/**
 * Lịch khám của tôi — Phase I.2 Nhóm 2 #1 & #2 (danh sách + xác nhận lịch).
 * Spec: dòng 4984-5151 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import {
    getAppointmentsByDoctor,
    rescheduleAppointment,
    updateVisitReason,
    checkAppointmentConflict,
    appointmentConfirmationService,
    cancelAppointment,
} from "@/services/appointmentService";

type TabKey = "all" | "today" | "need_confirm" | "upcoming" | "done";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
    PENDING: { text: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    CONFIRMED: { text: "Đã xác nhận", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    CHECKED_IN: { text: "Đã check-in", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
    IN_PROGRESS: { text: "Đang khám", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    COMPLETED: { text: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    CANCELLED: { text: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    NO_SHOW: { text: "Không đến", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

const formatDate = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return v; }
};
const formatTime = (v?: string) => {
    if (!v) return "—";
    const s = v.toString().slice(0, 5);
    return s.match(/^\d{2}:\d{2}$/) ? s : v;
};

function normalize(a: any) {
    return {
        id: a.appointments_id ?? a.id,
        code: a.appointment_code ?? a.code ?? (a.id ? a.id.toString().slice(0, 8) : "—"),
        patientName: a.patient_name ?? a.patientName ?? "(chưa có tên)",
        patientId: a.patient_id ?? a.patientId,
        phone: a.patient_phone ?? a.phone,
        date: a.appointment_date ?? a.date,
        slot: a.slot_start_time ?? a.slot ?? a.time,
        slotEnd: a.slot_end_time ?? a.endTime,
        room: a.room_name ?? a.room ?? a.clinic_room_name,
        serviceName: a.service_name ?? a.facility_service_name ?? a.serviceName,
        status: (a.status ?? "PENDING").toString().toUpperCase(),
        reason: a.reason_for_visit ?? a.reason ?? a.visit_reason,
        encounterId: a.encounter_id ?? a.encounterId,
        raw: a,
    };
}

export default function DoctorAppointmentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState<ReturnType<typeof normalize>[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("today");
    const [filterDate, setFilterDate] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [filterRoom, setFilterRoom] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ReturnType<typeof normalize> | null>(null);
    const [editReason, setEditReason] = useState(false);
    const [reasonValue, setReasonValue] = useState("");
    const [rescheduleMode, setRescheduleMode] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleSlot, setRescheduleSlot] = useState("");
    const [conflictMsg, setConflictMsg] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await getAppointmentsByDoctor(user.id);
            const arr = Array.isArray(res) ? res : [];
            setItems(arr.map(normalize));
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [user?.id]);

    const today = new Date().toISOString().slice(0, 10);

    const rooms = useMemo(() => {
        const set = new Set(items.map(i => i.room).filter(Boolean) as string[]);
        return Array.from(set);
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter(i => {
            if (tab === "today" && i.date?.slice(0, 10) !== today) return false;
            if (tab === "need_confirm" && i.status !== "PENDING") return false;
            if (tab === "upcoming" && !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(i.status)) return false;
            if (tab === "done" && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status)) return false;
            if (filterDate && i.date?.slice(0, 10) !== filterDate) return false;
            if (filterStatus !== "ALL" && i.status !== filterStatus) return false;
            if (filterRoom !== "ALL" && i.room !== filterRoom) return false;
            if (search) {
                const q = search.toLowerCase();
                const match = i.patientName.toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [items, tab, today, filterDate, filterStatus, filterRoom, search]);

    const counts = useMemo(() => ({
        today: items.filter(i => i.date?.slice(0, 10) === today).length,
        need_confirm: items.filter(i => i.status === "PENDING").length,
        upcoming: items.filter(i => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(i.status)).length,
        done: items.filter(i => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status)).length,
    }), [items, today]);

    const onOpen = (item: ReturnType<typeof normalize>) => {
        setSelected(item);
        setEditReason(false);
        setReasonValue(item.reason ?? "");
        setRescheduleMode(false);
        setRescheduleDate(item.date?.slice(0, 10) ?? "");
        setRescheduleSlot(item.slot ?? "");
        setConflictMsg(null);
    };

    const onConfirm = async (id: string) => {
        try {
            await appointmentConfirmationService.confirm(id);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Xác nhận thất bại");
        }
    };

    const onResend = async (id: string) => {
        try {
            await appointmentConfirmationService.resendNotification(id);
            alert("Đã gửi lại thông báo cho bệnh nhân.");
        } catch (e: any) {
            alert(e?.message ?? "Gửi lại thất bại");
        }
    };

    const onSaveReason = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await updateVisitReason(selected.id, reasonValue);
            await load();
            setEditReason(false);
        } catch (e: any) {
            alert(e?.message ?? "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onCheckConflict = async () => {
        if (!selected) return;
        setConflictMsg(null);
        const res = await checkAppointmentConflict({
            doctorId: user?.id,
            date: rescheduleDate,
            excludeAppointmentId: selected.id,
        });
        setConflictMsg(res.hasConflict
            ? `Có ${res.conflicts?.length ?? 1} xung đột vào ngày đã chọn.`
            : "Không phát hiện xung đột. Có thể dời an toàn.");
    };

    const onReschedule = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await rescheduleAppointment(selected.id, { newDate: rescheduleDate });
            await load();
            setRescheduleMode(false);
        } catch (e: any) {
            alert(e?.message ?? "Dời lịch thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onCancel = async (id: string) => {
        if (!confirm("Huỷ lịch hẹn này?")) return;
        try {
            await cancelAppointment(id);
            setSelected(null);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Huỷ lịch thất bại");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch khám của tôi"
                subtitle="Toàn bộ lịch khám bác sĩ phụ trách: xác nhận, dời lịch, cập nhật lý do."
                icon="calendar_month"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Lịch khám của tôi" },
                ]}
                actions={
                    <Link
                        href="/portal/doctor/appointments/manage-slots"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        Quản lý slot
                    </Link>
                }
            />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {([
                    { key: "today", label: `Hôm nay (${counts.today})` },
                    { key: "need_confirm", label: `Cần xác nhận (${counts.need_confirm})` },
                    { key: "upcoming", label: `Sắp tới (${counts.upcoming})` },
                    { key: "done", label: `Đã xong (${counts.done})` },
                    { key: "all", label: `Tất cả (${items.length})` },
                ] as { key: TabKey; label: string }[]).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${tab === t.key
                            ? "bg-[#3C81C6] text-white border-[#3C81C6]"
                            : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e] text-[#121417] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Filter bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                    placeholder="Lọc theo ngày"
                />
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                </select>
                <select
                    value={filterRoom}
                    onChange={e => setFilterRoom(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                >
                    <option value="ALL">Tất cả phòng</option>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm bệnh nhân / mã lịch…"
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-[#687582] dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Mã lịch</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Ngày</th>
                                <th className="text-left px-4 py-3">Giờ</th>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Dịch vụ</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8}><EmptyState icon="event_busy" title="Không có lịch khám" description="Không có lịch nào khớp bộ lọc hiện tại." variant="default" /></td></tr>
                            ) : filtered.map(item => {
                                const st = STATUS_LABEL[item.status] ?? { text: item.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{item.patientName}</td>
                                        <td className="px-4 py-3">{formatDate(item.date)}</td>
                                        <td className="px-4 py-3">{formatTime(item.slot)}{item.slotEnd ? ` – ${formatTime(item.slotEnd)}` : ""}</td>
                                        <td className="px-4 py-3">{item.room ?? "—"}</td>
                                        <td className="px-4 py-3">{item.serviceName ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.text}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {item.status === "PENDING" && (
                                                    <button
                                                        onClick={() => onConfirm(item.id)}
                                                        className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                                                        title="Xác nhận"
                                                    >
                                                        Xác nhận
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onOpen(item)}
                                                    className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-[#121417] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail drawer / modal */}
            {selected && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">Chi tiết lịch khám</h3>
                                <p className="text-xs text-[#687582] mt-0.5">Mã: <span className="font-mono">{selected.code}</span></p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Bệnh nhân</p>
                                    <p className="font-medium text-[#121417] dark:text-white">{selected.patientName}</p>
                                    {selected.phone && <p className="text-xs text-[#687582]">{selected.phone}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Thời gian</p>
                                    <p className="font-medium text-[#121417] dark:text-white">
                                        {formatDate(selected.date)} • {formatTime(selected.slot)}
                                        {selected.slotEnd ? ` – ${formatTime(selected.slotEnd)}` : ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Phòng khám</p>
                                    <p className="font-medium">{selected.room ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Dịch vụ</p>
                                    <p className="font-medium">{selected.serviceName ?? "—"}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-[#687582] mb-1">Trạng thái</p>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABEL[selected.status]?.cls ?? "bg-gray-100 text-gray-700"}`}>
                                        {STATUS_LABEL[selected.status]?.text ?? selected.status}
                                    </span>
                                </div>
                            </div>

                            {/* Visit reason */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-[#687582]">Lý do khám</p>
                                    {!editReason && (
                                        <button onClick={() => setEditReason(true)} className="text-xs text-[#3C81C6] hover:underline">
                                            Cập nhật
                                        </button>
                                    )}
                                </div>
                                {editReason ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={reasonValue}
                                            onChange={e => setReasonValue(e.target.value)}
                                            rows={3}
                                            className="px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-sm"
                                            placeholder="Lý do khám…"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={onSaveReason}
                                                disabled={saving}
                                                className="px-3 py-1.5 text-xs rounded-md bg-[#3C81C6] text-white disabled:opacity-50"
                                            >
                                                Lưu
                                            </button>
                                            <button
                                                onClick={() => { setEditReason(false); setReasonValue(selected.reason ?? ""); }}
                                                className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800"
                                            >
                                                Huỷ
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm">{selected.reason ?? <span className="text-[#687582] italic">Chưa có</span>}</p>
                                )}
                            </div>

                            {/* Reschedule */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-[#687582]">Dời lịch</p>
                                    {!rescheduleMode && (
                                        <button onClick={() => setRescheduleMode(true)} className="text-xs text-[#3C81C6] hover:underline">
                                            Dời lịch
                                        </button>
                                    )}
                                </div>
                                {rescheduleMode && (
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="date"
                                            value={rescheduleDate}
                                            onChange={e => setRescheduleDate(e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={onCheckConflict}
                                                className="px-3 py-1.5 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                                            >
                                                Kiểm tra conflict
                                            </button>
                                            <button
                                                onClick={onReschedule}
                                                disabled={saving || !rescheduleDate}
                                                className="px-3 py-1.5 text-xs rounded-md bg-[#3C81C6] text-white disabled:opacity-50"
                                            >
                                                Xác nhận dời
                                            </button>
                                            <button
                                                onClick={() => { setRescheduleMode(false); setConflictMsg(null); }}
                                                className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800"
                                            >
                                                Huỷ
                                            </button>
                                        </div>
                                        {conflictMsg && (
                                            <p className={`text-xs ${conflictMsg.includes("Không") ? "text-emerald-600" : "text-amber-600"}`}>
                                                {conflictMsg}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick links */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4 flex flex-wrap gap-2">
                                {selected.patientId && (
                                    <Link
                                        href={`/portal/doctor/medical-records?patientId=${selected.patientId}`}
                                        className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                                    >
                                        Hồ sơ bệnh nhân
                                    </Link>
                                )}
                                {selected.encounterId && (
                                    <Link
                                        href={`/portal/doctor/encounters/${selected.encounterId}`}
                                        className="text-xs px-2 py-1 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300"
                                    >
                                        Xem encounter
                                    </Link>
                                )}
                                <Link
                                    href="/portal/doctor/queue"
                                    className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
                                >
                                    Mở queue hôm nay
                                </Link>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-between gap-3">
                            <div className="flex gap-2">
                                {selected.status === "PENDING" && (
                                    <>
                                        <button
                                            onClick={() => onConfirm(selected.id)}
                                            className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white"
                                        >
                                            Xác nhận
                                        </button>
                                        <button
                                            onClick={() => onResend(selected.id)}
                                            className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800"
                                        >
                                            Gửi lại
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!["COMPLETED", "CANCELLED"].includes(selected.status) && (
                                    <button
                                        onClick={() => onCancel(selected.id)}
                                        className="px-3 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    >
                                        Huỷ lịch
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelected(null)}
                                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
